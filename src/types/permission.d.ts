export type PermissionResourceType = 'api' | 'button'

export type PermissionResourceStatus = 'enabled' | 'disabled'

export interface PermissionResourceNode {
  id: string
  groupCode: string | null
  name: string
  type: PermissionResourceType
  permissionCode: string
  apiPath: string
  httpMethod: string
  status: PermissionResourceStatus
  sort: number
  createTime: string
  updateTime: string
  children?: PermissionResourceNode[]
}

export interface PermissionResourceTableItem {
  id: string
  groupCode: string | null
  level: number
  name: string
  type: PermissionResourceType
  permissionCode: string
  apiPath: string
  httpMethod: string
  status: PermissionResourceStatus
  sort: number
  createTime: string
  updateTime: string
}

export interface PermissionResourceQuery {
  keyword: string
  type: PermissionResourceType | ''
  status: PermissionResourceStatus | ''
}

export interface PermissionResourceListParams {
  keyword?: string
  type?: PermissionResourceType | ''
  status?: PermissionResourceStatus | ''
  all?: boolean
  page?: number
  pageSize?: number
}

export interface PermissionResourceListResult {
  list: PermissionResourceNode[]
  total: number
  page: number
  pageSize: number
}

export interface RolePermissionGrantDetailResult {
  roleId: string
  checkedPermissionIds: string[]
}

export interface RolePermissionGrantUpdateParams {
  roleId: string
  permissionIds: string[]
}

export interface PermissionResourceCreateParams {
  groupCode?: string
  name: string
  permissionCode: string
  type: PermissionResourceType
  apiPath?: string
  httpMethod?: string
  sort?: number
  isActive?: boolean
}

export interface PermissionResourceUpdateParams {
  groupCode?: string | null
  name?: string
  permissionCode?: string
  type?: PermissionResourceType
  apiPath?: string
  httpMethod?: string
  sort?: number
  isActive?: boolean
}

export interface PermissionResourceFormModel {
  groupCode: string
  name: string
  permissionCode: string
  type: PermissionResourceType
  apiPath: string
  httpMethod: string
  sort: number
  status: PermissionResourceStatus
}

export interface PermissionGroupItem {
  id: string
  code: string
  name: string
  sort: number
  isActive: boolean
  createTime: string
  updateTime: string
}

export interface PermissionGroupCreateParams {
  code: string
  name: string
  isActive?: boolean
}

export interface PermissionGroupUpdateParams {
  name?: string
  isActive?: boolean
}
