import { io, type Socket } from 'socket.io-client'

export interface RbacChangedPayload {
  scope: 'menu' | 'permission' | 'role-user' | 'rbac'
  roleId?: string
  userId?: string
  at: number
}

type RbacChangedListener = (payload: RbacChangedPayload) => void

let socket: Socket | null = null
const listeners = new Set<RbacChangedListener>()

const resolveWsOrigin = () => {
  // 优先使用后端代理目标地址（WebSocket 需直连后端,不走 Vite HTTP 代理）
  const proxyTarget = import.meta.env.VITE_PROXY_TARGET
  if (typeof proxyTarget === 'string' && proxyTarget) {
    return proxyTarget
  }

  // 兜底：同源部署或生产环境
  return window.location.origin
}

const emitToListeners = (payload: RbacChangedPayload) => {
  listeners.forEach(listener => {
    listener(payload)
  })
}

export const ensureWsConnected = (accessToken: string) => {
  if (!accessToken) {
    return
  }

  if (socket) {
    socket.auth = {
      token: accessToken
    }

    if (!socket.connected) {
      socket.connect()
    }

    return
  }

  socket = io(`${resolveWsOrigin()}/ws`, {
    path: '/socket.io',
    transports: ['websocket'],
    autoConnect: true,
    reconnection: true,
    withCredentials: true,
    auth: {
      token: accessToken
    }
  })

  socket.on('rbac:changed', payload => {
    emitToListeners(payload as RbacChangedPayload)
  })
}

export const disconnectWs = () => {
  if (!socket) {
    return
  }

  socket.removeAllListeners('rbac:changed')
  socket.disconnect()
  socket = null
}

export const subscribeRbacChanged = (listener: RbacChangedListener) => {
  listeners.add(listener)

  return () => {
    listeners.delete(listener)
  }
}
