export class UserResponseDto {
  id!: string
  username!: string
  email!: string
  nickname!: string | null
  avatarUrl!: string | null
  role!: string
  isActive!: boolean
  createTime!: Date
  updateTime!: Date
  lastLoginAt!: Date | null
}

export class UserListResponseDto {
  list!: UserResponseDto[]
  total!: number
  page!: number
  pageSize!: number
}
