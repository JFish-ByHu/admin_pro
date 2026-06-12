export class MenuResourceResponseDto {
  id!: string
  parentId!: string | null
  name!: string
  type!: 'directory' | 'menu'
  routePath!: string
  componentPath!: string
  sort!: number
  status!: 'enabled' | 'disabled'
  createTime!: string
  updateTime!: string
}

export class MenuResourceTreeNodeDto extends MenuResourceResponseDto {
  children!: MenuResourceTreeNodeDto[]
}

export class MenuResourceListResponseDto {
  list!: MenuResourceResponseDto[]
  total!: number
  page!: number
  pageSize!: number
}

export class RoleMenuGrantDetailResponseDto {
  roleId!: string
  checkedMenuIds!: string[]
}
