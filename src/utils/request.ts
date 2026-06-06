import axios from 'axios'
import type { AxiosInstance, InternalAxiosRequestConfig, AxiosResponse, AxiosError } from 'axios'
import router from '@/router'
import NProgress from 'nprogress'
import { Message } from '@/utils/message'
import { useUserStore } from '@/stores/user'
import { refreshTokens } from '@/api/auth'

// 创建 Axios 实例==========================================
// NProgress 全局配置 & 节流
// ==========================================
NProgress.configure({
  showSpinner: false, // 关闭右上角 spinner，避免额外 DOM 节点
  trickleSpeed: 200,
  minimum: 0.15
})

// 仅在请求耗时 > PROGRESS_DELAY 时才显示进度条；并发请求合并为同一进度条
const PROGRESS_DELAY = 300
let pendingCount = 0
let progressTimer: ReturnType<typeof setTimeout> | null = null

const startRequestProgress = () => {
  pendingCount++
  if (pendingCount === 1 && progressTimer === null) {
    progressTimer = setTimeout(() => {
      NProgress.start()
      progressTimer = null
    }, PROGRESS_DELAY)
  }
}

const finishRequestProgress = () => {
  pendingCount = Math.max(0, pendingCount - 1)
  if (pendingCount > 0) return

  // 所有请求都已结束
  if (progressTimer !== null) {
    // 进度条还没来得及显示，直接取消
    clearTimeout(progressTimer)
    progressTimer = null
  } else {
    // 进度条已经显示，正常收尾
    NProgress.done()
  }
}

// 创建 Axios 实例
const service: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 10000,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json;charset=utf-8'
  }
})

// ==========================================
// 1. 请求拦截器 (Request Interceptor)
// ==========================================
service.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    startRequestProgress()

    // 携带 Access Token
    const userStore = useUserStore()
    if (userStore.accessToken) {
      config.headers['Authorization'] = `Bearer ${userStore.accessToken}`
    }

    return config
  },
  (error: AxiosError) => {
    finishRequestProgress()
    return Promise.reject(error)
  }
)

// ==========================================
// 2. 响应拦截器 (Response Interceptor)
// ==========================================

let isRefreshing = false
let requestsQueue: Array<(token: string) => void> = []

service.interceptors.response.use(
  (response: AxiosResponse) => {
    finishRequestProgress()

    const res = response.data

    // 后端统一了返回结构 { code, data, message }
    // 业务成功
    if (res.code === 200) {
      return res.data
    }

    // 业务错误 (即使 HTTP 状态码是 200，但业务 code 不是 200)
    Message.error(res.message || 'server error')
    return Promise.reject(new Error(res.message || 'Error'))
  },
  (error: AxiosError) => {
    finishRequestProgress()

    // 处理网络层面的错误或后端抛出的 HTTP 异常状态码
    if (error.response) {
      const status = error.response.status
      const errorData = error.response.data as { code?: number; message?: string; data?: null }
      const errorMessage = errorData?.message || error.message || 'Network request error'

      switch (status) {
        case 400:
          Message.error(errorMessage)
          break
        case 401:
          if (
            error.config?.url?.includes('/auth/login') ||
            error.config?.url?.includes('/auth/refresh')
          ) {
            Message.error(errorMessage)

            if (error.config?.url?.includes('/auth/refresh')) {
              // Refresh Token 失效，彻底退出
              const userStore = useUserStore()
              userStore.logout()
              router.replace({
                path: '/auth',
                query: { redirect: router.currentRoute.value.fullPath }
              })
            }
            break
          }

          const userStore = useUserStore()
          if (!userStore.refreshToken) {
            // 连 refreshToken 都没有，直接去登录
            Message.warning('Login has expired, please log in again')
            userStore.logout()
            router.replace({
              path: '/auth',
              query: { redirect: router.currentRoute.value.fullPath }
            })
            break
          }

          if (!isRefreshing) {
            isRefreshing = true
            return refreshTokens(userStore.refreshToken)
              .then(res => {
                // 刷新成功，更新本地 Token
                const { accessToken, refreshToken } = res
                userStore.setTokens(accessToken, refreshToken)

                // 遍历队列中所有被挂起的请求，用新的 token 重新发起
                requestsQueue.forEach(cb => cb(accessToken))
                requestsQueue = [] // 清空队列

                if (error.config) {
                  error.config.headers['Authorization'] = `Bearer ${accessToken}`
                  return service(error.config)
                }
              })
              .catch(refreshError => {
                Message.error('Login status expired, please log in again')
                userStore.logout()
                requestsQueue = []
                router.replace({
                  path: '/auth',
                  query: { redirect: router.currentRoute.value.fullPath }
                })
                return Promise.reject(refreshError)
              })
              .finally(() => {
                isRefreshing = false
              })
          } else {
            return new Promise(resolve => {
              requestsQueue.push((newToken: string) => {
                if (error.config) {
                  error.config.headers['Authorization'] = `Bearer ${newToken}`
                  resolve(service(error.config))
                }
              })
            })
          }
        case 403:
          Message.error('Forbidden: You do not have permission to access this resource')
          router.replace('/403')
          break
        case 404:
          Message.error(`Not Found: ${error.config?.url}`)
          break
        case 500:
        case 502:
        case 503:
        case 504:
          Message.error('Network error')
          break
        default:
          Message.error(`Unknown error: ${status}`)
      }
    } else {
      if (error.message.includes('timeout')) {
        Message.error('Network request timeout, please check your connection')
      } else if (error.message.includes('Network Error')) {
        Message.error('Network disconnected, please check your connection')
      } else {
        Message.error(error.message)
      }
    }

    return Promise.reject(error)
  }
)

export default service
