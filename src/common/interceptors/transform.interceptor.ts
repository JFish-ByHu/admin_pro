import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common'
import { Observable } from 'rxjs'
import { map } from 'rxjs/operators'

export interface Response<T> {
  code: number
  message: string
  data: T
}

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, Response<T>> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<Response<T>> {
    return next.handle().pipe(
      map(data => {
        const unknownData = data as unknown

        let message = '操作成功'
        let resultData: unknown = unknownData

        if (typeof unknownData === 'object' && unknownData !== null) {
          const dataObj = unknownData as Record<string, unknown>

          if ('message' in dataObj && dataObj.message !== undefined) {
            message =
              typeof dataObj.message === 'string'
                ? dataObj.message
                : JSON.stringify(dataObj.message)
          }

          if ('data' in dataObj) {
            resultData = dataObj.data
          }
        }

        return {
          code: 200,
          message,
          data: resultData as T
        }
      })
    )
  }
}
