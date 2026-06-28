import { SetMetadata } from '@nestjs/common'

export const LOG_ACTION_KEY = 'logAction'

/** 日志操作元数据 */
export interface LogActionMetadata {
  /** 操作模块，如「用户管理」「角色管理」 */
  module: string
  /** 操作类型，如「新增」「修改」「删除」 */
  action: string
}

/**
 * 标记接口需要记录操作日志
 */
export const LogAction = (module: string, action: string) =>
  SetMetadata(LOG_ACTION_KEY, { module, action })
