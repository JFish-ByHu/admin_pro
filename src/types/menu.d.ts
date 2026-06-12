export type MenuResourceType = 'directory' | 'menu'

export type MenuResourceStatus = 'enabled' | 'disabled'

export interface MenuResourceNode {
  id: string
  parentId: string | null
  name: string
  type: MenuResourceType
  routePath: string
  componentPath: string
  icon: string | null
  status: MenuResourceStatus
  sort: number
  createTime: string
  updateTime: string
  children?: MenuResourceNode[]
}

export interface MenuResourceTableItem {
  id: string
  parentId: string | null
  level: number
  name: string
  type: MenuResourceType
  routePath: string
  componentPath: string
  icon: string | null
  status: MenuResourceStatus
  sort: number
  createTime: string
  updateTime: string
}

export interface MenuResourceQuery {
  keyword: string
  type: MenuResourceType | ''
  status: MenuResourceStatus | ''
}

export interface MenuResourceListParams {
  keyword?: string
  type?: MenuResourceType | ''
  status?: MenuResourceStatus | ''
  all?: boolean
  page?: number
  pageSize?: number
}

export interface MenuResourceListResult {
  list: MenuResourceNode[]
  total: number
  page: number
  pageSize: number
}

export interface MenuAuthSubject {
  id: string
  username: string
  nickname: string
  email: string
  role: string
}

export interface RoleMenuGrantDetailResult {
  roleId: string
  checkedMenuIds: string[]
}

export interface RoleMenuGrantUpdateParams {
  roleId: string
  menuIds: string[]
}

export interface MenuResourceCreateParams {
  parentId?: string
  name: string
  type: MenuResourceType
  routePath: string
  componentPath: string
  icon?: string
  sort?: number
  isActive?: boolean
}

export interface MenuResourceUpdateParams {
  parentId?: string | null
  name?: string
  type?: MenuResourceType
  routePath?: string
  componentPath?: string
  icon?: string
  sort?: number
  isActive?: boolean
}

export interface MenuResourceFormModel {
  parentId: string
  name: string
  type: MenuResourceType
  routePath: string
  componentPath: string
  icon: string
  sort: number
  status: MenuResourceStatus
}
