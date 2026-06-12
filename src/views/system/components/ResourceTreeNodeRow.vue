<script setup lang="ts">
import type { TagProps } from 'element-plus'

const props = withDefaults(
  defineProps<{
    name: string
    tagLabel: string
    tagType?: TagProps['type']
    descriptor: string
  }>(),
  {
    tagType: 'info'
  }
)
</script>

<template>
  <div class="resource-tree-node-row">
    <span class="resource-tree-node-row__name">{{ props.name }}</span>
    <el-tag :type="props.tagType" effect="light">{{ props.tagLabel }}</el-tag>
    <span class="resource-tree-node-row__descriptor">{{ props.descriptor || '-' }}</span>
  </div>
</template>

<style scoped lang="scss">
.resource-tree-node-row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--space-2);
  width: 100%;
  min-width: 0;
  line-height: 1.4;

  &__name {
    color: var(--t-primary);
    font-size: 13px;
    font-weight: 500;
  }

  &__descriptor {
    color: var(--t-placeholder);
    font-size: 12px;
    white-space: normal;
    word-break: break-all;
    line-height: 1.35;
  }
}
</style>
