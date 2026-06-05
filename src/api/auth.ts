import request from '@/utils/request'
import type {
  CaptchaResult,
  EncryptKeyResult,
  LoginParams,
  LoginResult,
  RegisterParams
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
 * 刷新 Token
 * @returns 刷新后的 Token
 */
export const refreshTokens = (refreshToken: string) => {
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
