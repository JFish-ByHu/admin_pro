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
  emailVerifyTicket: string
  keyId: string
}

export type EmailCodeScene = 'register'

export interface SendEmailCodeParams {
  email: string
  scene: EmailCodeScene
}

export interface VerifyEmailCodeParams {
  email: string
  scene: EmailCodeScene
  code: string
}

export interface SendEmailCodeResult {
  success: boolean
  cooldownSeconds: number
}

export interface VerifyEmailCodeResult {
  emailVerifyTicket: string
  expiresInSeconds: number
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

export interface RefreshTokenResult {
  accessToken: string
  refreshToken: string
}
