<script setup lang="ts">
import { computed } from 'vue'
import type { OperationLogItem } from '@/types/log'

const props = withDefaults(
  defineProps<{
    visible?: boolean
    log?: OperationLogItem | null
  }>(),
  {
    visible: false,
    log: null
  }
)

const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void
}>()

const drawerVisible = computed({
  get: () => props.visible,
  set: value => emit('update:visible', value)
})

const detailFields = computed(() => {
  if (!props.log) return []

  const log = props.log

  return [
    { label: '日志 ID', value: log.id },
    {
      label: '操作人',
      value: log.nickname ? `${log.nickname}（${log.username}）` : log.username || '-'
    },
    { label: '操作模块', value: log.module },
    { label: '操作类型', value: log.action },
    { label: '操作对象', value: log.target || '-' },
    { label: '请求方法', value: log.httpMethod },
    { label: '请求路径', value: log.url },
    { label: '请求耗时', value: `${log.duration}ms` },
    { label: '操作结果', value: log.result === 'success' ? '成功' : '失败' },
    { label: '来源 IP', value: log.ip || '-' },
    { label: 'User-Agent', value: log.userAgent || '-' },
    { label: '操作时间', value: log.createTime },
    { label: '请求参数', value: log.detail || '-' },
    { label: '错误信息', value: log.errorMessage || '-' }
  ]
})
</script>

<template>
  <el-drawer v-model="drawerVisible" title="日志详情" :size="560" destroy-on-close>
    <div v-if="log" class="log-detail">
      <div v-for="field in detailFields" :key="field.label" class="log-detail__row">
        <span class="log-detail__label">{{ field.label }}</span>
        <span
          class="log-detail__value"
          :class="{
            'log-detail__value--code': field.label === '请求参数' || field.label === 'User-Agent'
          }"
          >{{ field.value }}</span
        >
      </div>
    </div>
    <el-empty v-else description="暂无数据" />
  </el-drawer>
</template>

<style scoped lang="scss">
.log-detail {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);

  &__row {
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
    padding: var(--space-2) 0;
    border-bottom: 1px solid var(--border-light);

    &:last-child {
      border-bottom: none;
    }
  }

  &__label {
    color: var(--t-secondary);
    font-size: calc(var(--font-size-base) * 0.9);
    font-weight: 500;
  }

  &__value {
    color: var(--t-primary);
    font-size: var(--font-size-base);
    word-break: break-all;

    &--code {
      padding: var(--space-2);
      background: var(--bg-page-light);
      border-radius: var(--radius-sm);
      font-family: 'Consolas', 'Monaco', monospace;
      font-size: calc(var(--font-size-base) * 0.85);
      line-height: 1.6;
      white-space: pre-wrap;
      max-height: 260px;
      overflow-y: auto;
    }
  }
}
</style>
