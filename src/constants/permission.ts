export const USER_PERMISSION_CODES = {
  LIST: 'system:user:list',
  DETAIL: 'system:user:detail',
  CREATE: 'system:user:create',
  UPDATE: 'system:user:update',
  DELETE: 'system:user:delete'
} as const

export type UserPermissionCode = (typeof USER_PERMISSION_CODES)[keyof typeof USER_PERMISSION_CODES]

export const MENU_PERMISSION_CODES = {
  LIST: 'system:menu:list',
  DETAIL: 'system:menu:detail',
  CREATE: 'system:menu:create',
  UPDATE: 'system:menu:update',
  DELETE: 'system:menu:delete',
  GRANT: 'system:menu:grant'
} as const

export type MenuPermissionCode = (typeof MENU_PERMISSION_CODES)[keyof typeof MENU_PERMISSION_CODES]

export const PERMISSION_PERMISSION_CODES = {
  LIST: 'system:permission:list',
  DETAIL: 'system:permission:detail',
  CREATE: 'system:permission:create',
  UPDATE: 'system:permission:update',
  DELETE: 'system:permission:delete',
  GRANT: 'system:permission:grant'
} as const

export type PermissionPermissionCode =
  (typeof PERMISSION_PERMISSION_CODES)[keyof typeof PERMISSION_PERMISSION_CODES]

export const ROLE_PERMISSION_CODES = {
  LIST: 'system:role:list',
  DETAIL: 'system:role:detail',
  CREATE: 'system:role:create',
  UPDATE: 'system:role:update',
  DELETE: 'system:role:delete'
} as const

export type RolePermissionCode = (typeof ROLE_PERMISSION_CODES)[keyof typeof ROLE_PERMISSION_CODES]
