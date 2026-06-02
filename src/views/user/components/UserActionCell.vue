<script setup lang="ts">
import { computed } from 'vue'
import { Edit, Lock, Unlock, Delete } from '@element-plus/icons-vue'
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
</script>

<template>
  <div class="action-cell">
    <el-button color="var(--c-info)" size="small" :icon="Edit" @click="emit('edit', row)" />
    <el-button
      :icon="statusButtonIcon"
      :type="statusButtonType"
      size="small"
      @click="emit('toggle-status', row)"
    />
    <el-button type="danger" size="small" :icon="Delete" @click="emit('delete', row)" />
  </div>
</template>

<style scoped lang="scss">
.action-cell {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
}
</style>
