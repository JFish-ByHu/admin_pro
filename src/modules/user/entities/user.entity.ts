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

type UserMenuTreeNode = {
  id: string
  parentId: string | null
  name: string
  type: 'directory' | 'menu'
  routePath: string
  componentPath: string
  sort: number
  children: UserMenuTreeNode[]
}

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

  getMenuRoutePaths(): string[] {
    return Array.from(
      new Set(
        this.roles
          ?.filter(role => role.isActive !== false)
          .flatMap(
            role =>
              role.menus
                ?.filter(menu => menu.isActive !== false)
                .map(menu => menu.routePath)
                .filter((routePath): routePath is string => Boolean(routePath)) || []
          ) || []
      )
    )
  }

  getMenuTree(): UserMenuTreeNode[] {
    const activeMenus =
      this.roles
        ?.filter(role => role.isActive !== false)
        .flatMap(role => role.menus?.filter(menu => menu.isActive !== false) || []) || []

    const menuMap = new Map<string, UserMenuTreeNode>()
    activeMenus.forEach(menu => {
      if (menuMap.has(menu.id)) {
        return
      }

      menuMap.set(menu.id, {
        id: menu.id,
        parentId: menu.parentId,
        name: menu.name,
        type: menu.type,
        routePath: menu.routePath,
        componentPath: menu.componentPath,
        sort: menu.sort,
        children: []
      })
    })

    const roots: UserMenuTreeNode[] = []

    menuMap.forEach(node => {
      if (!node.parentId) {
        roots.push(node)
        return
      }

      const parent = menuMap.get(node.parentId)
      if (!parent) {
        roots.push(node)
        return
      }

      parent.children.push(node)
    })

    const sortTree = (nodes: UserMenuTreeNode[]) => {
      nodes.sort((a, b) => a.sort - b.sort)
      nodes.forEach(node => {
        if (node.children.length > 0) {
          sortTree(node.children)
        }
      })
    }

    sortTree(roots)
    return roots
  }
}
