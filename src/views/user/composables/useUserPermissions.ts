import { computed, type Ref } from 'vue'
import { useUserStore } from '@/stores/user'
import { USER_PERMISSION_CODES } from '@/constants/permission'
import type { UserInfo } from '@/types/user'

export const useUserPermissions = (selectedRowKeys: Ref<Array<string | number>>) => {
  const userStore = useUserStore()

  const userPermissionSet = computed(() => new Set(userStore.permissions || []))
  const currentUserId = computed(() => userStore.userInfo?.id || '')

  const canCreateUser = computed(() => userPermissionSet.value.has(USER_PERMISSION_CODES.CREATE))
  const canUpdateUser = computed(() => userPermissionSet.value.has(USER_PERMISSION_CODES.UPDATE))
  const canDeleteUser = computed(() => userPermissionSet.value.has(USER_PERMISSION_CODES.DELETE))

  const isSelfSelectedForBatchDelete = computed(() => {
    if (!currentUserId.value) {
      return false
    }

    return selectedRowKeys.value.map(String).includes(currentUserId.value)
  })

  const isSelfTargetUser = (row: UserInfo) => {
    return Boolean(currentUserId.value) && row.id === currentUserId.value
  }

  return {
    currentUserId,
    canCreateUser,
    canUpdateUser,
    canDeleteUser,
    isSelfSelectedForBatchDelete,
    isSelfTargetUser
  }
}
