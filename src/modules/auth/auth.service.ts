import { Injectable, BadRequestException, UnauthorizedException, Inject } from '@nestjs/common'
import { CACHE_MANAGER } from '@nestjs/cache-manager'
import type { Cache } from 'cache-manager'
import { randomUUID } from 'crypto'
import * as crypto from 'crypto'
import { JwtService } from '@nestjs/jwt'
import { UserService } from '../user/user.service'
import { RegisterDto } from './dto/register.dto'
import { LoginDto } from './dto/login.dto'
import * as bcrypt from 'bcryptjs'

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
  private generateTokens(userId: string, username: string) {
    const payload = { sub: userId, username }

    // Access Token: 短效 (如 2 小时)
    const accessToken = this.jwtService.sign(payload, {
      secret: process.env.JWT_ACCESS_SECRET || 'fallback-access-secret',
      expiresIn: '2h'
    })

    // Refresh Token: 长效 (如 7 天)
    const refreshToken = this.jwtService.sign(payload, {
      secret: process.env.JWT_REFRESH_SECRET || 'fallback-refresh-secret',
      expiresIn: '7d'
    })

    return {
      accessToken,
      refreshToken
    }
  }

  /**
   * 刷新 Token
   */
  async refreshToken(refreshToken: string) {
    try {
      const payload = this.jwtService.verify<{ sub: string; username: string }>(refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET || 'fallback-refresh-secret'
      })

      // 验证用户是否仍然存在/有效
      const user = await this.userService.findById(payload.sub)
      if (!user || !user.isActive) {
        throw new UnauthorizedException('用户已失效，请重新登录')
      }
      return this.generateTokens(user.id, user.username)
    } catch (e) {
      // 如果 Refresh Token 也过期了，或者签名不对，则抛出 401 强制重新登录
      const errorMessage = e instanceof Error ? e.message : 'Invalid Token'
      throw new UnauthorizedException(errorMessage, 'Refresh Token 过期或无效，请重新登录')
    }
  }

  /**
   * 生成简易数字验证码
   */
  async generateCaptcha() {
    // 生成唯一标识
    const captchaId = randomUUID()
    // 生成 6 位随机数字
    const code = Math.floor(100000 + Math.random() * 900000).toString()

    // 将验证码存入内存缓存中，有效期在 AppModule 中配置为 5 分钟
    await this.cacheManager.set(`captcha:${captchaId}`, code)

    return {
      captchaId,
      code
    }
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
  async generateEncryptKey() {
    const keyId = randomUUID()
    const aesKey = crypto.randomBytes(16).toString('hex')

    // 缓存 5 分钟
    await this.cacheManager.set(`aesKey:${keyId}`, aesKey)

    return {
      keyId,
      aesKey
    }
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

  async register(registerDto: RegisterDto) {
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

    const salt = await bcrypt.genSalt(10)
    const passwordHash = await bcrypt.hash(password, salt)
    const newUser = await this.userService.create({
      username,
      email,
      passwordHash
    })

    return {
      user: {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email
      }
    }
  }

  async login(loginDto: LoginDto) {
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

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash)

    if (!isPasswordValid && user.passwordHash !== password) {
      throw new UnauthorizedException('用户名或密码错误')
    }

    await this.userService.updateLastLogin(user.id)

    // 生成双 Token
    const tokens = this.generateTokens(user.id, user.username)

    // 提取用户的所有不重复的权限标识
    const permissions = Array.from(
      new Set(user.roles?.flatMap(r => r.permissions?.map(p => p.code) || []) || [])
    )

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      userInfo: {
        id: user.id,
        username: user.username,
        email: user.email,
        nickname: user.nickname,
        avatarUrl: user.avatarUrl,
        role: user.role,
        permissions
      }
    }
  }
}
