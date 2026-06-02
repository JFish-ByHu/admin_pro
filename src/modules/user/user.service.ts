import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { User } from './entities/user.entity'

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>
  ) {}

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
      relations: {
        roles: {
          permissions: true
        }
      } // 登录时也级联查出权限
    })
  }

  // 根据 ID 查找用户（附带角色和权限关联数据）
  async findById(id: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { id },
      relations: {
        roles: {
          permissions: true
        }
      } // 级联查询出该用户的所有权限
    })
  }

  // 创建用户
  async create(userData: Partial<User>): Promise<User> {
    const user = this.userRepository.create(userData)
    return this.userRepository.save(user)
  }

  // 更新最后登录时间
  async updateLastLogin(id: string): Promise<void> {
    await this.userRepository.update(id, { lastLoginAt: new Date() })
  }
}
