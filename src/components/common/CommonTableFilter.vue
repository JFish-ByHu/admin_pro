<script setup lang="ts" generic="T extends Record<string, any>">
import { computed } from 'vue'

/**
 * 筛选字段配置
 */
export interface tableFilterField {
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
    fields: tableFilterField[]
    /** 双向绑定的筛选条件对象 */
    modelValue: T
    /** 查询按钮加载状态 */
    loading?: boolean
  }>(),
  {
    loading: false
  }
)

const emit = defineEmits<{
  (e: 'update:modelValue', value: T): void
  (e: 'search'): void
  (e: 'reset'): void
}>()

// 内部表单模型，保证双向同步
const form = computed({
  get: () => props.modelValue,
  set: val => emit('update:modelValue', val)
})

// 更新单个字段
const updateField = (prop: string, value: unknown) => {
  emit('update:modelValue', { ...props.modelValue, [prop]: value })
}
// 查询
const submitSearch = () => emit('search')

// 重置：清空所有字段后再触发查询
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
  <div class="pro-filter">
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
      </div>
    </form>
  </div>
</template>

<style scoped lang="scss">
.pro-filter {
  padding: var(--layout-padding);
  background-color: var(--bg-white);
  border: 1px solid var(--border-light);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);

  .filter-form {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--layout-gap);
    flex-wrap: wrap;
  }

  // 字段区域：自适应换行
  .filter-fields {
    display: flex;
    flex-wrap: wrap;
    gap: clamp(8px, 1vw, 16px) var(--layout-gap);
    flex: 1;
    min-width: 0;
    align-items: center;
  }

  .filter-item {
    width: clamp(280px, 26vw, 360px);
    display: flex;
    align-items: center;
    gap: 12px;
    min-width: 0;

    .filter-label {
      flex-shrink: 0;
      font-size: 13px;
      font-weight: 600;
      color: var(--t-primary);
      text-align: left;
    }

    .filter-control {
      flex: 1;
      min-width: 0;
    }

    :deep(.el-select),
    :deep(.el-date-editor),
    :deep(.el-input) {
      width: 100%;
    }
  }

  // 操作按钮区域
  .filter-actions {
    display: flex;
    align-items: center;
    gap: 12px;
    flex-shrink: 0;
    align-self: center;

    :deep(.el-button) {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 4px;
    }
  }

  @include respond-to(mobile) {
    .filter-form,
    .filter-fields {
      flex-direction: column;
      align-items: stretch;
    }

    .filter-item {
      width: 100%;
      align-items: stretch;
      flex-direction: column;
      gap: 8px;

      .filter-label {
        width: auto;
      }
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
