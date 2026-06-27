export interface ApiSuccessBody<T> {
  message?: string
  data: T
}

export interface ApiResponseEnvelope<T> {
  code: number
  message: string
  data: T
}

export interface ApiErrorResponseEnvelope {
  code: number
  message: string
  data: null
}

export const success = <T>(data: T, message?: string): ApiSuccessBody<T> => {
  return message ? { message, data } : { data }
}
