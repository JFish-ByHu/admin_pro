import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common'
import { Response } from 'express'

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp()
    const response = ctx.getResponse<Response>()

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
            // 兼容 class-validator 抛出的数组错误
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

    // 统一格式化错误响应
    response.status(status).json({
      code: status,
      message,
      data: null
    })
  }
}
