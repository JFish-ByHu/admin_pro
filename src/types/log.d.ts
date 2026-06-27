/** 操作日志条目 */
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

/** 日志列表响应 */
export interface OperationLogListResult {
  list: OperationLogItem[]
  total: number
  page: number
  pageSize: number
}

/** 日志列表查询参数 */
export interface LogQuery {
  keyword?: string
  module?: string
  action?: string
  result?: 'success' | 'fail'
  startDate?: string
  endDate?: string
  page?: number
  pageSize?: number
}
