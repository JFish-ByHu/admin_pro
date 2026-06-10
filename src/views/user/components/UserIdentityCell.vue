<script setup lang="ts">
import { computed } from 'vue'
import type { UserInfo } from '@/types/user'

const props = defineProps<{
  row: UserInfo
}>()

const avatarSrc = computed(() => {
  const avatarUrl = props.row.avatarUrl

  if (!avatarUrl) {
    return ''
  }
  const normalized = avatarUrl.trim()

  if (!normalized) {
    return ''
  }
  if (normalized.startsWith('//')) {
    return `${window.location.protocol}${normalized}`
  }
  if (normalized.startsWith('http://') || normalized.startsWith('https://')) {
    return normalized
  }
  if (normalized.startsWith('/')) {
    return normalized
  }

  return `/${normalized}`
})

const avatarFallbackText = computed(() => {
  const candidate = props.row.username?.trim() || props.row.nickname?.trim() || '?'
  return candidate.slice(0, 1).toUpperCase()
})
</script>

<template>
  <div class="user-cell">
    <el-avatar
      :size="34"
      :src="avatarSrc"
      class="user-avatar"
      :style="{ backgroundColor: avatarSrc ? 'var(--bg-page-light)' : 'var(--c-info)' }"
    >
      {{ avatarFallbackText }}
    </el-avatar>
    <div class="user-info">
      <span class="user-name">{{ row.nickname }}</span>
      <span class="user-account">{{ row.username }}</span>
    </div>
  </div>
</template>

<style scoped lang="scss">
.user-cell {
  display: flex;
  align-items: center;
  gap: var(--card-header-gap);

  .user-avatar {
    flex-shrink: 0;
  }

  .user-info {
    display: flex;
    flex-direction: column;
    min-width: 0;
  }

  .user-name {
    font-weight: 600;
    color: var(--t-info);
    line-height: 1.3;
  }

  .user-account {
    font-size: 12px;
    color: var(--t-secondary);
    line-height: 1.3;
  }
}
</style>
