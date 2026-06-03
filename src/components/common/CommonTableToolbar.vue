<script setup lang="ts">
import type { Component } from 'vue'

export interface CommonTableToolbarAction {
  key: string
  label: string
  icon?: Component
  type?: 'primary' | 'success' | 'warning' | 'danger' | 'info'
  color?: string
  plain?: boolean
  text?: boolean
  disabled?: boolean
  loading?: boolean
  onClick?: () => void
}

withDefaults(
  defineProps<{
    actions: CommonTableToolbarAction[]
    selectedCount?: number
    selectedText?: string
    emptyText?: string
  }>(),
  {
    selectedCount: 0,
    selectedText: '已选择',
    emptyText: '未选择任何数据'
  }
)

const handleActionClick = (action: CommonTableToolbarAction) => {
  if (action.disabled || action.loading) {
    return
  }

  action.onClick?.()
}
</script>

<template>
  <div class="common-table-toolbar">
    <div class="common-table-toolbar__summary">
      <span class="common-table-toolbar__summary-label">{{ selectedText }}</span>
      <span class="common-table-toolbar__summary-value">{{ selectedCount }}</span>
      <span class="common-table-toolbar__summary-suffix">项</span>
      <span v-if="selectedCount === 0" class="common-table-toolbar__summary-empty">
        {{ emptyText }}
      </span>
    </div>

    <div class="common-table-toolbar__actions">
      <el-button
        v-for="action in actions"
        :key="action.key"
        :icon="action.icon"
        :type="action.type"
        :color="action.color"
        :plain="action.plain"
        :text="action.text"
        :disabled="action.disabled"
        :loading="action.loading"
        @click="handleActionClick(action)"
      >
        {{ action.label }}
      </el-button>
    </div>
  </div>
</template>

<style scoped lang="scss">
.common-table-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--layout-gap);
  flex-wrap: wrap;
  padding: clamp(10px, 1.2vw, 14px) var(--layout-padding);
  background-color: var(--bg-white);
  border: 1px solid var(--border-light);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);

  &__summary {
    display: flex;
    align-items: baseline;
    gap: 6px;
    min-width: 0;
    color: var(--t-secondary);
    font-size: var(--font-size-base);
  }

  &__summary-label,
  &__summary-suffix,
  &__summary-empty {
    color: var(--t-secondary);
  }

  &__summary-value {
    color: var(--c-primary);
    font-size: var(--font-size-lg);
    font-weight: 700;
    line-height: 1;
  }

  &__actions {
    display: flex;
    align-items: center;
    gap: 10px;
    flex-wrap: wrap;

    :deep(.el-button) {
      border-radius: var(--radius-md);
    }
  }

  @include respond-to(mobile) {
    align-items: stretch;

    &__summary,
    &__actions {
      width: 100%;
    }

    &__actions {
      justify-content: stretch;

      :deep(.el-button) {
        flex: 1;
      }
    }
  }
}
</style>