import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException
} from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository, In } from 'typeorm'
import { User } from './entities/user.entity'
import { Role } from './entities/role.entity'
import { CreateUserDto } from './dto/create-user.dto'
import { UpdateUserDto } from './dto/update-user.dto'
import { QueryUserDto } from './dto/query-user.dto'
import { PasswordUtil } from '../../core/utils/password.util'
import { formatDateTime } from '../../core/utils/date-time.util'
import { resolvePublicAssetUrl } from '../../core/utils/asset-url.util'
import { UserListResponseDto, UserResponseDto } from './dto/user-response.dto'

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>
  ) {}

  private async ensureDefaultUserRole(): Promise<Role | null> {
    const role = await this.roleRepository.findOne({ where: { code: 'user', isActive: true } })
    return role || null
  }

  private async countActiveSuperUsersExcluding(userId: string): Promise<number> {
    const count = await this.userRepository
      .createQueryBuilder('user')
      .leftJoin('user.roles', 'roleRef')
      .where('user.id != :userId', { userId })
      .andWhere('user.isActive = :isActive', { isActive: true })
      .andWhere('roleRef.code = :code', { code: 'super' })
      .getCount()

    return count
  }

  private toUserResponseDto(user: User): UserResponseDto {
    const { passwordHash, ...result } = user
    void passwordHash

    const roleIds = (user.roles || []).map(item => item.id)

    return {
      id: result.id,
      username: result.username,
      email: result.email,
      nickname: result.nickname,
      avatarUrl: resolvePublicAssetUrl(result.avatarUrl),
      role: user.getDisplayRole(),
      roleIds,
      isActive: result.isActive,
      createTime: formatDateTime(result.createTime),
      updateTime: formatDateTime(result.updateTime),
      lastLoginAt: result.lastLoginAt ? formatDateTime(result.lastLoginAt) : null
    }
  }

  // ─── 内部通用方法 ────────────────────────────────────────────────────────────

  // 检查用户名或邮箱是否已存在
  async checkUserExists(username: string, email: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: [{ username }, { email }]
    })
  }

  // 根据用户名或邮箱查找用户（用于登录）
  async findByUsernameOrEmail(usernameOrEmail: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: [{ username: usernameOrEmail }, { email: usernameOrEmail }],
      relations: { roles: { permissions: true, menus: true } }
    })
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { email },
      relations: { roles: { permissions: true, menus: true } }
    })
  }

  async findByUsername(username: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { username } })
  }

  // 根据 ID 查找用户（附带角色和权限关联数据）
  async findById(id: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { id },
      relations: { roles: { permissions: true, menus: true } }
    })
  }

  // 更新最后登录时间
  async updateLastLogin(id: string): Promise<void> {
    await this.userRepository.update(id, { lastLoginAt: new Date() })
  }

  // 内部调用：按用户 ID 更新密码哈希
  async updatePasswordHash(id: string, passwordHash: string): Promise<void> {
    await this.userRepository.update(id, { passwordHash })
  }

  // ─── 用户管理 CRUD ───────────────────────────────────────────────────────────

  /**
   * 分页查询用户列表
   * 支持关键词（用户名/昵称/邮箱）、角色、状态筛选
   * 当 all=true 时忽略分页参数，返回全部匹配结果
   */
  async findAll(query: QueryUserDto): Promise<UserListResponseDto> {
    const { keyword, role, status, all = false, page = 1, pageSize = 20 } = query

    const qb = this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.roles', 'roleRef')
      .select([
        'user.id',
        'user.username',
        'user.email',
        'user.nickname',
        'user.avatarUrl',
        'user.isActive',
        'user.createTime',
        'user.updateTime',
        'user.lastLoginAt',
        'roleRef.id',
        'roleRef.code'
      ])

    if (keyword) {
      qb.andWhere('(user.username LIKE :kw OR user.nickname LIKE :kw OR user.email LIKE :kw)', {
        kw: `%${keyword}%`
      })
    }

    if (role) {
      qb.andWhere('roleRef.code = :role', { role })
    }

    if (status) {
      qb.andWhere('user.isActive = :isActive', { isActive: status === 'enabled' })
    }

    const total = await qb.getCount()

    qb.orderBy('user.createTime', 'DESC')

    const list = all
      ? await qb.getMany()
      : await qb
          .skip((page - 1) * pageSize)
          .take(pageSize)
          .getMany()

    return {
      list: list.map(user => this.toUserResponseDto(user)),
      total,
      page: all ? 1 : page,
      pageSize: all ? list.length : pageSize
    }
  }

  /**
   * 查询单个用户详情（不返回密码）
   */
  async findOne(id: string): Promise<UserResponseDto> {
    const user = await this.userRepository.findOne({
      where: { id },
      select: {
        id: true,
        username: true,
        email: true,
        nickname: true,
        avatarUrl: true,
        isActive: true,
        createTime: true,
        updateTime: true,
        lastLoginAt: true
      },
      relations: { roles: true }
    })

    if (!user) {
      throw new NotFoundException(`用户 ${id} 不存在`)
    }

    return this.toUserResponseDto(user)
  }

  /**
   * 创建用户
   */
  async createUser(dto: CreateUserDto): Promise<UserResponseDto> {
    const exists = await this.checkUserExists(dto.username, dto.email)
    if (exists) {
      throw new ConflictException(
        exists.username === dto.username ? '用户名已被占用' : '邮箱已被注册'
      )
    }

    const passwordHash = await PasswordUtil.hash(dto.password)

    const user = this.userRepository.create({
      username: dto.username,
      email: dto.email,
      passwordHash,
      nickname: dto.nickname ?? dto.username,
      avatarUrl: dto.avatarUrl,
      isActive: dto.isActive ?? true
    })

    const saved = await this.userRepository.save(user)

    const defaultRole = await this.ensureDefaultUserRole()
    if (defaultRole) {
      saved.roles = [defaultRole]
      await this.userRepository.save(saved)
    }

    const latest = await this.findById(saved.id)
    if (!latest) {
      throw new NotFoundException(`用户 ${saved.id} 不存在`)
    }

    return this.toUserResponseDto(latest)
  }

  /**
   * 更新用户信息
   */
  async updateUser(id: string, dto: UpdateUserDto): Promise<UserResponseDto> {
    const user = await this.userRepository.findOne({ where: { id } })
    if (!user) {
      throw new NotFoundException(`用户 ${id} 不存在`)
    }

    const normalizedEmail = dto.email?.trim()
    const normalizedNickname = dto.nickname?.trim()
    const normalizedAvatarUrl = dto.avatarUrl?.trim()

    // 邮箱唯一性校验（排除自身）
    if (normalizedEmail && normalizedEmail !== user.email) {
      const emailOwner = await this.userRepository.findOne({ where: { email: normalizedEmail } })
      if (emailOwner) {
        throw new ConflictException('邮箱已被其他用户使用')
      }
    }

    if (dto.password) {
      user.passwordHash = await PasswordUtil.hash(dto.password)
    }
    if (normalizedEmail !== undefined) user.email = normalizedEmail
    if (normalizedNickname !== undefined) user.nickname = normalizedNickname
    if (normalizedAvatarUrl !== undefined) {
      user.avatarUrl = normalizedAvatarUrl || null
    }
    if (dto.isActive !== undefined) user.isActive = dto.isActive

    const saved = await this.userRepository.save(user)
    const latest = await this.findById(saved.id)
    if (!latest) {
      throw new NotFoundException(`用户 ${saved.id} 不存在`)
    }

    return this.toUserResponseDto(latest)
  }

  async assignUserRoles(userId: string, roleIds: string[]): Promise<UserResponseDto> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: { roles: true }
    })

    if (!user) {
      throw new NotFoundException(`用户 ${userId} 不存在`)
    }

    if (roleIds.length === 0) {
      throw new BadRequestException('用户至少需要绑定一个角色')
    }

    const roles = await this.roleRepository.findBy({ id: In(roleIds) })

    if (roles.length !== roleIds.length) {
      throw new BadRequestException('分配角色包含无效 roleId')
    }

    const hasInactiveRole = roles.some(role => !role.isActive)
    if (hasInactiveRole) {
      throw new BadRequestException('不能分配已停用角色')
    }

    const hadSuperRole = (user.roles || []).some(role => role.code === 'super')
    const hasSuperRoleAfterAssign = roles.some(role => role.code === 'super')

    if (hadSuperRole && !hasSuperRoleAfterAssign) {
      const remainSuperUsers = await this.countActiveSuperUsersExcluding(user.id)
      if (remainSuperUsers < 1) {
        throw new BadRequestException('系统至少需要保留一个激活的超级管理员用户')
      }
    }

    user.roles = roles

    const saved = await this.userRepository.save(user)
    return this.toUserResponseDto(saved)
  }

  async getUserRoleDetail(userId: string): Promise<{ userId: string; roleIds: string[] }> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: { roles: true }
    })

    if (!user) {
      throw new NotFoundException(`用户 ${userId} 不存在`)
    }

    return {
      userId,
      roleIds: (user.roles || []).map(item => item.id)
    }
  }

  /**
   * 删除单个用户
   */
  async removeUser(id: string): Promise<void> {
    const user = await this.userRepository.findOne({ where: { id } })
    if (!user) {
      throw new NotFoundException(`用户 ${id} 不存在`)
    }
    await this.userRepository.remove(user)
  }

  /**
   * 批量删除用户
   */
  async batchRemoveUsers(ids: string[]): Promise<{ deleted: number }> {
    if (!ids || ids.length === 0) {
      throw new BadRequestException('请提供要删除的用户 ID 列表')
    }

    const users = await this.userRepository.findBy({ id: In(ids) })
    if (users.length === 0) {
      throw new NotFoundException('未找到任何匹配的用户')
    }

    await this.userRepository.remove(users)
    return { deleted: users.length }
  }

  // 内部调用：创建用户（供 AuthService 注册时使用，保持原有签名不变）
  async create(userData: Partial<User>): Promise<User> {
    const user = this.userRepository.create({
      ...userData
    })

    const saved = await this.userRepository.save(user)

    const defaultRole = await this.ensureDefaultUserRole()
    if (defaultRole) {
      saved.roles = [defaultRole]
      return this.userRepository.save(saved)
    }

    return saved
  }
}
