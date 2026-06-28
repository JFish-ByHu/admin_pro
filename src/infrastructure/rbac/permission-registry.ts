export type PermissionType = 'api' | 'button'

export type PermissionDefinition = {
  code: string
  name: string
  type: PermissionType
  sort: number
  groupCode?: string
}

export const USER_PERMISSION_CODES = {
  LIST: 'system:user:list',
  DETAIL: 'system:user:detail',
  CREATE: 'system:user:create',
  UPDATE: 'system:user:update',
  DELETE: 'system:user:delete'
} as const

export const MENU_PERMISSION_CODES = {
  LIST: 'system:menu:list',
  DETAIL: 'system:menu:detail',
  CREATE: 'system:menu:create',
  UPDATE: 'system:menu:update',
  DELETE: 'system:menu:delete',
  GRANT: 'system:menu:grant'
} as const

export const PERMISSION_PERMISSION_CODES = {
  LIST: 'system:permission:list',
  DETAIL: 'system:permission:detail',
  CREATE: 'system:permission:create',
  UPDATE: 'system:permission:update',
  DELETE: 'system:permission:delete',
  GRANT: 'system:permission:grant'
} as const

export const ROLE_PERMISSION_CODES = {
  LIST: 'system:role:list',
  DETAIL: 'system:role:detail',
  CREATE: 'system:role:create',
  UPDATE: 'system:role:update',
  DELETE: 'system:role:delete'
} as const

export const LOG_PERMISSION_CODES = {
  LIST: 'system:log:list',
  DETAIL: 'system:log:detail'
} as const

export const PERMISSION_DEFINITIONS: PermissionDefinition[] = [
  { code: USER_PERMISSION_CODES.LIST, name: '用户列表', type: 'api', sort: 1, groupCode: 'user' },
  {
    code: USER_PERMISSION_CODES.DETAIL,
    name: '用户详情',
    type: 'api',
    sort: 2,
    groupCode: 'user'
  },
  {
    code: USER_PERMISSION_CODES.CREATE,
    name: '创建用户',
    type: 'button',
    sort: 3,
    groupCode: 'user'
  },
  {
    code: USER_PERMISSION_CODES.UPDATE,
    name: '更新用户',
    type: 'button',
    sort: 4,
    groupCode: 'user'
  },
  {
    code: USER_PERMISSION_CODES.DELETE,
    name: '删除用户',
    type: 'button',
    sort: 5,
    groupCode: 'user'
  },
  { code: MENU_PERMISSION_CODES.LIST, name: '菜单列表', type: 'api', sort: 6, groupCode: 'menu' },
  {
    code: MENU_PERMISSION_CODES.DETAIL,
    name: '菜单详情',
    type: 'api',
    sort: 7,
    groupCode: 'menu'
  },
  {
    code: MENU_PERMISSION_CODES.CREATE,
    name: '创建菜单',
    type: 'button',
    sort: 8,
    groupCode: 'menu'
  },
  {
    code: MENU_PERMISSION_CODES.UPDATE,
    name: '更新菜单',
    type: 'button',
    sort: 9,
    groupCode: 'menu'
  },
  {
    code: MENU_PERMISSION_CODES.DELETE,
    name: '删除菜单',
    type: 'button',
    sort: 10,
    groupCode: 'menu'
  },
  {
    code: MENU_PERMISSION_CODES.GRANT,
    name: '菜单授权',
    type: 'button',
    sort: 11,
    groupCode: 'menu'
  },
  {
    code: PERMISSION_PERMISSION_CODES.LIST,
    name: '权限列表',
    type: 'api',
    sort: 12,
    groupCode: 'permission'
  },
  {
    code: PERMISSION_PERMISSION_CODES.DETAIL,
    name: '权限详情',
    type: 'api',
    sort: 13,
    groupCode: 'permission'
  },
  {
    code: PERMISSION_PERMISSION_CODES.CREATE,
    name: '创建权限',
    type: 'button',
    sort: 14,
    groupCode: 'permission'
  },
  {
    code: PERMISSION_PERMISSION_CODES.UPDATE,
    name: '更新权限',
    type: 'button',
    sort: 15,
    groupCode: 'permission'
  },
  {
    code: PERMISSION_PERMISSION_CODES.DELETE,
    name: '删除权限',
    type: 'button',
    sort: 16,
    groupCode: 'permission'
  },
  {
    code: PERMISSION_PERMISSION_CODES.GRANT,
    name: '权限授权',
    type: 'button',
    sort: 17,
    groupCode: 'permission'
  },
  {
    code: ROLE_PERMISSION_CODES.LIST,
    name: '角色列表',
    type: 'api',
    sort: 18,
    groupCode: 'role'
  },
  {
    code: ROLE_PERMISSION_CODES.DETAIL,
    name: '角色详情',
    type: 'api',
    sort: 19,
    groupCode: 'role'
  },
  {
    code: ROLE_PERMISSION_CODES.CREATE,
    name: '创建角色',
    type: 'button',
    sort: 20,
    groupCode: 'role'
  },
  {
    code: ROLE_PERMISSION_CODES.UPDATE,
    name: '更新角色',
    type: 'button',
    sort: 21,
    groupCode: 'role'
  },
  {
    code: ROLE_PERMISSION_CODES.DELETE,
    name: '删除角色',
    type: 'button',
    sort: 22,
    groupCode: 'role'
  },
  { code: LOG_PERMISSION_CODES.LIST, name: '日志列表', type: 'api', sort: 30, groupCode: 'log' },
  {
    code: LOG_PERMISSION_CODES.DETAIL,
    name: '日志详情',
    type: 'api',
    sort: 31,
    groupCode: 'log'
  }
]

export const ALL_PERMISSION_CODES = PERMISSION_DEFINITIONS.map(item => item.code)
