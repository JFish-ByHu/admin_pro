import { Injectable, Logger } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Menu } from '../../modules/menu/entities/menu.entity'
import { Permission } from '../../modules/user/entities/permission.entity'
import { Role } from '../../modules/user/entities/role.entity'
import { User } from '../../modules/user/entities/user.entity'

@Injectable()
export class RbacBootstrapService {
  private readonly logger = new Logger(RbacBootstrapService.name)
  private readonly rolePriority: string[] = ['super', 'admin', 'operator', 'user']

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

  private readonly permissionSeeds = [
    { code: 'system:user:list', name: '用户列表', type: 'api' },
    { code: 'system:user:detail', name: '用户详情', type: 'api' },
    { code: 'system:user:create', name: '创建用户', type: 'button' },
    { code: 'system:user:update', name: '更新用户', type: 'button' },
    { code: 'system:user:delete', name: '删除用户', type: 'button' },
    { code: 'system:menu:list', name: '菜单列表', type: 'api' },
    { code: 'system:menu:detail', name: '菜单详情', type: 'api' },
    { code: 'system:menu:create', name: '创建菜单', type: 'button' },
    { code: 'system:menu:update', name: '更新菜单', type: 'button' },
    { code: 'system:menu:delete', name: '删除菜单', type: 'button' },
    { code: 'system:menu:grant', name: '菜单授权', type: 'button' },
    { code: 'system:permission:list', name: '权限列表', type: 'api' },
    { code: 'system:permission:detail', name: '权限详情', type: 'api' },
    { code: 'system:permission:create', name: '创建权限', type: 'button' },
    { code: 'system:permission:update', name: '更新权限', type: 'button' },
    { code: 'system:permission:delete', name: '删除权限', type: 'button' },
    { code: 'system:permission:grant', name: '权限授权', type: 'button' },
    { code: 'system:role:list', name: '角色列表', type: 'api' },
    { code: 'system:role:detail', name: '角色详情', type: 'api' },
    { code: 'system:role:create', name: '创建角色', type: 'button' },
    { code: 'system:role:update', name: '更新角色', type: 'button' },
    { code: 'system:role:delete', name: '删除角色', type: 'button' }
  ] as const

  private readonly menuSeeds = [
    {
      name: '控制台',
      type: 'menu',
      routePath: '/dashboard',
      componentPath: 'views/dashboard/DashboardIndex.vue',
      sort: 1
    },
    {
      name: '用户管理',
      type: 'menu',
      routePath: '/user/info',
      componentPath: 'views/user/UserInfoIndex.vue',
      sort: 10
    },
    {
      name: '菜单管理',
      type: 'menu',
      routePath: '/system/menu',
      componentPath: 'views/system/menu/MenuManagementIndex.vue',
      sort: 20
    },
    {
      name: '权限管理',
      type: 'menu',
      routePath: '/system/permission',
      componentPath: 'views/system/permission/PermissionManagementIndex.vue',
      sort: 21
    }
  ] as const

  async bootstrap(): Promise<void> {
    await this.ensureBaseRoles()
    await this.ensureBasePermissions()
    await this.ensureBaseMenus()
    await this.ensureSuperRoleAllPermissions()
    await this.ensureSuperRoleAllMenus()
    await this.ensureUserRoleRelations()
  }

  private pickDisplayRoleCode(roles: Role[]): string {
    if (!roles.length) {
      return 'user'
    }

    for (const code of this.rolePriority) {
      if (roles.some(role => role.code === code)) {
        return code
      }
    }

    return roles[0]?.code || 'user'
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
    let sort = 1
    for (const seed of this.permissionSeeds) {
      const exists = await this.permissionRepository.findOne({ where: { code: seed.code } })
      if (exists) {
        sort += 1
        continue
      }

      const permission = this.permissionRepository.create({
        parentId: null,
        code: seed.code,
        name: seed.name,
        type: seed.type,
        apiPath: null,
        httpMethod: null,
        sort,
        isActive: true
      })

      await this.permissionRepository.save(permission)
      this.logger.log(`已初始化权限: ${seed.code}`)
      sort += 1
    }
  }

  private async ensureBaseMenus(): Promise<void> {
    for (const seed of this.menuSeeds) {
      const exists = await this.menuRepository.findOne({ where: { routePath: seed.routePath } })
      if (exists) {
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

      await this.menuRepository.save(menu)
      this.logger.log(`已初始化菜单: ${seed.routePath}`)
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

    let changedCount = 0

    for (const user of users) {
      const currentRoles = user.roles || []

      if (currentRoles.length === 0) {
        const fallbackRole = roleByCode.get(user.role) || roleByCode.get('user')

        if (fallbackRole) {
          user.roles = [fallbackRole]
          user.role = this.pickDisplayRoleCode(user.roles)
          await this.userRepository.save(user)
          changedCount += 1
        }

        continue
      }

      const nextDisplayRole = this.pickDisplayRoleCode(currentRoles)
      if (user.role !== nextDisplayRole) {
        user.role = nextDisplayRole
        await this.userRepository.save(user)
        changedCount += 1
      }
    }

    if (changedCount > 0) {
      this.logger.log(`已修复 ${changedCount} 个用户的角色关系数据`)
    }
  }
}
