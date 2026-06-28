import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Injectable,
  Logger
} from '@nestjs/common'
import { Response, Request } from 'express'
import { ApiErrorResponseEnvelope } from '../response/api-response'
import { LoggingService } from '../../modules/logging/logging.service'
import { extractTargetName, sanitizeBody } from '../utils/log-target.util'

@Injectable()
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name)

  constructor(private readonly loggingService: LoggingService) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp()
    const response = ctx.getResponse<Response>()
    const request = ctx.getRequest<Request>()

    let status = HttpStatus.INTERNAL_SERVER_ERROR
    let message = '服务器内部错误'

    if (exception instanceof HttpException) {
      status = exception.getStatus()
      const exceptionResponse = exception.getResponse()

      if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        const responseObj = exceptionResponse as Record<string, unknown>

        if ('message' in responseObj) {
          const msg = responseObj.message
          if (Array.isArray(msg) && msg.length > 0) {
            message = String(msg[0])
          } else if (typeof msg === 'string') {
            message = msg
          }
        }
      } else if (typeof exceptionResponse === 'string') {
        message = exceptionResponse
      } else {
        message = exception.message
      }
    } else if (exception instanceof Error) {
      message = exception.message
    }

    // 写入异常日志（不阻塞响应）
    this.writeErrorLog(request, status, message).catch(error => {
      this.logger.error('写入异常日志失败', error)
    })

    // 统一格式化错误响应
    const result: ApiErrorResponseEnvelope = {
      code: status,
      message,
      data: null
    }

    response.status(status).json(result)
  }

  /** 异步写入异常日志 */
  private async writeErrorLog(request: Request, status: number, errorMessage: string) {
    const user = (request as unknown as Record<string, unknown>).user as
      | { id?: string; username?: string; nickname?: string }
      | Record<string, unknown>
      | undefined

    await this.loggingService.writeLog({
      module: '异常',
      action: `${status}`,
      userId: (user?.id as string) || null,
      username: (user?.username as string) || null,
      nickname: (user?.nickname as string) || null,
      target: extractTargetName(request),
      detail: JSON.stringify(sanitizeBody((request.body as Record<string, unknown>) || {})),
      ip: request.ip || request.socket?.remoteAddress || null,
      userAgent: request.headers?.['user-agent'] || null,
      httpMethod: request.method || 'UNKNOWN',
      url: request.originalUrl || request.url || '',
      duration: 0,
      result: 'fail',
      errorMessage
    })
  }
}
