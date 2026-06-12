import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToMany,
  JoinTable
} from 'typeorm'
import { Role } from './role.entity'

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column({ type: 'varchar', length: 50, unique: true })
  username!: string

  @Column({ type: 'varchar', length: 100, unique: true })
  email!: string

  @Column({ type: 'varchar', length: 255 })
  passwordHash!: string

  @Column({ type: 'varchar', length: 50, nullable: true })
  nickname!: string | null

  @Column({ type: 'varchar', length: 255, nullable: true })
  avatarUrl!: string | null

  @Column({ type: 'varchar', length: 20, default: 'user' })
  role!: string // 兼容字段：用于前端展示/简单筛选，非真实权限来源

  @ManyToMany(() => Role, role => role.users, {
    cascade: true
  })
  @JoinTable({
    name: 'user_roles',
    joinColumn: { name: 'userId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'roleId', referencedColumnName: 'id' }
  })
  roles!: Role[] // 真实权限来源：用户角色关系及其下挂权限均以此字段为准

  @Column({ type: 'boolean', default: true })
  isActive!: boolean

  @CreateDateColumn()
  createTime!: Date

  @UpdateDateColumn()
  updateTime!: Date

  @Column({ type: 'datetime', nullable: true })
  lastLoginAt!: Date | null

  getDisplayRole(): string {
    return this.role
  }

  getPermissionCodes(): string[] {
    return Array.from(
      new Set(
        this.roles
          ?.filter(role => role.isActive !== false)
          .flatMap(
            role =>
              role.permissions?.filter(item => item.isActive !== false).map(item => item.code) || []
          ) || []
      )
    )
  }
}
