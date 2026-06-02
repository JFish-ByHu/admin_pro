<script setup lang="ts">
import { computed, type Component } from 'vue'
import { MoreFilled } from '@element-plus/icons-vue'

export interface CommonTableActionItem {
  key: string
  tooltip: string
  icon?: Component
  type?: 'primary' | 'success' | 'warning' | 'danger' | 'info'
  color?: string
  disabled?: boolean
  plain?: boolean
  text?: boolean
  onClick?: () => void
}

const props = withDefaults(
  defineProps<{
    actions: CommonTableActionItem[]
    size?: 'large' | 'default' | 'small'
    maxVisible?: number
  }>(),
  {
    size: 'small',
    maxVisible: 3
  }
)

const displayMode = computed(() => {
  return props.actions.length > props.maxVisible ? 'dropdown' : 'inline'
})

const visibleActions = computed(() => {
  if (displayMode.value !== 'dropdown') {
    return props.actions
  }

  return props.actions.slice(0, Math.max(props.maxVisible - 1, 0))
})

const dropdownActions = computed(() => {
  if (displayMode.value !== 'dropdown') {
    return []
  }

  return props.actions.slice(Math.max(props.maxVisible - 1, 0))
})

const handleActionClick = (action: CommonTableActionItem) => {
  if (action.disabled) {
    return
  }

  action.onClick?.()
}
</script>

<template>
  <div class="common-action-cell" :class="`is-${displayMode}`">
    <div class="common-action-cell__track">
      <el-tooltip
        v-for="action in visibleActions"
        :key="action.key"
        :content="action.tooltip"
        placement="top"
      >
        <el-button
          :icon="action.icon"
          :type="action.type"
          :color="action.color"
          :disabled="action.disabled"
          :plain="action.plain"
          :text="action.text"
          :size="size"
          @click="handleActionClick(action)"
        />
      </el-tooltip>

      <el-dropdown
        v-if="displayMode === 'dropdown' && dropdownActions.length"
        trigger="click"
        class="is-dropdown"
        @command="
          (key: string) => handleActionClick(dropdownActions.find(action => action.key === key)!)
        "
      >
        <span class="common-action-cell__dropdown-trigger">
          <el-tooltip content="More" placement="top">
            <el-button :size="size" :icon="MoreFilled" plain />
          </el-tooltip>
        </span>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item
              v-for="action in dropdownActions"
              :key="action.key"
              :command="action.key"
              :disabled="action.disabled"
            >
              {{ action.tooltip }}
            </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>
  </div>
</template>

<style scoped lang="scss">
.common-action-cell {
  width: 100%;

  &__track {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 4px;
    min-width: max-content;

    .is-dropdown {
      margin-left: 12px;
    }
  }

  &__more-icon {
    margin-left: 4px;
  }

  &__dropdown-trigger {
    display: inline-flex;
  }

  &.is-inline,
  &.is-dropdown {
    display: flex;
    justify-content: center;
  }
}
</style>
