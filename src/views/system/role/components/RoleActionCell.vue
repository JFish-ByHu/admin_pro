<script setup lang="ts">
import { computed } from 'vue'
import { Edit, UserFilled, Lock, Unlock, Delete } from '@element-plus/icons-vue'
import CommonTableActionCell, {
  type CommonTableActionItem
} from '@/components/common/CommonTableActionCell.vue'
import type { RoleInfo } from '@/types/role'

const props = defineProps<{
  row: RoleInfo
  canEdit: boolean
  canGrantUsers: boolean
  canToggleStatus: boolean
  canDelete: boolean
  grantUsersDisabledReason?: string
  toggleStatusDisabledReason?: string
  deleteDisabledReason?: string
}>()

const emit = defineEmits<{
  (e: 'edit', row: RoleInfo): void
  (e: 'grant-users', row: RoleInfo): void
  (e: 'toggle-status', row: RoleInfo): void
  (e: 'delete', row: RoleInfo): void
}>()

const statusButtonType = computed(() => {
  return props.row.status === 'enabled' ? 'warning' : 'success'
})

const statusButtonIcon = computed(() => {
  return props.row.status === 'enabled' ? Lock : Unlock
})

const actions = computed<CommonTableActionItem[]>(() => {
  return [
    {
      key: 'edit',
      tooltip: props.canEdit ? '编辑角色' : '无编辑权限',
      icon: Edit,
      color: 'var(--c-info)',
      disabled: !props.canEdit,
      onClick: () => emit('edit', props.row)
    },
    {
      key: 'grant-users',
      tooltip: props.canGrantUsers ? '用户授权' : props.grantUsersDisabledReason || '无授权权限',
      icon: UserFilled,
      type: 'primary',
      disabled: !props.canGrantUsers,
      onClick: () => emit('grant-users', props.row)
    },
    {
      key: 'toggle-status',
      tooltip: props.canToggleStatus
        ? props.row.status === 'enabled'
          ? '禁用角色'
          : '启用角色'
        : props.toggleStatusDisabledReason || '无状态变更权限',
      icon: statusButtonIcon.value,
      type: statusButtonType.value,
      disabled: !props.canToggleStatus,
      onClick: () => emit('toggle-status', props.row)
    },
    {
      key: 'delete',
      tooltip: props.canDelete ? '删除角色' : props.deleteDisabledReason || '无删除权限',
      icon: Delete,
      type: 'danger',
      disabled: !props.canDelete,
      onClick: () => emit('delete', props.row)
    }
  ]
})
</script>

<template>
  <CommonTableActionCell :actions="actions" />
</template>
