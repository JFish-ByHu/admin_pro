export const USER_PERMISSION_CODES = {
  LIST: 'system:user:list',
  DETAIL: 'system:user:detail',
  CREATE: 'system:user:create',
  UPDATE: 'system:user:update',
  DELETE: 'system:user:delete'
} as const

export type UserPermissionCode =
  (typeof USER_PERMISSION_CODES)[keyof typeof USER_PERMISSION_CODES]
