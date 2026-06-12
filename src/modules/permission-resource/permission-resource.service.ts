import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException
} from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { In, Repository } from 'typeorm'
import { formatDateTime } from '../../common/utils/date-time.util'
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

@Injectable()
export class PermissionResourceService {
  constructor(
    @InjectRepository(Permission)
    private readonly permissionRepository: Repository<Permission>,
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>
  ) {}

  private toPermissionResponse(permission: Permission): PermissionResourceResponseDto {
    return {
      id: permission.id,
      parentId: permission.parentId,
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

  private async ensureParentValid(
    parentId: string | null | undefined,
    currentId?: string
  ): Promise<void> {
    if (!parentId) {
      return
    }

    if (currentId && currentId === parentId) {
      throw new BadRequestException('父级权限不能是自己')
    }

    const parent = await this.permissionRepository.findOne({ where: { id: parentId } })
    if (!parent) {
      throw new BadRequestException('父级权限不存在')
    }

    if (!currentId) {
      return
    }

    const allItems = await this.permissionRepository.find({
      select: {
        id: true,
        parentId: true
      }
    })

    const childrenMap = new Map<string, string[]>()
    allItems.forEach(item => {
      if (!item.parentId) {
        return
      }
      const children = childrenMap.get(item.parentId) || []
      children.push(item.id)
      childrenMap.set(item.parentId, children)
    })

    const stack = [currentId]
    const descendants = new Set<string>()

    while (stack.length > 0) {
      const nodeId = stack.pop() as string
      const children = childrenMap.get(nodeId) || []
      children.forEach(childId => {
        if (!descendants.has(childId)) {
          descendants.add(childId)
          stack.push(childId)
        }
      })
    }

    if (descendants.has(parentId)) {
      throw new BadRequestException('父级权限不能是当前权限的子节点')
    }
  }

  private buildTree(items: Permission[]): PermissionResourceTreeNodeDto[] {
    const nodeMap = new Map<string, PermissionResourceTreeNodeDto>()

    items.forEach(item => {
      nodeMap.set(item.id, {
        ...this.toPermissionResponse(item),
        children: []
      })
    })

    const roots: PermissionResourceTreeNodeDto[] = []

    nodeMap.forEach(node => {
      if (!node.parentId) {
        roots.push(node)
        return
      }

      const parent = nodeMap.get(node.parentId)
      if (parent) {
        parent.children.push(node)
      } else {
        roots.push(node)
      }
    })

    const sortTree = (nodes: PermissionResourceTreeNodeDto[]) => {
      nodes.sort((a, b) => a.sort - b.sort)
      nodes.forEach(node => {
        if (node.children.length > 0) {
          sortTree(node.children)
        }
      })
    }

    sortTree(roots)
    return roots
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

    return this.buildTree(data)
  }

  async detail(id: string): Promise<PermissionResourceResponseDto> {
    const item = await this.permissionRepository.findOne({ where: { id } })
    if (!item) {
      throw new NotFoundException('权限资源不存在')
    }

    return this.toPermissionResponse(item)
  }

  async add(dto: CreatePermissionResourceDto): Promise<PermissionResourceResponseDto> {
    await this.ensureParentValid(dto.parentId)

    const codeExists = await this.permissionRepository.findOne({
      where: { code: dto.permissionCode }
    })
    if (codeExists) {
      throw new ConflictException('permissionCode 已存在')
    }

    const item = this.permissionRepository.create({
      parentId: dto.parentId || null,
      name: dto.name,
      code: dto.permissionCode,
      type: dto.type,
      apiPath: dto.apiPath || null,
      httpMethod: dto.httpMethod || null,
      sort: dto.sort ?? 0,
      isActive: dto.isActive ?? true
    })

    const saved = await this.permissionRepository.save(item)
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

    if (dto.parentId !== undefined) {
      await this.ensureParentValid(dto.parentId, id)
      item.parentId = dto.parentId || null
    }

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
    if (dto.apiPath !== undefined) item.apiPath = dto.apiPath || null
    if (dto.httpMethod !== undefined) item.httpMethod = dto.httpMethod || null
    if (dto.sort !== undefined) item.sort = dto.sort
    if (dto.isActive !== undefined) item.isActive = dto.isActive

    const saved = await this.permissionRepository.save(item)
    return this.toPermissionResponse(saved)
  }

  async delete(id: string): Promise<void> {
    const item = await this.permissionRepository.findOne({ where: { id } })
    if (!item) {
      throw new NotFoundException('权限资源不存在')
    }

    const hasChildren = await this.permissionRepository.findOne({ where: { parentId: id } })
    if (hasChildren) {
      throw new BadRequestException('当前权限存在子节点，不能直接删除')
    }

    await this.permissionRepository.remove(item)
  }

  async batchDelete(ids: string[]): Promise<{ deleted: number }> {
    if (!ids || ids.length === 0) {
      throw new BadRequestException('请提供要删除的权限资源 ID')
    }

    const list = await this.permissionRepository.findBy({ id: In(ids) })
    if (list.length === 0) {
      throw new NotFoundException('未找到可删除的权限资源')
    }

    const hasChildren = await this.permissionRepository
      .createQueryBuilder('permission')
      .where('permission.parentId IN (:...ids)', { ids })
      .getCount()

    if (hasChildren > 0) {
      throw new BadRequestException('批量删除失败，所选权限中包含父节点')
    }

    await this.permissionRepository.remove(list)
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
  }
}
