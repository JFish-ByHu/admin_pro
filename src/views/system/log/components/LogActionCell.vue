<script setup lang="ts">
import { computed } from 'vue'
import { View } from '@element-plus/icons-vue'
import CommonTableActionCell, {
  type CommonTableActionItem
} from '@/components/common/CommonTableActionCell.vue'
import type { OperationLogItem } from '@/types/log'

const props = defineProps<{
  row: OperationLogItem
  canDetail: boolean
}>()

const emit = defineEmits<{
  (e: 'detail', row: OperationLogItem): void
}>()

const actions = computed<CommonTableActionItem[]>(() => {
  return [
    {
      key: 'detail',
      tooltip: props.canDetail ? '查看详情' : '无查看权限',
      icon: View,
      color: 'var(--c-info)',
      disabled: !props.canDetail,
      onClick: () => emit('detail', props.row)
    }
  ]
})
</script>

<template>
  <CommonTableActionCell :actions="actions" />
</template>
