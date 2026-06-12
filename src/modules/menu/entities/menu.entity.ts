import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToMany
} from 'typeorm'
import { Role } from '../../user/entities/role.entity'

@Entity('menus')
export class Menu {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column({ type: 'varchar', length: 36, nullable: true })
  parentId!: string | null

  @Column({ type: 'varchar', length: 100 })
  name!: string

  @Column({ type: 'varchar', length: 20, default: 'menu' })
  type!: 'directory' | 'menu'

  @Column({ type: 'varchar', length: 255 })
  routePath!: string

  @Column({ type: 'varchar', length: 255 })
  componentPath!: string

  @Column({ type: 'varchar', length: 50, nullable: true })
  icon!: string | null

  @Column({ type: 'int', default: 0 })
  sort!: number

  @Column({ type: 'boolean', default: true })
  isActive!: boolean

  @CreateDateColumn()
  createTime!: Date

  @UpdateDateColumn()
  updateTime!: Date

  @ManyToMany(() => Role, role => role.menus)
  roles!: Role[]
}
