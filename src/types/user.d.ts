/**
 * 用户状态枚举
 */
export type UserStatus = 'enabled' | 'disabled'

/**
 * 用户信息
 */
export interface UserInfo {
  id: string
  username: string
  nickname: string
  email: string
  phone: string
  role: string
  status: UserStatus
  createTime: string
}

/**
 * 用户列表查询参数
 */
export interface UserQuery {
  keyword?: string
  role?: string
  status?: UserStatus | ''
}
