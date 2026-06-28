import { Request } from 'express'

/** 从请求 URL 中提取路径末尾的 UUID/ID */
const extractUrlLastSegment = (url: string): string | null => {
  // 去掉 query string
  const path = url.split('?')[0] || ''
  // 去掉末尾 /
  const normalized = path.endsWith('/') ? path.slice(0, -1) : path
  // 取最后一段
  const segments = normalized.split('/')
  const last = segments[segments.length - 1]

  // 过滤掉已知的动作词
  const actionWords = new Set([
    'add',
    'update',
    'delete',
    'batchDelete',
    'list',
    'detail',
    'tree',
    'login',
    'emailLogin',
    'logout',
    'register',
    'refresh',
    'send',
    'verify',
    'emailCheck',
    'reset',
    'emailCode',
    'captcha',
    'encryptKey',
    'me',
    'grant',
    'assignRoles',
    'roleDetail',
    'password'
  ])

  if (last && !actionWords.has(last)) {
    return last
  }

  return null
}

/** 格式化批量操作的 ids 数组 */
const formatBatchIds = (ids: unknown[]): string | null => {
  if (!Array.isArray(ids) || ids.length === 0) return null
  if (ids.length === 1) return String(ids[0])
  return `共${ids.length}个`
}

/** 格式化授权操作（roleId + 资源列表） */
const formatGrantTarget = (body: Record<string, unknown>): string | null => {
  const roleId = typeof body.roleId === 'string' ? body.roleId : null
  const userId = typeof body.userId === 'string' ? body.userId : null
  const menuIds = Array.isArray(body.menuIds) ? body.menuIds : null
  const permissionIds = Array.isArray(body.permissionIds) ? body.permissionIds : null
  const roleIds = Array.isArray(body.roleIds) ? body.roleIds : null

  const subjectId = roleId || userId

  if (!subjectId) return null

  const resourceIds = menuIds || permissionIds || roleIds
  if (resourceIds) {
    return `角色/用户「${subjectId}」← ${resourceIds.length} 项`
  }

  return `角色/用户「${subjectId}」`
}

/**
 * 从请求中智能提取操作对象名称
 *
 * 优先级：
 * 1. body.name（角色/菜单/权限的名称）
 * 2. body.nickname / body.username（用户名称）
 * 3. 批量操作 ids[]（id 列表汇总）
 * 4. 授权类 roleId + resourceIds
 * 5. URL 末尾 ID 段（删除/更新等通过 URL param 传 ID 的场景）
 */
export const extractTargetName = (request: Request): string | null => {
  const body = (request.body || {}) as Record<string, unknown>

  // ① 直接名称字段
  if (typeof body.name === 'string' && body.name.trim()) {
    return body.name.trim()
  }

  if (typeof body.nickname === 'string' && body.nickname.trim()) {
    return body.nickname.trim()
  }

  if (typeof body.username === 'string' && body.username.trim()) {
    return body.username.trim()
  }

  // ② 批量操作：ids[]
  if (Array.isArray(body.ids)) {
    const formatted = formatBatchIds(body.ids)
    if (formatted) return formatted
  }

  // ③ 授权类操作：roleId / userId + 资源列表
  const grantTarget = formatGrantTarget(body)
  if (grantTarget) return grantTarget

  // ④ 从 URL 末尾提取 ID（覆盖「删除/更新某个资源」的场景）
  const urlId = extractUrlLastSegment(request.originalUrl || request.url || '')
  if (urlId) return `ID: ${urlId}`

  // ⑤ 兜底：部分接口 body 中无以上字段但仍有操作对象语义
  if (typeof body.email === 'string' && body.email.trim()) {
    return body.email.trim()
  }

  return null
}

/** 脱敏 body，移除密码等敏感字段 */
export const sanitizeBody = (body: Record<string, unknown>): Record<string, unknown> => {
  const safe = { ...body }
  const sensitiveKeys = ['password', 'newPassword', 'confirmPassword', 'token', 'refreshToken']

  sensitiveKeys.forEach(key => {
    if (key in safe) {
      safe[key] = '***'
    }
  })

  return safe
}
