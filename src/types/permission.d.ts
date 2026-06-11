export type PermissionResourceType = 'api' | 'button'

export type PermissionResourceStatus = 'enabled' | 'disabled'

export interface PermissionResourceNode {
  id: string
  parentId: string | null
  name: string
  type: PermissionResourceType
  permissionCode: string
  apiPath: string
  httpMethod: string
  status: PermissionResourceStatus
  sort: number
  updatedAt: string
  children?: PermissionResourceNode[]
}

export interface PermissionResourceTableItem {
  id: string
  parentId: string | null
  level: number
  name: string
  type: PermissionResourceType
  permissionCode: string
  apiPath: string
  httpMethod: string
  status: PermissionResourceStatus
  sort: number
  updatedAt: string
}

export interface PermissionResourceQuery {
  keyword: string
  type: PermissionResourceType | ''
  status: PermissionResourceStatus | ''
}
