<script setup lang="ts" generic="T extends Record<string, any>">
import { computed, ref, watch } from 'vue'
import { useTableSettingsStore } from '@/stores/tableSettings'

/**
 * 筛选字段配置
 */
export interface TableFilterField {
  /** 字段名，对应 modelValue 的 key */
  prop: string
  /** 标签文本 */
  label: string
  /** 控件类型 */
  type?: 'input' | 'select' | 'date' | 'daterange'
  /** 占位提示 */
  placeholder?: string
  /** select 类型的可选项 */
  options?: { label: string; value: string | number }[]
  /** 是否可清空，默认 true */
  clearable?: boolean
}

const props = withDefaults(
  defineProps<{
    /** 筛选字段配置列表 */
    fields: TableFilterField[]
    /** 双向绑定的筛选条件对象 */
    modelValue: T
    /** 查询按钮加载状态 */
    loading?: boolean
    /** 是否支持折叠 */
    collapsible?: boolean
    /** 折叠状态（v-model） */
    collapsed?: boolean
    /** 持久化标识，传入后自动记住折叠状态 */
    settingsKey?: string
  }>(),
  {
    loading: false,
    collapsible: false,
    collapsed: false,
    settingsKey: ''
  }
)

const emit = defineEmits<{
  (e: 'update:modelValue', value: T): void
  (e: 'search'): void
  (e: 'reset'): void
  (e: 'update:collapsed', value: boolean): void
}>()

// 内部表单模型，保证双向同步
const form = computed({
  get: () => props.modelValue,
  set: val => emit('update:modelValue', val)
})

// 内部折叠状态持久化
const tableSettingsStore = useTableSettingsStore()

const resolveInitialCollapsed = (): boolean => {
  if (props.settingsKey) {
    const persisted = tableSettingsStore.getTableSettings(props.settingsKey)
    return persisted?.filterCollapsed ?? false
  }
  return props.collapsed
}

const collapsedState = ref(resolveInitialCollapsed())

watch(
  () => props.collapsed,
  val => {
    collapsedState.value = val
  }
)

watch(collapsedState, val => {
  if (props.settingsKey) {
    tableSettingsStore.setTableSettings(props.settingsKey, { filterCollapsed: val })
  }
})

/** 当前有效筛选条件摘要（用于折叠态展示） */
const activeFilterSummary = computed(() => {
  return props.fields
    .map(field => {
      const value = (props.modelValue as Record<string, unknown>)[field.prop]
      if (value == null || value === '') return null

      if (field.type === 'select') {
        const option = field.options?.find(o => String(o.value) === String(value))
        return option ? `${field.label}: ${option.label}` : null
      }

      if (field.type === 'daterange' && Array.isArray(value) && value.length === 2) {
        return `${field.label}: ${value[0]} ~ ${value[1]}`
      }

      return `${field.label}: ${String(value)}`
    })
    .filter(Boolean)
})

const toggleCollapsed = () => {
  collapsedState.value = !collapsedState.value
  emit('update:collapsed', collapsedState.value)
}

const onBeforeEnter = (el: Element) => {
  const htmlEl = el as HTMLElement
  htmlEl.style.height = '0'
  htmlEl.style.opacity = '0'
}

const onEnter = (el: Element, done: () => void) => {
  const htmlEl = el as HTMLElement
  const realHeight = htmlEl.scrollHeight

  // 元素高度为 0 时跳过动画
  if (realHeight === 0) {
    done()
    return
  }

  // 强制回流后设置目标高度
  void htmlEl.offsetHeight

  htmlEl.style.transition = 'height 0.3s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.25s ease'
  htmlEl.style.height = `${realHeight}px`
  htmlEl.style.opacity = '1'

  const onEnd = (e: TransitionEvent) => {
    if (e.target !== el) return
    htmlEl.removeEventListener('transitionend', onEnd)
    done()
  }

  htmlEl.addEventListener('transitionend', onEnd)
}

const onAfterEnter = (el: Element) => {
  const htmlEl = el as HTMLElement
  htmlEl.style.height = ''
  htmlEl.style.transition = ''
  htmlEl.style.opacity = ''
}

const onBeforeLeave = (el: Element) => {
  const htmlEl = el as HTMLElement
  htmlEl.style.height = `${htmlEl.scrollHeight}px`
  htmlEl.style.opacity = '1'

  void htmlEl.offsetHeight
}

const onLeave = (el: Element, done: () => void) => {
  const htmlEl = el as HTMLElement
  htmlEl.style.transition = 'height 0.25s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.2s ease'
  htmlEl.style.height = '0'
  htmlEl.style.opacity = '0'

  const onEnd = (e: TransitionEvent) => {
    if (e.target !== el) return
    htmlEl.removeEventListener('transitionend', onEnd)
    done()
  }

  htmlEl.addEventListener('transitionend', onEnd)
}

const onAfterLeave = (el: Element) => {
  const htmlEl = el as HTMLElement
  htmlEl.style.height = ''
  htmlEl.style.transition = ''
  htmlEl.style.opacity = ''
}

const updateField = (prop: string, value: unknown) => {
  emit('update:modelValue', { ...props.modelValue, [prop]: value })
}
// 查询
const submitSearch = () => emit('search')

// 重置
const resetFilters = () => {
  const cleared = { ...props.modelValue } as Record<string, unknown>
  props.fields.forEach(field => {
    cleared[field.prop] = field.type === 'daterange' ? [] : ''
  })
  emit('update:modelValue', cleared as T)
  emit('reset')
}
</script>

<template>
  <div class="pro-filter" :class="{ 'is-collapsible': collapsible }">
    <div
      v-if="collapsible"
      class="pro-filter__collapsed-bar"
      :class="{ 'is-visible': collapsedState }"
    >
      <span class="pro-filter__collapsed-label">筛选条件</span>
      <span v-if="activeFilterSummary.length" class="pro-filter__collapsed-summary">
        {{ activeFilterSummary.join('，') }}
      </span>
      <span v-else class="pro-filter__collapsed-empty">未设置筛选</span>
      <el-button size="small" text type="primary" @click="toggleCollapsed">
        <el-icon><i-ep-arrow-down /></el-icon>
        <span>展开</span>
      </el-button>
    </div>

    <Transition
      name="filter-collapse"
      @before-enter="onBeforeEnter"
      @enter="onEnter"
      @after-enter="onAfterEnter"
      @before-leave="onBeforeLeave"
      @leave="onLeave"
      @after-leave="onAfterLeave"
    >
      <div v-if="!collapsible || !collapsedState" class="pro-filter__form-wrapper">
        <form class="filter-form" @submit.prevent="submitSearch">
          <div class="filter-fields">
            <div v-for="field in fields" :key="field.prop" class="filter-item">
              <label class="filter-label">{{ field.label }}</label>

              <div class="filter-control">
                <!-- 输入框 -->
                <el-input
                  v-if="!field.type || field.type === 'input'"
                  :model-value="form[field.prop]"
                  :placeholder="field.placeholder || `请输入${field.label}`"
                  :clearable="field.clearable !== false"
                  @update:model-value="(val: unknown) => updateField(field.prop, val)"
                  @keyup.enter="submitSearch"
                />

                <!-- 下拉选择 -->
                <el-select
                  v-else-if="field.type === 'select'"
                  :model-value="form[field.prop]"
                  :placeholder="field.placeholder || `请选择${field.label}`"
                  :clearable="field.clearable !== false"
                  @update:model-value="(val: unknown) => updateField(field.prop, val)"
                >
                  <el-option
                    v-for="opt in field.options"
                    :key="opt.value"
                    :label="opt.label"
                    :value="opt.value"
                  />
                </el-select>

                <!-- 单个日期 -->
                <el-date-picker
                  v-else-if="field.type === 'date'"
                  :model-value="form[field.prop]"
                  type="date"
                  value-format="YYYY-MM-DD"
                  :placeholder="field.placeholder || `请选择${field.label}`"
                  :clearable="field.clearable !== false"
                  @update:model-value="(val: unknown) => updateField(field.prop, val)"
                />

                <!-- 日期范围 -->
                <el-date-picker
                  v-else-if="field.type === 'daterange'"
                  :model-value="form[field.prop]"
                  type="daterange"
                  value-format="YYYY-MM-DD"
                  range-separator="至"
                  start-placeholder="开始日期"
                  end-placeholder="结束日期"
                  :clearable="field.clearable !== false"
                  @update:model-value="(val: unknown) => updateField(field.prop, val)"
                />
              </div>
            </div>
          </div>

          <div class="filter-actions">
            <el-button color="var(--c-info)" native-type="submit" :loading="loading">
              <el-icon v-show="!loading"><i-ep-search /></el-icon>
              <span>查询</span>
            </el-button>
            <el-button type="info" plain @click="resetFilters">
              <el-icon><i-ep-refresh /></el-icon>
              <span>重置</span>
            </el-button>
            <el-button v-if="collapsible" size="small" text type="info" @click="toggleCollapsed">
              <el-icon><i-ep-arrow-up /></el-icon>
              <span>收起</span>
            </el-button>
          </div>
        </form>
      </div>
    </Transition>
  </div>
</template>

<style scoped lang="scss">
.pro-filter {
  padding: var(--card-padding-md);
  background-color: var(--bg-white);
  border: 1px solid var(--border-light);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);

  &__collapsed-bar {
    max-height: 0;
    opacity: 0;
    overflow: hidden;
    transition: max-height 0.5s ease-out;

    &.is-visible {
      display: flex;
      align-items: center;
      gap: var(--space-3);
      max-height: 13px;
      opacity: 1;
    }
  }

  &__collapsed-label {
    flex-shrink: 0;
    font-size: 13px;
    font-weight: 600;
    color: var(--t-primary);
  }

  &__collapsed-summary {
    flex: 1;
    min-width: 0;
    font-size: 13px;
    color: var(--t-secondary);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__collapsed-empty {
    flex: 1;
    min-width: 0;
    font-size: 13px;
    color: var(--t-placeholder);
  }

  // 表单包裹层（Transition 控制高度，此处只设 overflow）
  &__form-wrapper {
    overflow: hidden;
  }

  .filter-form {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--card-gap-lg);
    flex-wrap: wrap;
  }

  // 字段区域：自适应换行
  .filter-fields {
    display: flex;
    flex-wrap: wrap;
    gap: var(--card-gap-sm) var(--card-gap-lg);
    flex: 1;
    min-width: 0;
    align-items: center;
  }

  .filter-item {
    width: clamp(280px, 26vw, 360px);
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
    min-width: 0;

    .filter-label {
      font-size: 13px;
      font-weight: 600;
      color: var(--t-primary);
    }

    .filter-control {
      flex: 1;
      min-width: 0;
    }

    :deep(.el-input),
    :deep(.el-select),
    :deep(.el-date-editor),
    :deep(.el-date-editor.el-range-editor) {
      width: 100%;
      max-width: 100%;
      box-sizing: border-box;
    }
  }

  // 操作按钮区域
  .filter-actions {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    flex-shrink: 0;
    align-self: center;
  }

  @include respond-to(mobile) {
    .filter-form,
    .filter-fields {
      flex-direction: column;
      align-items: stretch;
    }

    .filter-item {
      width: 100%;
      gap: var(--space-2);
    }

    .filter-actions {
      width: 100%;
      justify-content: stretch;

      :deep(.el-button) {
        flex: 1;
      }
    }
  }
}
</style>
