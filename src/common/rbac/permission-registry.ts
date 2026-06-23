export type PermissionType = 'api' | 'button'

export type PermissionDefinition = {
  code: string
  name: string
  type: PermissionType
  sort: number
  parentCode?: string
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
  { code: USER_PERMISSION_CODES.LIST, name: '用户列表', type: 'api', sort: 1 },
  {
    code: USER_PERMISSION_CODES.DETAIL,
    name: '用户详情',
    type: 'api',
    sort: 2,
    parentCode: USER_PERMISSION_CODES.LIST
  },
  {
    code: USER_PERMISSION_CODES.CREATE,
    name: '创建用户',
    type: 'button',
    sort: 3,
    parentCode: USER_PERMISSION_CODES.LIST
  },
  {
    code: USER_PERMISSION_CODES.UPDATE,
    name: '更新用户',
    type: 'button',
    sort: 4,
    parentCode: USER_PERMISSION_CODES.LIST
  },
  {
    code: USER_PERMISSION_CODES.DELETE,
    name: '删除用户',
    type: 'button',
    sort: 5,
    parentCode: USER_PERMISSION_CODES.LIST
  },
  { code: MENU_PERMISSION_CODES.LIST, name: '菜单列表', type: 'api', sort: 6 },
  {
    code: MENU_PERMISSION_CODES.DETAIL,
    name: '菜单详情',
    type: 'api',
    sort: 7,
    parentCode: MENU_PERMISSION_CODES.LIST
  },
  {
    code: MENU_PERMISSION_CODES.CREATE,
    name: '创建菜单',
    type: 'button',
    sort: 8,
    parentCode: MENU_PERMISSION_CODES.LIST
  },
  {
    code: MENU_PERMISSION_CODES.UPDATE,
    name: '更新菜单',
    type: 'button',
    sort: 9,
    parentCode: MENU_PERMISSION_CODES.LIST
  },
  {
    code: MENU_PERMISSION_CODES.DELETE,
    name: '删除菜单',
    type: 'button',
    sort: 10,
    parentCode: MENU_PERMISSION_CODES.LIST
  },
  {
    code: MENU_PERMISSION_CODES.GRANT,
    name: '菜单授权',
    type: 'button',
    sort: 11,
    parentCode: MENU_PERMISSION_CODES.LIST
  },
  { code: PERMISSION_PERMISSION_CODES.LIST, name: '权限列表', type: 'api', sort: 12 },
  {
    code: PERMISSION_PERMISSION_CODES.DETAIL,
    name: '权限详情',
    type: 'api',
    sort: 13,
    parentCode: PERMISSION_PERMISSION_CODES.LIST
  },
  {
    code: PERMISSION_PERMISSION_CODES.CREATE,
    name: '创建权限',
    type: 'button',
    sort: 14,
    parentCode: PERMISSION_PERMISSION_CODES.LIST
  },
  {
    code: PERMISSION_PERMISSION_CODES.UPDATE,
    name: '更新权限',
    type: 'button',
    sort: 15,
    parentCode: PERMISSION_PERMISSION_CODES.LIST
  },
  {
    code: PERMISSION_PERMISSION_CODES.DELETE,
    name: '删除权限',
    type: 'button',
    sort: 16,
    parentCode: PERMISSION_PERMISSION_CODES.LIST
  },
  {
    code: PERMISSION_PERMISSION_CODES.GRANT,
    name: '权限授权',
    type: 'button',
    sort: 17,
    parentCode: PERMISSION_PERMISSION_CODES.LIST
  },
  { code: ROLE_PERMISSION_CODES.LIST, name: '角色列表', type: 'api', sort: 18 },
  {
    code: ROLE_PERMISSION_CODES.DETAIL,
    name: '角色详情',
    type: 'api',
    sort: 19,
    parentCode: ROLE_PERMISSION_CODES.LIST
  },
  {
    code: ROLE_PERMISSION_CODES.CREATE,
    name: '创建角色',
    type: 'button',
    sort: 20,
    parentCode: ROLE_PERMISSION_CODES.LIST
  },
  {
    code: ROLE_PERMISSION_CODES.UPDATE,
    name: '更新角色',
    type: 'button',
    sort: 21,
    parentCode: ROLE_PERMISSION_CODES.LIST
  },
  {
    code: ROLE_PERMISSION_CODES.DELETE,
    name: '删除角色',
    type: 'button',
    sort: 22,
    parentCode: ROLE_PERMISSION_CODES.LIST
  },
  { code: LOG_PERMISSION_CODES.LIST, name: '日志列表', type: 'api', sort: 30 },
  {
    code: LOG_PERMISSION_CODES.DETAIL,
    name: '日志详情',
    type: 'api',
    sort: 31,
    parentCode: LOG_PERMISSION_CODES.LIST
  }
]

export const ALL_PERMISSION_CODES = PERMISSION_DEFINITIONS.map(item => item.code)
