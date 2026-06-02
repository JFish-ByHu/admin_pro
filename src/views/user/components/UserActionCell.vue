<script setup lang="ts">
import { computed } from 'vue'
import { Edit, Lock, Unlock, Delete } from '@element-plus/icons-vue'
import CommonTableActionCell, {
  type CommonTableActionItem
} from '@/components/common/CommonTableActionCell.vue'
import type { UserInfo } from '@/types/user'

const props = defineProps<{
  row: UserInfo
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
      tooltip: 'edit user',
      icon: Edit,
      color: 'var(--c-info)',
      onClick: () => emit('edit', props.row)
    },
    {
      key: 'toggle-status',
      tooltip: props.row.status === 'enabled' ? 'disable user' : 'enable user',
      icon: statusButtonIcon.value,
      type: statusButtonType.value,
      onClick: () => emit('toggle-status', props.row)
    },
    {
      key: 'delete',
      tooltip: 'delete user',
      icon: Delete,
      type: 'danger',
      onClick: () => emit('delete', props.row)
    }
  ]
})
</script>

<template>
  <CommonTableActionCell :actions="actions" />
</template>
