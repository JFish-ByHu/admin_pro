import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { getCurrentUserInfo } from '@/api/auth'
import type { UserInfo } from '@/types/auth'

export const useUserStore = defineStore(
  'user',
  () => {
    const accessToken = ref<string>('')
    const refreshToken = ref<string>('')
    const userInfo = ref<UserInfo | null>(null)
    const lastSyncedAt = ref(0)
    const syncingPromise = ref<Promise<UserInfo> | null>(null)

    const permissions = computed(() => userInfo.value?.permissions || [])
    const menuTree = computed(() => userInfo.value?.menuTree || [])
    const hasMenuRouteControl = computed(() => Array.isArray(userInfo.value?.menuTree))
    const menuRoutePaths = computed(() => {
      if (!hasMenuRouteControl.value) {
        return []
      }

      const collectPaths = (nodes: NonNullable<UserInfo['menuTree']>): string[] => {
        const paths: string[] = []

        nodes.forEach(node => {
          if (node.routePath) {
            paths.push(node.routePath)
          }

          if (node.children.length > 0) {
            paths.push(...collectPaths(node.children))
          }
        })

        return paths
      }

      return collectPaths(userInfo.value?.menuTree || [])
    })

    const setTokens = (access: string, refresh: string) => {
      accessToken.value = access
      refreshToken.value = refresh
    }

    const setUserInfo = (info: UserInfo) => {
      userInfo.value = info
      lastSyncedAt.value = Date.now()
    }

    const syncCurrentUserInfo = async (options?: { force?: boolean; maxAgeMs?: number }) => {
      const hasToken = Boolean(accessToken.value)
      if (!hasToken) {
        throw new Error('No access token available')
      }

      const force = options?.force ?? false
      const maxAgeMs = options?.maxAgeMs ?? 3000
      const isFresh =
        Boolean(userInfo.value) && Date.now() - lastSyncedAt.value <= Math.max(0, maxAgeMs)

      if (!force && isFresh && userInfo.value) {
        return userInfo.value
      }

      if (syncingPromise.value) {
        return syncingPromise.value
      }

      syncingPromise.value = getCurrentUserInfo()
        .then(info => {
          setUserInfo(info)
          return info
        })
        .finally(() => {
          syncingPromise.value = null
        })

      return syncingPromise.value
    }

    const logout = () => {
      accessToken.value = ''
      refreshToken.value = ''
      userInfo.value = null
      lastSyncedAt.value = 0
      syncingPromise.value = null
    }

    return {
      accessToken,
      refreshToken,
      userInfo,
      permissions,
      menuTree,
      hasMenuRouteControl,
      menuRoutePaths,
      setTokens,
      setUserInfo,
      syncCurrentUserInfo,
      logout
    }
  },
  {
    persist: {
      // 仅持久化 Token，用户信息一律走接口同步，避免本地缓存陈旧
      pick: ['accessToken', 'refreshToken']
    }
  }
)
