export type MenuResourceType = 'directory' | 'menu'

export type MenuResourceStatus = 'enabled' | 'disabled'

export interface MenuResourceNode {
  id: string
  parentId: string | null
  name: string
  type: MenuResourceType
  routePath: string
  componentPath: string
  status: MenuResourceStatus
  sort: number
  updatedAt: string
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
  status: MenuResourceStatus
  sort: number
  updatedAt: string
}

export interface MenuResourceQuery {
  keyword: string
  type: MenuResourceType | ''
  status: MenuResourceStatus | ''
}

export interface MenuAuthSubject {
  id: string
  username: string
  nickname: string
  email: string
  role: string
}
