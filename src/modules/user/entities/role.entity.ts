import { Entity, Column, PrimaryGeneratedColumn, ManyToMany, JoinTable } from 'typeorm'
import { Permission } from './permission.entity'
import { User } from './user.entity'

@Entity('roles')
export class Role {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column({ type: 'varchar', length: 50, unique: true })
  code!: string // 例如 'admin'

  @Column({ type: 'varchar', length: 50 })
  name!: string // 例如 '管理员'

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
}
