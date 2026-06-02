import type { MessageOptions } from 'element-plus'

/**
 * 基于 ElMessage 封装全局 Message 提示
 * 默认开启 plain (浅色背景) 和 grouping (防重复刷屏) 以及 showClose (显示关闭按钮)
 */
const baseMessage = (options: MessageOptions) => {
  return ElMessage({
    plain: true,
    grouping: true,
    showClose: true,
    ...options
  })
}

export const Message = {
  primary: (msg: string) => baseMessage({ message: msg, type: 'primary' }),
  success: (msg: string) => baseMessage({ message: msg, type: 'success' }),
  warning: (msg: string) => baseMessage({ message: msg, type: 'warning' }),
  error: (msg: string) => baseMessage({ message: msg, type: 'error' }),
  info: (msg: string) => baseMessage({ message: msg, type: 'info' })
}
