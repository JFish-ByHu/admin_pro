export class PermissionResourceResponseDto {
  id!: string
  groupCode!: string | null
  name!: string
  type!: 'api' | 'button'
  permissionCode!: string
  apiPath!: string
  httpMethod!: string
  sort!: number
  status!: 'enabled' | 'disabled'
  createTime!: string
  updateTime!: string
}

export class PermissionResourceTreeNodeDto extends PermissionResourceResponseDto {
  children!: PermissionResourceTreeNodeDto[]
}

export class PermissionResourceListResponseDto {
  list!: PermissionResourceResponseDto[]
  total!: number
  page!: number
  pageSize!: number
}

export class RolePermissionGrantDetailResponseDto {
  roleId!: string
  checkedPermissionIds!: string[]
}
