<script setup lang="ts">
import type { UserInfo } from '@/types/user'

defineProps<{
  row: UserInfo
}>()
</script>

<template>
  <div class="user-cell">
    <el-avatar :size="34" class="user-avatar">
      {{ row.nickname.charAt(0) }}
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
  gap: 10px;

  .user-avatar {
    flex-shrink: 0;
    background-color: var(--c-info);
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
