import request from '@/utils/request'
import type {
  CaptchaResult,
  CheckResetEmailResult,
  EmailLoginParams,
  EmailCodeScene,
  EncryptKeyResult,
  LoginParams,
  LoginResult,
  RefreshTokenResult,
  RegisterParams,
  ResetPasswordParams,
  ResetPasswordResult,
  SendEmailCodeResult,
  UserInfo,
  VerifyEmailCodeResult
} from '@/types/auth'

/**
 * 获取验证码
 */
export const getCaptcha = (): Promise<CaptchaResult> => {
  return request({
    url: '/auth/captcha',
    method: 'get'
  })
}

/**
 * 获取动态加密的密钥
 */
export const getEncryptKey = (): Promise<EncryptKeyResult> => {
  return request({
    url: '/auth/encryptKey',
    method: 'get'
  })
}

/**
 * 发送邮箱验证码
 */
export const sendEmailCode = (
  email: string,
  scene: EmailCodeScene = 'register'
): Promise<SendEmailCodeResult> => {
  return request({
    url: '/auth/emailCode/send',
    method: 'post',
    data: { email, scene }
  })
}

/**
 * 校验邮箱验证码并获取验证票据
 */
export const verifyEmailCode = (
  email: string,
  code: string,
  scene: EmailCodeScene = 'register'
): Promise<VerifyEmailCodeResult> => {
  return request({
    url: '/auth/emailCode/verify',
    method: 'post',
    data: { email, code, scene }
  })
}

/**
 * 刷新 Token
 * @returns 刷新后的 Token
 */
export const refreshTokens = (refreshToken: string): Promise<RefreshTokenResult> => {
  return request({
    url: '/auth/refresh',
    method: 'post',
    data: { refreshToken }
  })
}

/**
 * 用户登录
 * @returns 登录结果
 */
export const login = (data: LoginParams): Promise<LoginResult> => {
  return request({
    url: '/auth/login',
    method: 'post',
    data
  })
}

export const emailLogin = (data: EmailLoginParams): Promise<LoginResult> => {
  return request({
    url: '/auth/emailLogin',
    method: 'post',
    data
  })
}

export const getCurrentUserInfo = (): Promise<UserInfo> => {
  return request({
    url: '/auth/me',
    method: 'get'
  })
}

export const checkResetEmail = (email: string): Promise<CheckResetEmailResult> => {
  return request({
    url: '/auth/password/emailCheck',
    method: 'post',
    data: { email }
  })
}

export const resetPassword = (data: ResetPasswordParams): Promise<ResetPasswordResult> => {
  return request({
    url: '/auth/password/reset',
    method: 'post',
    data
  })
}

/**
 * 用户注册
 * @returns 注册结果
 */
export const register = (data: RegisterParams) => {
  return request({
    url: '/auth/register',
    method: 'post',
    data
  })
}
