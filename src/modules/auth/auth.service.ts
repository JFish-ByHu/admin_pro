import { Injectable, BadRequestException, UnauthorizedException, Inject } from '@nestjs/common'
import { CACHE_MANAGER } from '@nestjs/cache-manager'
import type { Cache } from 'cache-manager'
import { randomUUID } from 'crypto'
import * as crypto from 'crypto'
import { JwtService } from '@nestjs/jwt'
import { UserService } from '../user/user.service'
import { RegisterDto } from './dto/register.dto'
import { LoginDto } from './dto/login.dto'
import { getRequiredEnv } from '../../common/config/env'
import { PasswordUtil } from '../../common/utils/password.util'
import {
  AuthUserInfoDto,
  CaptchaResponseDto,
  EncryptKeyResponseDto,
  LoginResponseDto,
  LogoutResponseDto,
  RefreshTokenResponseDto,
  RegisterResponseDto
} from './dto/auth-response.dto'

const REFRESH_TOKEN_CACHE_PREFIX = 'auth:refresh-token:'
const REFRESH_TOKEN_TTL = 7 * 24 * 60 * 60 * 1000

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache
  ) {}

  /**
   * 生成双 Token (Access & Refresh)
   */
  private generateTokens(userId: string, username: string): RefreshTokenResponseDto {
    const payload = { sub: userId, username }

    // Access Token: 短效 (如 2 小时)
    const accessToken = this.jwtService.sign(payload, {
      secret: getRequiredEnv('JWT_ACCESS_SECRET'),
      expiresIn: '2h'
    })

    // Refresh Token: 长效 (如 7 天)
    const refreshToken = this.jwtService.sign(payload, {
      secret: getRequiredEnv('JWT_REFRESH_SECRET'),
      expiresIn: '7d'
    })

    return {
      accessToken,
      refreshToken
    }
  }

  private buildRefreshTokenCacheKey(userId: string): string {
    return `${REFRESH_TOKEN_CACHE_PREFIX}${userId}`
  }

  private hashRefreshToken(refreshToken: string): string {
    return crypto.createHash('sha256').update(refreshToken).digest('hex')
  }

  private async storeRefreshToken(userId: string, refreshToken: string): Promise<void> {
    await this.cacheManager.set(
      this.buildRefreshTokenCacheKey(userId),
      this.hashRefreshToken(refreshToken),
      REFRESH_TOKEN_TTL
    )
  }

  private async verifyStoredRefreshToken(userId: string, refreshToken: string): Promise<void> {
    const storedRefreshTokenHash = await this.cacheManager.get<string>(
      this.buildRefreshTokenCacheKey(userId)
    )

    if (!storedRefreshTokenHash) {
      throw new UnauthorizedException('Refresh Token 已失效，请重新登录')
    }

    if (storedRefreshTokenHash !== this.hashRefreshToken(refreshToken)) {
      throw new UnauthorizedException('Refresh Token 无效，请重新登录')
    }
  }

  async revokeRefreshToken(userId: string): Promise<void> {
    await this.cacheManager.del(this.buildRefreshTokenCacheKey(userId))
  }

  private toLogoutResponseDto(): LogoutResponseDto {
    return {
      success: true
    }
  }

  private toCaptchaResponseDto(captchaId: string, code: string): CaptchaResponseDto {
    return {
      captchaId,
      code
    }
  }

  private toEncryptKeyResponseDto(keyId: string, aesKey: string): EncryptKeyResponseDto {
    return {
      keyId,
      aesKey
    }
  }

  private toRegisterResponseDto(user: {
    id: string
    username: string
    email: string
  }): RegisterResponseDto {
    return {
      user: {
        id: user.id,
        username: user.username,
        email: user.email
      }
    }
  }

  async logout(userId: string): Promise<LogoutResponseDto> {
    await this.revokeRefreshToken(userId)

    return this.toLogoutResponseDto()
  }

  private async issueTokens(userId: string, username: string): Promise<RefreshTokenResponseDto> {
    const tokens = this.generateTokens(userId, username)
    await this.storeRefreshToken(userId, tokens.refreshToken)
    return tokens
  }

  private buildUserInfo(user: {
    id: string
    username: string
    email: string
    nickname: string | null
    avatarUrl: string | null
    getDisplayRole(): string
    getPermissionCodes(): string[]
  }): AuthUserInfoDto {
    return {
      id: user.id,
      username: user.username,
      email: user.email,
      nickname: user.nickname,
      avatarUrl: user.avatarUrl,
      role: user.getDisplayRole(),
      permissions: user.getPermissionCodes()
    }
  }

  private toLoginResponseDto(
    tokens: RefreshTokenResponseDto,
    user: {
      id: string
      username: string
      email: string
      nickname: string | null
      avatarUrl: string | null
      getDisplayRole(): string
      getPermissionCodes(): string[]
    }
  ): LoginResponseDto {
    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      userInfo: this.buildUserInfo(user)
    }
  }

  /**
   * 刷新 Token
   */
  async refreshToken(refreshToken: string): Promise<RefreshTokenResponseDto> {
    try {
      const payload = this.jwtService.verify<{ sub: string; username: string }>(refreshToken, {
        secret: getRequiredEnv('JWT_REFRESH_SECRET')
      })

      // 验证用户是否仍然存在/有效
      const user = await this.userService.findById(payload.sub)
      if (!user || !user.isActive) {
        throw new UnauthorizedException('用户已失效，请重新登录')
      }

      await this.verifyStoredRefreshToken(user.id, refreshToken)

      return this.issueTokens(user.id, user.username)
    } catch (e) {
      // 如果 Refresh Token 也过期了，或者签名不对，则抛出 401 强制重新登录
      const errorMessage = e instanceof Error ? e.message : 'Invalid Token'
      throw new UnauthorizedException(errorMessage, 'Refresh Token 过期或无效，请重新登录')
    }
  }

  /**
   * 生成简易数字验证码
   */
  async generateCaptcha(): Promise<CaptchaResponseDto> {
    // 生成唯一标识
    const captchaId = randomUUID()
    // 生成 6 位随机数字
    const code = Math.floor(100000 + Math.random() * 900000).toString()

    // 将验证码存入内存缓存中，有效期在 AppModule 中配置为 5 分钟
    await this.cacheManager.set(`captcha:${captchaId}`, code)

    return this.toCaptchaResponseDto(captchaId, code)
  }

  /**
   * 校验验证码
   */
  async verifyCaptcha(captchaId: string, code: string) {
    const cachedCode = await this.cacheManager.get<string>(`captcha:${captchaId}`)

    if (!cachedCode) {
      throw new BadRequestException('验证码已过期，请点击刷新')
    }

    if (cachedCode !== code) {
      throw new BadRequestException('验证码错误')
    }

    // 校验成功后立即销毁，防止被重复使用
    await this.cacheManager.del(`captcha:${captchaId}`)
  }

  /**
   * 生成动态 AES 密钥
   */
  async generateEncryptKey(): Promise<EncryptKeyResponseDto> {
    const keyId = randomUUID()
    const aesKey = crypto.randomBytes(16).toString('hex')

    // 缓存 5 分钟
    await this.cacheManager.set(`aesKey:${keyId}`, aesKey)

    return this.toEncryptKeyResponseDto(keyId, aesKey)
  }

  /**
   * 获取并校验 AES 密钥
   */
  async getAndVerifyAesKey(keyId: string): Promise<string> {
    const aesKey = await this.cacheManager.get<string>(`aesKey:${keyId}`)

    if (!aesKey) {
      throw new BadRequestException('加密凭证已过期，请重试')
    }

    // 校验成功后立即销毁，保证一次一密
    await this.cacheManager.del(`aesKey:${keyId}`)

    return aesKey
  }

  async register(registerDto: RegisterDto): Promise<RegisterResponseDto> {
    const { username, email, password, otp, captchaId } = registerDto

    // 校验验证码
    await this.verifyCaptcha(captchaId, otp)

    const existingUser = await this.userService.checkUserExists(username, email)
    if (existingUser) {
      if (existingUser.username === username) {
        throw new BadRequestException('该用户名已被注册')
      }
      if (existingUser.email === email) {
        throw new BadRequestException('该邮箱已被注册')
      }
    }

    const passwordHash = await PasswordUtil.hash(password)
    const newUser = await this.userService.create({
      username,
      email,
      passwordHash
    })

    return this.toRegisterResponseDto(newUser)
  }

  async login(loginDto: LoginDto): Promise<LoginResponseDto> {
    const { username, password, otp, captchaId } = loginDto

    // 校验验证码
    await this.verifyCaptcha(captchaId, otp)

    const user = await this.userService.findByUsernameOrEmail(username)
    if (!user) {
      throw new UnauthorizedException('用户名或密码错误')
    }

    if (!user.isActive) {
      throw new UnauthorizedException('账号不可用，请联系管理员')
    }

    const isPasswordValid = await PasswordUtil.compare(password, user.passwordHash)

    if (!isPasswordValid) {
      throw new UnauthorizedException('用户名或密码错误')
    }

    await this.userService.updateLastLogin(user.id)

    const tokens = await this.issueTokens(user.id, user.username)

    return this.toLoginResponseDto(tokens, user)
  }
}
