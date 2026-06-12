import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToMany,
  JoinTable,
  CreateDateColumn,
  UpdateDateColumn
} from 'typeorm'
import { Permission } from './permission.entity'
import { User } from './user.entity'
import { Menu } from '../../menu/entities/menu.entity'

@Entity('roles')
export class Role {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column({ type: 'varchar', length: 50, unique: true })
  code!: string // 例如 'admin'

  @Column({ type: 'varchar', length: 50 })
  name!: string // 例如 '管理员'

  @Column({ type: 'varchar', length: 255, nullable: true })
  description!: string | null

  @Column({ type: 'boolean', default: false })
  isSystem!: boolean

  @Column({ type: 'boolean', default: true })
  isActive!: boolean

  @CreateDateColumn()
  createTime!: Date

  @UpdateDateColumn()
  updateTime!: Date

  @ManyToMany(() => Permission, permission => permission.roles, {
    cascade: true // 允许保存 Role 的同时保存 Permission
  })
  @JoinTable({
    name: 'role_permissions',
    joinColumn: { name: 'roleId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'permissionId', referencedColumnName: 'id' }
  })
  permissions!: Permission[]

  @ManyToMany(() => User, user => user.roles)
  users!: User[]

  @ManyToMany(() => Menu, menu => menu.roles)
  @JoinTable({
    name: 'role_menus',
    joinColumn: { name: 'roleId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'menuId', referencedColumnName: 'id' }
  })
  menus!: Menu[]
}
