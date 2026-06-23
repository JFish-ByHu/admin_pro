export interface OperationLogItem {
  id: string
  userId: string | null
  username: string | null
  nickname: string | null
  module: string
  action: string
  target: string | null
  detail: string | null
  ip: string | null
  userAgent: string | null
  httpMethod: string
  url: string
  duration: number
  result: 'success' | 'fail'
  errorMessage: string | null
  createTime: string
}

export interface OperationLogListResponse {
  list: OperationLogItem[]
  total: number
  page: number
  pageSize: number
}
