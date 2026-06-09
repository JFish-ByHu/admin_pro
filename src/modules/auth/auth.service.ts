import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  Inject,
  InternalServerErrorException
} from '@nestjs/common'
import { CACHE_MANAGER } from '@nestjs/cache-manager'
import type { Cache } from 'cache-manager'
import { randomUUID } from 'crypto'
import * as crypto from 'crypto'
import { JwtService } from '@nestjs/jwt'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { UserService } from '../user/user.service'
import { RegisterDto } from './dto/register.dto'
import { LoginDto } from './dto/login.dto'
import { SendEmailCodeDto } from './dto/send-email-code.dto'
import { VerifyEmailCodeDto } from './dto/verify-email-code.dto'
import { getRequiredEnv } from '../../common/config/env'
import { PasswordUtil } from '../../common/utils/password.util'
import { EmailVerification } from './entities/email-verification.entity'
import { MailService } from './mail.service'
import {
  AuthUserInfoDto,
  CaptchaResponseDto,
  EncryptKeyResponseDto,
  LoginResponseDto,
  LogoutResponseDto,
  RefreshTokenResponseDto,
  RegisterResponseDto,
  SendEmailCodeResponseDto,
  VerifyEmailCodeResponseDto
} from './dto/auth-response.dto'

// Refresh Token 缓存键前缀
const REFRESH_TOKEN_CACHE_PREFIX = 'auth:refresh-token:'
// Refresh Token 有效期（毫秒）= 7 天
const REFRESH_TOKEN_TTL = 7 * 24 * 60 * 60 * 1000

// 邮箱验证码有效期（毫秒）= 5 分钟
const EMAIL_CODE_EXPIRES_MS = 5 * 60 * 1000
// 邮箱验证码重发冷却时间（毫秒）= 60 秒
const EMAIL_CODE_RESEND_INTERVAL_MS = 60 * 1000
// 单邮箱单场景每日发送上限
const EMAIL_CODE_DAILY_LIMIT = 50
// 单条验证码最大错误尝试次数
const EMAIL_CODE_MAX_ATTEMPTS = 5
// 单 IP 每小时发送上限
const EMAIL_CODE_IP_HOURLY_LIMIT = 30

// 邮箱验证票据缓存键前缀
const EMAIL_VERIFY_TICKET_PREFIX = 'auth:email-ticket:'
// 邮箱验证票据有效期（毫秒）= 10 分钟
const EMAIL_VERIFY_TICKET_TTL_MS = 10 * 60 * 1000

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    private readonly mailService: MailService,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
    @InjectRepository(EmailVerification)
    private readonly emailVerificationRepository: Repository<EmailVerification>
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

  private toSendEmailCodeResponseDto(cooldownSeconds: number): SendEmailCodeResponseDto {
    return {
      success: true,
      cooldownSeconds
    }
  }

  private toVerifyEmailCodeResponseDto(ticket: string): VerifyEmailCodeResponseDto {
    return {
      emailVerifyTicket: ticket,
      expiresInSeconds: Math.floor(EMAIL_VERIFY_TICKET_TTL_MS / 1000)
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

  private normalizeEmail(email: string): string {
    return email.trim().toLowerCase()
  }

  private generateEmailCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString()
  }

  private getTodayKey(): string {
    return new Date().toISOString().slice(0, 10)
  }

  private buildEmailCodeHash(email: string, scene: string, code: string): string {
    const secret = getRequiredEnv('EMAIL_CODE_HASH_SECRET')
    return crypto.createHash('sha256').update(`${secret}:${scene}:${email}:${code}`).digest('hex')
  }

  private buildEmailVerifyTicketCacheKey(ticket: string): string {
    return `${EMAIL_VERIFY_TICKET_PREFIX}${ticket}`
  }

  private async issueEmailVerifyTicket(email: string, scene: string): Promise<string> {
    const ticket = randomUUID()

    await this.cacheManager.set(
      this.buildEmailVerifyTicketCacheKey(ticket),
      { email, scene },
      EMAIL_VERIFY_TICKET_TTL_MS
    )

    return ticket
  }

  private async consumeEmailVerifyTicket(
    email: string,
    scene: string,
    ticket: string
  ): Promise<void> {
    const key = this.buildEmailVerifyTicketCacheKey(ticket)
    const payload = await this.cacheManager.get<{ email: string; scene: string }>(key)

    if (!payload) {
      throw new BadRequestException('邮箱验证凭证无效，请重新获取验证码')
    }

    await this.cacheManager.del(key)

    if (payload.email !== email || payload.scene !== scene) {
      throw new BadRequestException('邮箱验证凭证无效，请重新获取验证码')
    }
  }

  private buildIpHourlyLimitCacheKey(ip: string): string {
    const hourBucket = new Date().toISOString().slice(0, 13)
    return `auth:email-code:ip:${ip}:${hourBucket}`
  }

  private async verifyIpSendLimit(ip?: string): Promise<void> {
    if (!ip) {
      return
    }

    const key = this.buildIpHourlyLimitCacheKey(ip)
    const currentCount = (await this.cacheManager.get<number>(key)) ?? 0

    if (currentCount >= EMAIL_CODE_IP_HOURLY_LIMIT) {
      throw new BadRequestException('发送过于频繁，请稍后再试')
    }

    await this.cacheManager.set(key, currentCount + 1, 60 * 60 * 1000)
  }

  private async getLatestEmailVerification(
    email: string,
    scene: string
  ): Promise<EmailVerification | null> {
    return this.emailVerificationRepository.findOne({
      where: { email, scene },
      order: { createTime: 'DESC' }
    })
  }

  async sendEmailCode(
    dto: SendEmailCodeDto,
    context: { ip?: string; userAgent?: string }
  ): Promise<SendEmailCodeResponseDto> {
    const email = this.normalizeEmail(dto.email)
    const scene = dto.scene
    const todayKey = this.getTodayKey()

    await this.verifyIpSendLimit(context.ip)

    const latestRecord = await this.getLatestEmailVerification(email, scene)
    const now = Date.now()

    if (latestRecord?.lastSentAt) {
      const elapsed = now - latestRecord.lastSentAt.getTime()
      if (elapsed < EMAIL_CODE_RESEND_INTERVAL_MS) {
        throw new BadRequestException('发送过于频繁，请稍后再试')
      }
    }

    const isSameDay = latestRecord?.sendCountDate === todayKey
    const todaySendCount = isSameDay ? (latestRecord?.sendCountDaily ?? 0) : 0
    if (todaySendCount >= EMAIL_CODE_DAILY_LIMIT) {
      throw new BadRequestException('今日发送次数已达上限，请明日再试')
    }

    if (scene === 'register') {
      const emailOwner = await this.userService.checkUserExists('__placeholder__', email)
      if (emailOwner?.email === email) {
        return this.toSendEmailCodeResponseDto(Math.floor(EMAIL_CODE_RESEND_INTERVAL_MS / 1000))
      }
    }

    const code = this.generateEmailCode()

    try {
      await this.mailService.sendRegisterCode(
        email,
        code,
        Math.floor(EMAIL_CODE_EXPIRES_MS / 60000)
      )
    } catch {
      throw new InternalServerErrorException('邮件发送失败，请稍后再试')
    }

    const nextRecord = latestRecord ?? this.emailVerificationRepository.create({ email, scene })
    nextRecord.codeHash = this.buildEmailCodeHash(email, scene, code)
    nextRecord.expiresAt = new Date(now + EMAIL_CODE_EXPIRES_MS)
    nextRecord.usedAt = null
    nextRecord.attemptCount = 0
    nextRecord.lastSentAt = new Date(now)
    nextRecord.sendCountDate = todayKey
    nextRecord.sendCountDaily = todaySendCount + 1
    nextRecord.clientIp = context.ip ?? null
    nextRecord.userAgent = context.userAgent ?? null

    await this.emailVerificationRepository.save(nextRecord)

    return this.toSendEmailCodeResponseDto(Math.floor(EMAIL_CODE_RESEND_INTERVAL_MS / 1000))
  }

  async verifyEmailCode(dto: VerifyEmailCodeDto): Promise<VerifyEmailCodeResponseDto> {
    const email = this.normalizeEmail(dto.email)
    const scene = dto.scene
    const record = await this.getLatestEmailVerification(email, scene)

    if (!record) {
      throw new BadRequestException('验证码无效或已过期')
    }

    if (record.usedAt) {
      throw new BadRequestException('验证码已使用，请重新获取')
    }

    if (record.expiresAt.getTime() < Date.now()) {
      throw new BadRequestException('验证码已过期，请重新获取')
    }

    if (record.attemptCount >= EMAIL_CODE_MAX_ATTEMPTS) {
      throw new BadRequestException('验证码错误次数过多，请重新获取')
    }

    const codeHash = this.buildEmailCodeHash(email, scene, dto.code)
    if (record.codeHash !== codeHash) {
      record.attemptCount += 1
      await this.emailVerificationRepository.save(record)

      if (record.attemptCount >= EMAIL_CODE_MAX_ATTEMPTS) {
        throw new BadRequestException('验证码错误次数过多，请重新获取')
      }

      throw new BadRequestException('验证码错误')
    }

    record.usedAt = new Date()
    await this.emailVerificationRepository.save(record)

    const ticket = await this.issueEmailVerifyTicket(email, scene)
    return this.toVerifyEmailCodeResponseDto(ticket)
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
    const { username, password, emailVerifyTicket } = registerDto
    const email = this.normalizeEmail(registerDto.email)

    await this.consumeEmailVerifyTicket(email, 'register', emailVerifyTicket)

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
