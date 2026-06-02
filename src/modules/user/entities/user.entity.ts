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
  id: string

  @Column({ type: 'varchar', length: 50, unique: true })
  username: string

  @Column({ type: 'varchar', length: 100, unique: true })
  email: string

  @Column({ type: 'varchar', length: 255 })
  passwordHash: string

  @Column({ type: 'varchar', length: 50, nullable: true })
  nickname: string

  @Column({ type: 'varchar', length: 255, nullable: true })
  avatarUrl: string

  @Column({ type: 'varchar', length: 20, default: 'user' })
  role: string // 兼容保留的旧版单角色标识，用于简单 RBAC

  @ManyToMany(() => Role, role => role.users, {
    cascade: true
  })
  @JoinTable({
    name: 'user_roles',
    joinColumn: { name: 'userId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'roleId', referencedColumnName: 'id' }
  })
  roles: Role[] // 新版多角色映射，用于细粒度权限控制

  @Column({ type: 'boolean', default: true })
  isActive: boolean

  @CreateDateColumn()
  createTime: Date

  @UpdateDateColumn()
  updateTime: Date

  @Column({ type: 'datetime', nullable: true })
  lastLoginAt: Date
}
