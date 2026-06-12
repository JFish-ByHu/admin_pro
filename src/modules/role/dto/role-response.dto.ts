export class RoleResponseDto {
  id!: string
  code!: string
  name!: string
  description!: string | null
  isSystem!: boolean
  isActive!: boolean
  permissionCount!: number
  menuCount!: number
  userCount!: number
  createTime!: string
  updateTime!: string
}

export class RoleDetailResponseDto extends RoleResponseDto {
  permissionIds!: string[]
  menuIds!: string[]
}

export class RoleListResponseDto {
  list!: RoleResponseDto[]
  total!: number
  page!: number
  pageSize!: number
}

export class RoleUserGrantDetailResponseDto {
  roleId!: string
  checkedUserIds!: string[]
}
