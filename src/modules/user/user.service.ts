import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException
} from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository, In } from 'typeorm'
import { User } from './entities/user.entity'
import { CreateUserDto } from './dto/create-user.dto'
import { UpdateUserDto } from './dto/update-user.dto'
import { QueryUserDto } from './dto/query-user.dto'
import { PasswordUtil } from '../../common/utils/password.util'
import { UserListResponseDto, UserResponseDto } from './dto/user-response.dto'

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>
  ) {}

  private toUserResponseDto(user: User): UserResponseDto {
    const { passwordHash, ...result } = user
    void passwordHash

    return {
      id: result.id,
      username: result.username,
      email: result.email,
      nickname: result.nickname,
      avatarUrl: result.avatarUrl,
      role: result.role,
      isActive: result.isActive,
      createTime: result.createTime,
      updateTime: result.updateTime,
      lastLoginAt: result.lastLoginAt
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
      relations: { roles: { permissions: true } }
    })
  }

  // 根据 ID 查找用户（附带角色和权限关联数据）
  async findById(id: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { id },
      relations: { roles: { permissions: true } }
    })
  }

  // 更新最后登录时间
  async updateLastLogin(id: string): Promise<void> {
    await this.userRepository.update(id, { lastLoginAt: new Date() })
  }

  // ─── 用户管理 CRUD ───────────────────────────────────────────────────────────

  /**
   * 分页查询用户列表
   * 支持关键词（用户名/昵称/邮箱）、角色、状态筛选
   */
  async findAll(query: QueryUserDto): Promise<UserListResponseDto> {
    const { keyword, role, status, page = 1, pageSize = 20 } = query

    const qb = this.userRepository
      .createQueryBuilder('user')
      .select([
        'user.id',
        'user.username',
        'user.email',
        'user.nickname',
        'user.avatarUrl',
        'user.role',
        'user.isActive',
        'user.createTime',
        'user.updateTime',
        'user.lastLoginAt'
      ])

    if (keyword) {
      qb.andWhere('(user.username LIKE :kw OR user.nickname LIKE :kw OR user.email LIKE :kw)', {
        kw: `%${keyword}%`
      })
    }

    if (role) {
      qb.andWhere('user.role = :role', { role })
    }

    if (status) {
      qb.andWhere('user.isActive = :isActive', { isActive: status === 'enabled' })
    }

    const total = await qb.getCount()
    const list = await qb
      .orderBy('user.createTime', 'DESC')
      .skip((page - 1) * pageSize)
      .take(pageSize)
      .getMany()

    return {
      list: list.map(user => this.toUserResponseDto(user)),
      total,
      page,
      pageSize
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
        role: true,
        isActive: true,
        createTime: true,
        updateTime: true,
        lastLoginAt: true
      }
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
      role: dto.role ?? 'user',
      isActive: dto.isActive ?? true
    })

    const saved = await this.userRepository.save(user)

    return this.toUserResponseDto(saved)
  }

  /**
   * 更新用户信息
   */
  async updateUser(id: string, dto: UpdateUserDto): Promise<UserResponseDto> {
    const user = await this.userRepository.findOne({ where: { id } })
    if (!user) {
      throw new NotFoundException(`用户 ${id} 不存在`)
    }

    // 邮箱唯一性校验（排除自身）
    if (dto.email && dto.email !== user.email) {
      const emailOwner = await this.userRepository.findOne({ where: { email: dto.email } })
      if (emailOwner) {
        throw new ConflictException('邮箱已被其他用户使用')
      }
    }

    if (dto.password) {
      user.passwordHash = await PasswordUtil.hash(dto.password)
    }
    if (dto.email !== undefined) user.email = dto.email
    if (dto.nickname !== undefined) user.nickname = dto.nickname
    if (dto.avatarUrl !== undefined) user.avatarUrl = dto.avatarUrl
    if (dto.role !== undefined) user.role = dto.role
    if (dto.isActive !== undefined) user.isActive = dto.isActive

    const saved = await this.userRepository.save(user)
    return this.toUserResponseDto(saved)
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
    const user = this.userRepository.create(userData)
    return this.userRepository.save(user)
  }
}
