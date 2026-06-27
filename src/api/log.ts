import request from '@/utils/request'
import type { OperationLogItem, OperationLogListResult, LogQuery } from '@/types/log'

/** 获取操作日志列表 */
export const getLogList = (params: LogQuery): Promise<OperationLogListResult> => {
  return request({
    url: '/logs/list',
    method: 'get',
    params
  })
}

/** 获取操作日志详情 */
export const getLogDetail = (id: string): Promise<OperationLogItem> => {
  return request({
    url: `/logs/detail/${id}`,
    method: 'get'
  })
}
