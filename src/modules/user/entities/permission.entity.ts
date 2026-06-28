import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToMany,
  CreateDateColumn,
  UpdateDateColumn
} from 'typeorm'
import { Role } from '../entities/role.entity'

@Entity('permissions')
export class Permission {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column({ type: 'varchar', length: 50, nullable: true })
  groupCode!: string | null

  @Column({ type: 'varchar', length: 100, unique: true })
  code!: string // 例如 'system:user:delete'

  @Column({ type: 'varchar', length: 100 })
  name!: string // 例如 '删除用户'

  @Column({ type: 'varchar', length: 20, default: 'api' })
  type!: 'api' | 'button'

  @Column({ type: 'varchar', length: 255, nullable: true })
  apiPath!: string | null

  @Column({ type: 'varchar', length: 12, nullable: true })
  httpMethod!: string | null

  @Column({ type: 'int', default: 0 })
  sort!: number

  @Column({ type: 'boolean', default: true })
  isActive!: boolean

  @CreateDateColumn()
  createTime!: Date

  @UpdateDateColumn()
  updateTime!: Date

  @ManyToMany(() => Role, role => role.permissions)
  roles!: Role[]
}
