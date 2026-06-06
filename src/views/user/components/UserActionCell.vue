<script setup lang="ts">
import { computed } from 'vue'
import { Edit, Lock, Unlock, Delete } from '@element-plus/icons-vue'
import CommonTableActionCell, {
  type CommonTableActionItem
} from '@/components/common/CommonTableActionCell.vue'
import type { UserInfo } from '@/types/user'

const props = defineProps<{
  row: UserInfo
  canEdit: boolean
  canToggleStatus: boolean
  canDelete: boolean
  toggleStatusDisabledReason?: string
  deleteDisabledReason?: string
}>()

const emit = defineEmits<{
  (e: 'edit', row: UserInfo): void
  (e: 'toggle-status', row: UserInfo): void
  (e: 'delete', row: UserInfo): void
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
      tooltip: props.canEdit ? '编辑用户' : '无编辑权限',
      icon: Edit,
      color: 'var(--c-info)',
      disabled: !props.canEdit,
      onClick: () => emit('edit', props.row)
    },
    {
      key: 'toggle-status',
      tooltip: props.canToggleStatus
        ? props.row.status === 'enabled'
          ? '禁用用户'
          : '启用用户'
        : props.toggleStatusDisabledReason || '无状态变更权限',
      icon: statusButtonIcon.value,
      type: statusButtonType.value,
      disabled: !props.canToggleStatus,
      onClick: () => emit('toggle-status', props.row)
    },
    {
      key: 'delete',
      tooltip: props.canDelete ? '删除用户' : props.deleteDisabledReason || '无删除权限',
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
