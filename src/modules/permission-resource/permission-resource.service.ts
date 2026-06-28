import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException
} from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { In, Repository } from 'typeorm'
import { formatDateTime } from '../../core/utils/date-time.util'
import { Permission } from '../user/entities/permission.entity'
import { Role } from '../user/entities/role.entity'
import { CreatePermissionResourceDto } from './dto/create-permission-resource.dto'
import { UpdatePermissionResourceDto } from './dto/update-permission-resource.dto'
import { QueryPermissionResourceDto } from './dto/query-permission-resource.dto'
import {
  PermissionResourceListResponseDto,
  PermissionResourceResponseDto,
  PermissionResourceTreeNodeDto,
  RolePermissionGrantDetailResponseDto
} from './dto/permission-resource-response.dto'
import { GrantRolePermissionDto } from './dto/grant-role-permission.dto'
import { RbacSyncService } from '../../infrastructure/ws/rbac-sync.service'
import { PermissionGroupService } from '../permission-group/permission-group.service'

@Injectable()
export class PermissionResourceService {
  constructor(
    @InjectRepository(Permission)
    private readonly permissionRepository: Repository<Permission>,
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
    private readonly rbacSyncService: RbacSyncService,
    private readonly permissionGroupService: PermissionGroupService
  ) {}

  private toPermissionResponse(permission: Permission): PermissionResourceResponseDto {
    return {
      id: permission.id,
      groupCode: permission.groupCode,
      name: permission.name,
      type: permission.type,
      permissionCode: permission.code,
      apiPath: permission.apiPath || '',
      httpMethod: permission.httpMethod || '',
      sort: permission.sort,
      status: permission.isActive ? 'enabled' : 'disabled',
      createTime: formatDateTime(permission.createTime),
      updateTime: formatDateTime(permission.updateTime)
    }
  }

  /**
   * 构建树形结构：按 groupCode 分组，每组下挂叶子节点
   * groupCode 相同的权限平级排列，无父子关系
   * 分组名称从 PermissionGroup 表动态查询
   */
  private async buildTree(items: Permission[]): Promise<PermissionResourceTreeNodeDto[]> {
    const groupMap = new Map<string, PermissionResourceTreeNodeDto>()
    const ungrouped: PermissionResourceTreeNodeDto[] = []

    // 1) 先从分组表拉取所有活跃分组，确保空分组也能在树中展示
    const allGroups = await this.permissionGroupService.list()
    const groupNameMap = new Map<string, string>()

    allGroups.forEach(g => {
      groupNameMap.set(g.code, g.name)
      groupMap.set(g.code, {
        id: `__group__${g.code}`,
        groupCode: g.code,
        name: g.name,
        type: 'api',
        permissionCode: '',
        apiPath: '',
        httpMethod: '',
        sort: g.sort,
        status: g.isActive ? 'enabled' : 'disabled',
        createTime: g.createTime,
        updateTime: g.updateTime,
        children: []
      })
    })

    // 2) 把权限叶子节点挂到对应分组下；无分组权限放 ungrouped
    items.forEach(item => {
      const node: PermissionResourceTreeNodeDto = {
        ...this.toPermissionResponse(item),
        children: []
      }

      if (item.groupCode) {
        if (!groupMap.has(item.groupCode)) {
          const groupName = groupNameMap.get(item.groupCode) || item.groupCode
          groupMap.set(item.groupCode, {
            id: `__group__${item.groupCode}`,
            groupCode: item.groupCode,
            name: groupName,
            type: 'api',
            permissionCode: '',
            apiPath: '',
            httpMethod: '',
            sort: 0,
            status: 'enabled',
            createTime: '',
            updateTime: '',
            children: []
          })
        }

        groupMap.get(item.groupCode)!.children.push(node)
      } else {
        ungrouped.push(node)
      }
    })

    const roots: PermissionResourceTreeNodeDto[] = []

    const sortedGroups = Array.from(groupMap.entries()).sort(([a], [b]) => a.localeCompare(b))

    sortedGroups.forEach(([, groupNode]) => {
      groupNode.children.sort((a, b) => a.sort - b.sort)
      roots.push(groupNode)
    })

    ungrouped.sort((a, b) => a.sort - b.sort)
    roots.push(...ungrouped)

    return roots
  }

  private async getRoleIdsByPermissionIds(permissionIds: string[]): Promise<string[]> {
    if (!permissionIds.length) {
      return []
    }

    const roleRows = await this.roleRepository
      .createQueryBuilder('role')
      .leftJoin('role.permissions', 'permission')
      .select('role.id', 'id')
      .where('permission.id IN (:...permissionIds)', { permissionIds })
      .getRawMany<{ id: string }>()

    return Array.from(new Set(roleRows.map(row => row.id)))
  }

  async list(query: QueryPermissionResourceDto): Promise<PermissionResourceListResponseDto> {
    const { keyword, type, status, all = false, page = 1, pageSize = 20 } = query

    const qb = this.permissionRepository.createQueryBuilder('permission')

    if (keyword) {
      qb.andWhere(
        '(permission.name LIKE :kw OR permission.code LIKE :kw OR permission.apiPath LIKE :kw)',
        { kw: `%${keyword}%` }
      )
    }

    if (type) {
      qb.andWhere('permission.type = :type', { type })
    }

    if (status) {
      qb.andWhere('permission.isActive = :isActive', { isActive: status === 'enabled' })
    }

    qb.orderBy('permission.sort', 'ASC').addOrderBy('permission.createTime', 'DESC')

    const total = await qb.getCount()
    const data = all
      ? await qb.getMany()
      : await qb
          .skip((page - 1) * pageSize)
          .take(pageSize)
          .getMany()

    return {
      list: data.map(item => this.toPermissionResponse(item)),
      total,
      page: all ? 1 : page,
      pageSize: all ? data.length : pageSize
    }
  }

  async tree(): Promise<PermissionResourceTreeNodeDto[]> {
    const data = await this.permissionRepository.find({
      order: {
        sort: 'ASC',
        createTime: 'DESC'
      }
    })

    return await this.buildTree(data)
  }

  async detail(id: string): Promise<PermissionResourceResponseDto> {
    const item = await this.permissionRepository.findOne({ where: { id } })
    if (!item) {
      throw new NotFoundException('权限资源不存在')
    }

    return this.toPermissionResponse(item)
  }

  async add(dto: CreatePermissionResourceDto): Promise<PermissionResourceResponseDto> {
    const codeExists = await this.permissionRepository.findOne({
      where: { code: dto.permissionCode }
    })
    if (codeExists) {
      throw new ConflictException('permissionCode 已存在')
    }

    const item = this.permissionRepository.create({
      groupCode: dto.groupCode || null,
      name: dto.name,
      code: dto.permissionCode,
      type: dto.type,
      apiPath: dto.apiPath || null,
      httpMethod: dto.httpMethod || null,
      sort: dto.sort ?? 0,
      isActive: dto.isActive ?? true
    })

    const saved = await this.permissionRepository.save(item)

    const superRoleIds = (
      await this.roleRepository.find({
        select: { id: true },
        where: { code: 'super', isActive: true }
      })
    ).map(role => role.id)
    this.rbacSyncService.emitToRoles(superRoleIds, { scope: 'permission' })

    return this.toPermissionResponse(saved)
  }

  async update(
    id: string,
    dto: UpdatePermissionResourceDto
  ): Promise<PermissionResourceResponseDto> {
    const item = await this.permissionRepository.findOne({ where: { id } })
    if (!item) {
      throw new NotFoundException('权限资源不存在')
    }

    const impactedRoleIds = await this.getRoleIdsByPermissionIds([id])

    if (dto.permissionCode && dto.permissionCode !== item.code) {
      const codeExists = await this.permissionRepository.findOne({
        where: { code: dto.permissionCode }
      })
      if (codeExists) {
        throw new ConflictException('permissionCode 已存在')
      }
    }

    if (dto.name !== undefined) item.name = dto.name
    if (dto.permissionCode !== undefined) item.code = dto.permissionCode
    if (dto.type !== undefined) item.type = dto.type
    if (dto.groupCode !== undefined) item.groupCode = dto.groupCode || null
    if (dto.apiPath !== undefined) item.apiPath = dto.apiPath || null
    if (dto.httpMethod !== undefined) item.httpMethod = dto.httpMethod || null
    if (dto.sort !== undefined) item.sort = dto.sort
    if (dto.isActive !== undefined) item.isActive = dto.isActive

    const saved = await this.permissionRepository.save(item)
    this.rbacSyncService.emitToRoles(impactedRoleIds, { scope: 'permission' })
    return this.toPermissionResponse(saved)
  }

  async delete(id: string): Promise<void> {
    const item = await this.permissionRepository.findOne({ where: { id } })
    if (!item) {
      throw new NotFoundException('权限资源不存在')
    }

    const impactedRoleIds = await this.getRoleIdsByPermissionIds([id])

    await this.permissionRepository.remove(item)
    this.rbacSyncService.emitToRoles(impactedRoleIds, { scope: 'permission' })
  }

  async batchDelete(ids: string[]): Promise<{ deleted: number }> {
    if (!ids || ids.length === 0) {
      throw new BadRequestException('请提供要删除的权限资源 ID')
    }

    const list = await this.permissionRepository.findBy({ id: In(ids) })
    if (list.length === 0) {
      throw new NotFoundException('未找到可删除的权限资源')
    }

    const impactedRoleIds = await this.getRoleIdsByPermissionIds(ids)

    await this.permissionRepository.remove(list)
    this.rbacSyncService.emitToRoles(impactedRoleIds, { scope: 'permission' })
    return { deleted: list.length }
  }

  async getRoleGrantDetail(roleId: string): Promise<RolePermissionGrantDetailResponseDto> {
    const role = await this.roleRepository.findOne({
      where: { id: roleId },
      relations: { permissions: true }
    })

    if (!role) {
      throw new NotFoundException('角色不存在')
    }

    return {
      roleId,
      checkedPermissionIds: (role.permissions || []).map(item => item.id)
    }
  }

  async updateRoleGrant(dto: GrantRolePermissionDto): Promise<void> {
    const role = await this.roleRepository.findOne({
      where: { id: dto.roleId },
      relations: { permissions: true }
    })

    if (!role) {
      throw new NotFoundException('角色不存在')
    }

    const permissions = dto.permissionIds.length
      ? await this.permissionRepository.findBy({ id: In(dto.permissionIds) })
      : []

    if (permissions.length !== dto.permissionIds.length) {
      throw new BadRequestException('权限授权数据包含无效权限 ID')
    }

    role.permissions = permissions
    await this.roleRepository.save(role)

    this.rbacSyncService.emitToRoles([role.id], {
      scope: 'permission',
      roleId: role.id
    })
  }
}
