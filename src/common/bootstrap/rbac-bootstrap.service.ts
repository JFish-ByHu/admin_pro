import { Injectable, Logger } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Menu } from '../../modules/menu/entities/menu.entity'
import { Permission } from '../../modules/user/entities/permission.entity'
import { Role } from '../../modules/user/entities/role.entity'
import { User } from '../../modules/user/entities/user.entity'
import { PERMISSION_DEFINITIONS } from '../rbac/permission-registry'

@Injectable()
export class RbacBootstrapService {
  private readonly logger = new Logger(RbacBootstrapService.name)

  constructor(
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
    @InjectRepository(Menu)
    private readonly menuRepository: Repository<Menu>,
    @InjectRepository(Permission)
    private readonly permissionRepository: Repository<Permission>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>
  ) {}

  private readonly roleSeeds = [
    {
      code: 'super',
      name: '超级管理员',
      description: '系统内置超级管理员角色',
      isSystem: true
    },
    {
      code: 'admin',
      name: '管理员',
      description: '系统内置管理员角色',
      isSystem: true
    },
    {
      code: 'operator',
      name: '运营',
      description: '系统内置运营角色',
      isSystem: true
    },
    {
      code: 'user',
      name: '普通用户',
      description: '系统内置普通用户角色',
      isSystem: true
    }
  ] as const

  private readonly menuSeeds: Array<{
    name: string
    type: 'directory' | 'menu'
    routePath: string
    parentRoutePath: string | null
    componentPath: string
    sort: number
  }> = [
    {
      name: '控制台',
      type: 'menu',
      routePath: '/dashboard',
      parentRoutePath: null,
      componentPath: 'views/dashboard/DashboardIndex.vue',
      sort: 1
    },
    {
      name: '用户管理',
      type: 'directory',
      routePath: '/user',
      parentRoutePath: null,
      componentPath: '',
      sort: 10
    },
    {
      name: '用户信息',
      type: 'menu',
      routePath: '/user/info',
      parentRoutePath: '/user',
      componentPath: 'views/user/UserInfoIndex.vue',
      sort: 11
    },
    {
      name: '系统设置',
      type: 'directory',
      routePath: '/system',
      parentRoutePath: null,
      componentPath: '',
      sort: 20
    },
    {
      name: '角色管理',
      type: 'menu',
      routePath: '/system/role',
      parentRoutePath: '/system',
      componentPath: 'views/system/role/RoleManagementIndex.vue',
      sort: 21
    },
    {
      name: '菜单管理',
      type: 'menu',
      routePath: '/system/menu',
      parentRoutePath: '/system',
      componentPath: 'views/system/menu/MenuManagementIndex.vue',
      sort: 22
    },
    {
      name: '权限管理',
      type: 'menu',
      routePath: '/system/permission',
      parentRoutePath: '/system',
      componentPath: 'views/system/permission/PermissionManagementIndex.vue',
      sort: 23
    }
  ]

  async bootstrap(): Promise<void> {
    await this.ensureBaseRoles()
    await this.ensureBasePermissions()
    await this.ensureBaseMenus()
    await this.ensureSuperRoleAllPermissions()
    await this.ensureSuperRoleAllMenus()
    await this.ensureUserRoleRelations()
  }

  private async ensureBaseRoles(): Promise<void> {
    for (const seed of this.roleSeeds) {
      const exists = await this.roleRepository.findOne({ where: { code: seed.code } })
      if (exists) {
        continue
      }

      const role = this.roleRepository.create({
        code: seed.code,
        name: seed.name,
        description: seed.description,
        isSystem: seed.isSystem,
        isActive: true
      })

      await this.roleRepository.save(role)
      this.logger.log(`已初始化角色: ${seed.code}`)
    }
  }

  private async ensureBasePermissions(): Promise<void> {
    const exists = await this.permissionRepository.find({
      select: {
        id: true,
        parentId: true,
        code: true,
        name: true,
        type: true,
        sort: true
      }
    })
    const existsMap = new Map(exists.map(item => [item.code, item]))

    for (const seed of PERMISSION_DEFINITIONS) {
      const current = existsMap.get(seed.code)
      const parentCode = (seed as { parentCode?: string }).parentCode
      const parentPermission = typeof parentCode === 'string' ? existsMap.get(parentCode) : null
      const nextParentId = parentPermission?.id || null

      if (!current) {
        const permission = this.permissionRepository.create({
          parentId: nextParentId,
          code: seed.code,
          name: seed.name,
          type: seed.type,
          apiPath: null,
          httpMethod: null,
          sort: seed.sort,
          isActive: true
        })

        await this.permissionRepository.save(permission)
        this.logger.log(`已初始化权限: ${seed.code}`)
        continue
      }

      const needSync =
        current.parentId !== nextParentId ||
        current.name !== seed.name ||
        current.type !== seed.type ||
        current.sort !== seed.sort

      if (!needSync) {
        continue
      }

      await this.permissionRepository.save({
        ...current,
        parentId: nextParentId,
        name: seed.name,
        type: seed.type,
        sort: seed.sort
      })
      this.logger.log(`已同步权限定义: ${seed.code}`)
    }
  }

  private async ensureBaseMenus(): Promise<void> {
    const allMenus = await this.menuRepository.find()
    const menuMap = new Map(allMenus.map(item => [item.routePath, item]))

    for (const seed of this.menuSeeds) {
      if (menuMap.has(seed.routePath)) {
        continue
      }

      const menu = this.menuRepository.create({
        parentId: null,
        name: seed.name,
        type: seed.type,
        routePath: seed.routePath,
        componentPath: seed.componentPath,
        sort: seed.sort,
        isActive: true
      })

      const saved = await this.menuRepository.save(menu)
      menuMap.set(saved.routePath, saved)
      this.logger.log(`已初始化菜单: ${seed.routePath}`)
    }

    for (const seed of this.menuSeeds) {
      const current = menuMap.get(seed.routePath)
      if (!current) {
        continue
      }

      const parentMenu = seed.parentRoutePath ? menuMap.get(seed.parentRoutePath) : null
      const nextParentId = parentMenu?.id || null

      const needSync =
        current.parentId !== nextParentId ||
        current.name !== seed.name ||
        current.type !== seed.type ||
        current.componentPath !== seed.componentPath ||
        current.sort !== seed.sort

      if (!needSync) {
        continue
      }

      const updated = await this.menuRepository.save({
        ...current,
        parentId: nextParentId,
        name: seed.name,
        type: seed.type,
        componentPath: seed.componentPath,
        sort: seed.sort
      })

      menuMap.set(updated.routePath, updated)
      this.logger.log(`已同步菜单定义: ${seed.routePath}`)
    }
  }

  private async ensureSuperRoleAllPermissions(): Promise<void> {
    const superRole = await this.roleRepository.findOne({
      where: { code: 'super' },
      relations: { permissions: true }
    })

    if (!superRole) {
      return
    }

    const allPermissions = await this.permissionRepository.find()
    const nextIds = new Set(allPermissions.map(item => item.id))
    const currentIds = new Set((superRole.permissions || []).map(item => item.id))

    let changed = false
    if (allPermissions.length !== (superRole.permissions || []).length) {
      changed = true
    }

    if (!changed) {
      for (const id of nextIds) {
        if (!currentIds.has(id)) {
          changed = true
          break
        }
      }
    }

    if (changed) {
      superRole.permissions = allPermissions
      await this.roleRepository.save(superRole)
      this.logger.log('已同步超级管理员角色权限')
    }
  }

  private async ensureSuperRoleAllMenus(): Promise<void> {
    const superRole = await this.roleRepository.findOne({
      where: { code: 'super' },
      relations: { menus: true }
    })

    if (!superRole) {
      return
    }

    const allMenus = await this.menuRepository.find()
    const nextIds = new Set(allMenus.map(item => item.id))
    const currentIds = new Set((superRole.menus || []).map(item => item.id))

    let changed = false
    if (allMenus.length !== (superRole.menus || []).length) {
      changed = true
    }

    if (!changed) {
      for (const id of nextIds) {
        if (!currentIds.has(id)) {
          changed = true
          break
        }
      }
    }

    if (changed) {
      superRole.menus = allMenus
      await this.roleRepository.save(superRole)
      this.logger.log('已同步超级管理员角色菜单')
    }
  }

  private async ensureUserRoleRelations(): Promise<void> {
    const users = await this.userRepository.find({ relations: { roles: true } })
    if (!users.length) {
      return
    }

    const activeRoles = await this.roleRepository.find({ where: { isActive: true } })
    const roleByCode = new Map(activeRoles.map(role => [role.code, role]))
    const defaultRole = roleByCode.get('user')

    let changedCount = 0

    for (const user of users) {
      if ((user.roles || []).length === 0 && defaultRole) {
        user.roles = [defaultRole]
        await this.userRepository.save(user)
        changedCount += 1
      }
    }

    if (changedCount > 0) {
      this.logger.log(`已修复 ${changedCount} 个用户的角色关系数据`)
    }
  }
}
