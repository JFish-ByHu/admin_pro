import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException
} from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { In, Repository } from 'typeorm'
import { formatDateTime } from '../../common/utils/date-time.util'
import { Menu } from '../menu/entities/menu.entity'
import { Permission } from '../user/entities/permission.entity'
import { Role } from '../user/entities/role.entity'
import { User } from '../user/entities/user.entity'
import { CreateRoleDto } from './dto/create-role.dto'
import { UpdateRoleDto } from './dto/update-role.dto'
import { QueryRoleDto } from './dto/query-role.dto'
import {
  RoleDetailResponseDto,
  RoleListResponseDto,
  RoleResponseDto,
  RoleUserGrantDetailResponseDto
} from './dto/role-response.dto'

@Injectable()
export class RoleService {
  constructor(
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
    @InjectRepository(Permission)
    private readonly permissionRepository: Repository<Permission>,
    @InjectRepository(Menu)
    private readonly menuRepository: Repository<Menu>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>
  ) {}

  private toRoleResponse(role: Role): RoleResponseDto {
    return {
      id: role.id,
      code: role.code,
      name: role.name,
      description: role.description,
      isSystem: role.isSystem,
      isActive: role.isActive,
      permissionCount: role.permissions?.length || 0,
      menuCount: role.menus?.length || 0,
      userCount: role.users?.length || 0,
      createTime: formatDateTime(role.createTime),
      updateTime: formatDateTime(role.updateTime)
    }
  }

  private toRoleDetailResponse(role: Role): RoleDetailResponseDto {
    return {
      ...this.toRoleResponse(role),
      permissionIds: (role.permissions || []).map(item => item.id),
      menuIds: (role.menus || []).map(item => item.id)
    }
  }

  private async countActiveSuperUsersExcluding(userIds: string[]): Promise<number> {
    const qb = this.userRepository
      .createQueryBuilder('user')
      .leftJoin('user.roles', 'roleRef')
      .where('user.isActive = :isActive', { isActive: true })
      .andWhere('roleRef.code = :code', { code: 'super' })

    if (userIds.length > 0) {
      qb.andWhere('user.id NOT IN (:...userIds)', { userIds })
    }

    return qb.getCount()
  }

  private async getRoleByCode(code: string): Promise<Role | null> {
    return this.roleRepository.findOne({ where: { code } })
  }

  private async loadRelationsByIds(
    permissionIds: string[],
    menuIds: string[]
  ): Promise<{ permissions: Permission[]; menus: Menu[] }> {
    const permissions = permissionIds.length
      ? await this.permissionRepository.findBy({ id: In(permissionIds) })
      : []

    if (permissions.length !== permissionIds.length) {
      throw new BadRequestException('角色权限包含无效 permissionId')
    }

    const menus = menuIds.length ? await this.menuRepository.findBy({ id: In(menuIds) }) : []

    if (menus.length !== menuIds.length) {
      throw new BadRequestException('角色菜单包含无效 menuId')
    }

    return {
      permissions,
      menus
    }
  }

  async list(query: QueryRoleDto): Promise<RoleListResponseDto> {
    const { keyword, status, all = false, page = 1, pageSize = 20 } = query

    const qb = this.roleRepository
      .createQueryBuilder('role')
      .leftJoinAndSelect('role.permissions', 'permission')
      .leftJoinAndSelect('role.menus', 'menu')
      .leftJoinAndSelect('role.users', 'user')

    if (keyword) {
      qb.andWhere('(role.name LIKE :kw OR role.code LIKE :kw)', { kw: `%${keyword}%` })
    }

    if (status) {
      qb.andWhere('role.isActive = :isActive', { isActive: status === 'enabled' })
    }

    qb.orderBy('role.createTime', 'DESC')

    const total = await qb.getCount()
    const data = all
      ? await qb.getMany()
      : await qb
          .skip((page - 1) * pageSize)
          .take(pageSize)
          .getMany()

    return {
      list: data.map(item => this.toRoleResponse(item)),
      total,
      page: all ? 1 : page,
      pageSize: all ? data.length : pageSize
    }
  }

  async detail(id: string): Promise<RoleDetailResponseDto> {
    const role = await this.roleRepository.findOne({
      where: { id },
      relations: { permissions: true, menus: true, users: true }
    })

    if (!role) {
      throw new NotFoundException('角色不存在')
    }

    return this.toRoleDetailResponse(role)
  }

  async add(dto: CreateRoleDto): Promise<RoleDetailResponseDto> {
    const codeExists = await this.getRoleByCode(dto.code)
    if (codeExists) {
      throw new ConflictException('角色编码已存在')
    }

    const { permissions, menus } = await this.loadRelationsByIds(
      dto.permissionIds || [],
      dto.menuIds || []
    )

    const role = this.roleRepository.create({
      code: dto.code,
      name: dto.name,
      description: dto.description || null,
      isSystem: dto.isSystem ?? false,
      isActive: dto.isActive ?? true,
      permissions,
      menus
    })

    const saved = await this.roleRepository.save(role)
    const latest = await this.roleRepository.findOne({
      where: { id: saved.id },
      relations: { permissions: true, menus: true, users: true }
    })

    if (!latest) {
      throw new NotFoundException('角色创建后读取失败')
    }

    return this.toRoleDetailResponse(latest)
  }

  async update(id: string, dto: UpdateRoleDto): Promise<RoleDetailResponseDto> {
    const role = await this.roleRepository.findOne({
      where: { id },
      relations: { permissions: true, menus: true, users: true }
    })

    if (!role) {
      throw new NotFoundException('角色不存在')
    }

    if (dto.name !== undefined) role.name = dto.name
    if (dto.description !== undefined) role.description = dto.description || null
    if (dto.isActive !== undefined) role.isActive = dto.isActive

    if (dto.permissionIds !== undefined || dto.menuIds !== undefined) {
      const { permissions, menus } = await this.loadRelationsByIds(
        dto.permissionIds || role.permissions.map(item => item.id),
        dto.menuIds || role.menus.map(item => item.id)
      )

      role.permissions = permissions
      role.menus = menus
    }

    const saved = await this.roleRepository.save(role)
    return this.toRoleDetailResponse(saved)
  }

  async delete(id: string): Promise<void> {
    const role = await this.roleRepository.findOne({
      where: { id },
      relations: { users: true }
    })
    if (!role) {
      throw new NotFoundException('角色不存在')
    }

    if (role.isSystem) {
      throw new BadRequestException('系统内置角色不允许删除')
    }

    if ((role.users || []).length > 0) {
      throw new BadRequestException('角色下仍存在用户绑定，不能删除')
    }

    await this.roleRepository.remove(role)
  }

  async batchDelete(ids: string[]): Promise<{ deleted: number }> {
    if (!ids || ids.length === 0) {
      throw new BadRequestException('请提供要删除的角色 ID')
    }

    const roles = await this.roleRepository.find({
      where: { id: In(ids) },
      relations: { users: true }
    })
    if (roles.length === 0) {
      throw new NotFoundException('未找到可删除的角色')
    }

    const hasSystemRole = roles.some(item => item.isSystem)
    if (hasSystemRole) {
      throw new BadRequestException('批量删除中包含系统内置角色，操作已拒绝')
    }

    const hasBoundUsers = roles.some(item => (item.users || []).length > 0)
    if (hasBoundUsers) {
      throw new BadRequestException('批量删除中存在已绑定用户的角色，操作已拒绝')
    }

    await this.roleRepository.remove(roles)
    return { deleted: roles.length }
  }

  async getRoleUserGrantDetail(roleId: string): Promise<RoleUserGrantDetailResponseDto> {
    const role = await this.roleRepository.findOne({
      where: { id: roleId },
      relations: { users: true }
    })

    if (!role) {
      throw new NotFoundException('角色不存在')
    }

    return {
      roleId,
      checkedUserIds: (role.users || []).map(item => item.id)
    }
  }

  async updateRoleUserGrant(roleId: string, userIds: string[]): Promise<void> {
    const role = await this.roleRepository.findOne({
      where: { id: roleId },
      relations: { users: true }
    })

    if (!role) {
      throw new NotFoundException('角色不存在')
    }

    const users = userIds.length ? await this.userRepository.findBy({ id: In(userIds) }) : []

    if (users.length !== userIds.length) {
      throw new BadRequestException('角色用户授权包含无效 userId')
    }

    const hasInactiveUsers = users.some(user => !user.isActive)
    if (hasInactiveUsers) {
      throw new BadRequestException('不能绑定已禁用用户')
    }

    if (role.code === 'super') {
      const remainSuperUsers = await this.countActiveSuperUsersExcluding(userIds)
      if (remainSuperUsers < 1 && users.length === 0) {
        throw new BadRequestException('系统至少需要保留一个激活的超级管理员用户')
      }
    }

    role.users = users
    await this.roleRepository.save(role)
  }

  async listSimple(): Promise<Array<{ id: string; code: string; name: string }>> {
    const roles = await this.roleRepository.find({
      select: {
        id: true,
        code: true,
        name: true
      },
      where: { isActive: true },
      order: { createTime: 'ASC' }
    })

    return roles.map(item => ({
      id: item.id,
      code: item.code,
      name: item.name
    }))
  }
}
