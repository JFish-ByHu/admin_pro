import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  BadRequestException,
  Inject
} from '@nestjs/common'
import { CACHE_MANAGER } from '@nestjs/cache-manager'
import type { Cache } from 'cache-manager'
import * as crypto from 'crypto'
import type { Request } from 'express'

@Injectable()
export class PasswordDecryptInterceptor implements NestInterceptor {
  constructor(@Inject(CACHE_MANAGER) private readonly cacheManager: Cache) {}

  async intercept(context: ExecutionContext, next: CallHandler) {
    const req = context.switchToHttp().getRequest<Request>()
    const body = (req as { body?: unknown }).body

    if (!body || typeof body !== 'object' || !('password' in body) || !('keyId' in body)) {
      return next.handle()
    }

    const valObj = body

    if (typeof valObj.password !== 'string' || typeof valObj.keyId !== 'string') {
      return next.handle()
    }

    const { password, keyId } = valObj

    // 获取 AES 密钥
    const aesKey = await this.cacheManager.get<string>(`aesKey:${keyId}`)

    if (!aesKey) {
      throw new BadRequestException('加密凭证已过期，请重试')
    }

    // 使用完后立即销毁，保证一次一密
    await this.cacheManager.del(`aesKey:${keyId}`)

    // 解密密码
    try {
      const decipher = crypto.createDecipheriv('aes-256-ecb', Buffer.from(aesKey, 'utf8'), null)
      let decryptedPassword = decipher.update(password, 'base64', 'utf8')
      decryptedPassword += decipher.final('utf8')

      // 将解密后的明文覆盖 req.body 里的密文
      if (req.body && typeof req.body === 'object') {
        ;(req.body as Record<string, unknown>).password = decryptedPassword
      }
    } catch {
      throw new BadRequestException('密码解密异常，请重试')
    }

    return next.handle()
  }
}
