import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { Observable, throwError } from 'rxjs'
import { catchError, tap } from 'rxjs/operators'
import { Request } from 'express'
import { LOG_ACTION_KEY, LogActionMetadata } from './log-action.decorator'
import { LoggingService } from './logging.service'

/** 从请求中提取操作对象名称 */
const extractTargetName = (request: Request): string | null => {
  const body = (request.body || {}) as Record<string, unknown>

  if (typeof body.name === 'string' && body.name.trim()) {
    return body.name.trim()
  }

  if (typeof body.nickname === 'string' && body.nickname.trim()) {
    return body.nickname.trim()
  }

  if (typeof body.username === 'string' && body.username.trim()) {
    return body.username.trim()
  }

  return null
}

/** 脱敏 body，移除密码等敏感字段 */
const sanitizeBody = (body: Record<string, unknown>): Record<string, unknown> => {
  const safe = { ...body }
  const sensitiveKeys = ['password', 'newPassword', 'confirmPassword', 'token', 'refreshToken']

  sensitiveKeys.forEach(key => {
    if (key in safe) {
      safe[key] = '***'
    }
  })

  return safe
}

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name)

  constructor(
    private readonly reflector: Reflector,
    private readonly loggingService: LoggingService
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const metadata = this.reflector.getAllAndOverride<LogActionMetadata | undefined>(
      LOG_ACTION_KEY,
      [context.getHandler(), context.getClass()]
    )

    // 未标记 @LogAction 的接口不记录
    if (!metadata) {
      return next.handle()
    }

    const request = context.switchToHttp().getRequest<Request>()
    const startTime = Date.now()
    const user = (request as unknown as Record<string, unknown>).user as
      | { id?: string; username?: string; nickname?: string }
      | Record<string, unknown>
      | undefined

    const baseLog = {
      module: metadata.module,
      action: metadata.action,
      userId: (user?.id as string) || null,
      username: (user?.username as string) || null,
      nickname: (user?.nickname as string) || null,
      target: extractTargetName(request),
      detail: JSON.stringify(sanitizeBody((request.body as Record<string, unknown>) || {})),
      ip: request.ip || request.socket?.remoteAddress || null,
      userAgent: request.headers?.['user-agent'] || null,
      httpMethod: request.method || 'UNKNOWN',
      url: request.originalUrl || request.url || ''
    }

    return next.handle().pipe(
      tap(() => {
        const duration = Date.now() - startTime

        this.loggingService
          .writeLog({
            ...baseLog,
            duration,
            result: 'success',
            errorMessage: null
          })
          .catch(error => {
            this.logger.error('写入操作日志失败', error)
          })
      }),
      catchError((error: unknown) => {
        const duration = Date.now() - startTime

        let errorMessage = '未知错误'
        if (error instanceof Error) {
          errorMessage = error.message
        }

        this.loggingService
          .writeLog({
            ...baseLog,
            duration,
            result: 'fail',
            errorMessage
          })
          .catch(logError => {
            this.logger.error('写入操作日志失败', logError)
          })

        return throwError(() => error as Error)
      })
    )
  }
}
