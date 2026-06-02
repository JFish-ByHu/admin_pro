import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { UserInfo } from '@/types/auth'

export const useUserStore = defineStore(
  'user',
  () => {
    const accessToken = ref<string>('')
    const refreshToken = ref<string>('')
    const userInfo = ref<UserInfo | null>(null)

    const permissions = computed(() => userInfo.value?.permissions || [])

    const setTokens = (access: string, refresh: string) => {
      accessToken.value = access
      refreshToken.value = refresh
    }

    const setUserInfo = (info: UserInfo) => {
      userInfo.value = info
    }

    const logout = () => {
      accessToken.value = ''
      refreshToken.value = ''
      userInfo.value = null
    }

    return {
      accessToken,
      refreshToken,
      userInfo,
      permissions,
      setTokens,
      setUserInfo,
      logout
    }
  },
  {
    persist: {
      // 开启持久化，并指定仅缓存核心凭证，防止混入不必要的状态
      pick: ['accessToken', 'refreshToken', 'userInfo']
    }
  }
)
