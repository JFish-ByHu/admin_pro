import { Entity, Column, PrimaryGeneratedColumn, ManyToMany } from 'typeorm'
import { Role } from '../entities/role.entity'

@Entity('permissions')
export class Permission {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column({ type: 'varchar', length: 100, unique: true })
  code!: string // 例如 'system:user:delete'

  @Column({ type: 'varchar', length: 100 })
  name!: string // 例如 '删除用户'

  @ManyToMany(() => Role, role => role.permissions)
  roles!: Role[]
}
