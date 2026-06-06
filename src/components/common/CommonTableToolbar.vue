<script setup lang="ts">
import { computed, useSlots, type Component } from 'vue'

export interface CommonTableToolbarAction {
  key: string
  label: string
  permission?: string | string[]
  icon?: Component
  type?: 'primary' | 'success' | 'warning' | 'danger' | 'info'
  size?: 'large' | 'default' | 'small'
  color?: string
  plain?: boolean
  text?: boolean
  disabled?: boolean
  loading?: boolean
  onClick?: () => void
}

const props = withDefaults(
  defineProps<{
    actions: CommonTableToolbarAction[]
    showSelectionSummary?: boolean
    selectedCount?: number
    selectedText?: string
    emptyText?: string
    summary?: string
  }>(),
  {
    showSelectionSummary: false,
    selectedCount: 0,
    selectedText: '已选择',
    emptyText: '未选择任何数据',
    summary: ''
  }
)

const slots = useSlots()

const hasSummary = computed(() => {
  return Boolean(slots.summary) || Boolean(props.summary) || props.showSelectionSummary
})

const normalizedSummary = computed(() => {
  return props.summary.trim()
})

const triggerAction = (action: CommonTableToolbarAction) => {
  if (action.disabled || action.loading) {
    return
  }

  action.onClick?.()
}
</script>

<template>
  <div class="common-table-toolbar" :class="{ 'is-actions-only': !hasSummary }">
    <div v-if="hasSummary" class="common-table-toolbar__summary">
      <slot name="summary">
        <template v-if="normalizedSummary">
          <span class="common-table-toolbar__summary-text">{{ normalizedSummary }}</span>
        </template>

        <template v-else-if="showSelectionSummary">
          <span class="common-table-toolbar__summary-label">{{ selectedText }}</span>
          <span class="common-table-toolbar__summary-value">{{ selectedCount }}</span>
          <span class="common-table-toolbar__summary-suffix">项</span>
          <span v-if="selectedCount === 0" class="common-table-toolbar__summary-empty">
            {{ emptyText }}
          </span>
        </template>
      </slot>
    </div>

    <div class="common-table-toolbar__actions">
      <el-button
        v-for="action in actions"
        :key="action.key"
        v-permission="action.permission"
        :icon="action.icon"
        :type="action.type"
        :size="action.size"
        :color="action.color"
        :plain="action.plain"
        :text="action.text"
        :disabled="action.disabled"
        :loading="action.loading"
        @click="triggerAction(action)"
      >
        {{ action.label }}
      </el-button>

      <slot name="actions-after" />
    </div>
  </div>
</template>

<style scoped lang="scss">
.common-table-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  padding: var(--card-padding-sm) 0;
  background-color: transparent;

  &__summary {
    display: flex;
    align-items: baseline;
    gap: var(--space-2);
    min-width: 0;
    color: var(--t-secondary);
    font-size: var(--font-size-base);
  }

  &__summary-label,
  &__summary-suffix,
  &__summary-empty,
  &__summary-text {
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
    gap: var(--space-2);
    flex-wrap: wrap;
  }

  &.is-actions-only {
    justify-content: flex-end;
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
