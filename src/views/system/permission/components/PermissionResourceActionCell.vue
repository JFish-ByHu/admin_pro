<script setup lang="ts">
import { computed } from 'vue'
import { Edit, Delete } from '@element-plus/icons-vue'
import CommonTableActionCell, {
  type CommonTableActionItem
} from '@/components/common/CommonTableActionCell.vue'
import type { PermissionResourceTableItem } from '@/types/permission'

const props = defineProps<{
  row: PermissionResourceTableItem
  canEdit: boolean
  canDelete: boolean
  deleteDisabledReason?: string
}>()

const emit = defineEmits<{
  (e: 'edit', row: PermissionResourceTableItem): void
  (e: 'delete', row: PermissionResourceTableItem): void
  (e: 'editGroup', row: PermissionResourceTableItem): void
  (e: 'deleteGroup', row: PermissionResourceTableItem): void
}>()

const isGroup = computed(() => props.row.id.startsWith('__group__'))

const actions = computed<CommonTableActionItem[]>(() => {
  if (isGroup.value) {
    return [
      {
        key: 'edit-group',
        tooltip: props.canEdit ? '编辑分组' : '无编辑权限',
        icon: Edit,
        color: 'var(--c-info)',
        disabled: !props.canEdit,
        onClick: () => emit('editGroup', props.row)
      },
      {
        key: 'delete-group',
        tooltip: props.canDelete ? '删除分组' : props.deleteDisabledReason || '无删除权限',
        icon: Delete,
        type: 'danger',
        disabled: !props.canDelete,
        onClick: () => emit('deleteGroup', props.row)
      }
    ]
  }

  return [
    {
      key: 'edit',
      tooltip: props.canEdit ? '编辑权限' : '无编辑权限',
      icon: Edit,
      color: 'var(--c-info)',
      disabled: !props.canEdit,
      onClick: () => emit('edit', props.row)
    },
    {
      key: 'delete',
      tooltip: props.canDelete ? '删除权限' : props.deleteDisabledReason || '无删除权限',
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
