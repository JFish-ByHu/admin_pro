/**
 * 登录参数
 */
export interface LoginParams {
  username: string
  password: string
  otp: string
  captchaId: string
  keyId: string
}

/**
 * 注册参数
 */
export interface RegisterParams {
  username: string
  email: string
  password: string
  otp: string
  captchaId: string
  keyId: string
}

/**
 * 验证码结果
 */
export interface CaptchaResult {
  captchaId: string
  code: string
}

/**
 * 加密密钥结果
 */
export interface EncryptKeyResult {
  keyId: string
  aesKey: string
}

/**
 * 用户信息
 */
export interface UserInfo {
  id: string
  username: string
  email: string
  nickname?: string
  avatarUrl?: string
  role: string
  permissions?: string[] // 新增权限标识数组
}

/**
 * 登录结果
 */
export interface LoginResult {
  accessToken: string
  refreshToken: string
  userInfo: UserInfo
}
