<script setup lang="ts">
import type { PermissionResourceTableItem } from '@/types/permission'

const props = defineProps<{
  row: PermissionResourceTableItem
}>()

const namePaddingLeft = `${props.row.level * 18}px`
</script>

<template>
  <div class="permission-resource-name" :style="{ paddingLeft: namePaddingLeft }">
    <span class="permission-resource-name__dot" />
    <span class="permission-resource-name__text">{{ row.name }}</span>
  </div>
</template>

<style scoped lang="scss">
.permission-resource-name {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  min-width: 0;

  &__dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background-color: var(--c-info);
    opacity: 0.68;
    flex-shrink: 0;
  }

  &__text {
    color: var(--t-primary);
    font-weight: 500;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
}
</style>
