export type RoleStatus = 'enabled' | 'disabled'

export interface RoleView {
  id: string
  code: string
  name: string
  description: string | null
  isSystem: boolean
  isActive: boolean
  permissionCount: number
  menuCount: number
  userCount: number
  createTime: string
  updateTime: string
}

export interface RoleDetailView extends RoleView {
  permissionIds: string[]
  menuIds: string[]
}

export interface RoleInfo {
  id: string
  code: string
  name: string
  description: string
  isSystem: boolean
  status: RoleStatus
  permissionCount: number
  menuCount: number
  userCount: number
  createTime: string
  updateTime: string
}

export interface RoleListParams {
  keyword?: string
  status?: RoleStatus | ''
  all?: boolean
  page?: number
  pageSize?: number
}

export interface RoleListResult {
  list: RoleView[]
  total: number
  page: number
  pageSize: number
}

export interface RoleCreateParams {
  code: string
  name: string
  description?: string
  isSystem?: boolean
  isActive?: boolean
  permissionIds?: string[]
  menuIds?: string[]
}

export interface RoleUpdateParams {
  name?: string
  description?: string
  isActive?: boolean
  permissionIds?: string[]
  menuIds?: string[]
}

export interface RoleFormModel {
  code: string
  name: string
  description: string
  status: RoleStatus
}

export interface RoleSimpleItem {
  id: string
  code: string
  name: string
}

export interface RoleUserGrantDetailResult {
  roleId: string
  checkedUserIds: string[]
}

export interface RoleUserGrantUpdateParams {
  roleId: string
  userIds: string[]
}
