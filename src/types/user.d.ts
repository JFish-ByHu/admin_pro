export type UserRole = 'super' | 'admin' | 'operator' | 'user'

export type UserStatus = 'enabled' | 'disabled'

export interface UserView {
  id: string
  username: string
  email: string
  nickname: string | null
  avatarUrl: string | null
  role: UserRole | string
  isActive: boolean
  createTime: string
  updateTime: string
  lastLoginAt: string | null
}

export interface UserInfo {
  id: string
  username: string
  nickname: string
  email: string
  avatarUrl: string | null
  role: UserRole | string
  status: UserStatus
  createTime: string
  updateTime: string
  lastLoginAt: string | null
}

export interface UserListParams {
  keyword?: string
  role?: string | ''
  status?: UserStatus | ''
  all?: boolean
  page?: number
  pageSize?: number
}

export type UserQuery = UserListParams

export interface UserListResult {
  list: UserView[]
  total: number
  page: number
  pageSize: number
}

export interface UserCreateParams {
  username: string
  email: string
  password: string
  nickname?: string
  avatarUrl?: string
  isActive?: boolean
}

export interface UserUpdateParams {
  email?: string
  password?: string
  nickname?: string
  avatarUrl?: string
  isActive?: boolean
}

export interface UserFormSubmitPayload extends UserFormModel {
  avatarFile?: File | null
  removeAvatar?: boolean
}

export interface UserFormModel {
  username: string
  email: string
  password: string
  nickname: string
  avatarUrl: string
  status: UserStatus
}
