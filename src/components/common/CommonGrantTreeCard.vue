<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { TreeInstance, TreeNodeData } from 'element-plus'

const props = withDefaults(
  defineProps<{
    treeData: unknown[]
    checkedKeys: string[]
    subjectName: string
    saving?: boolean
    title?: string
    summaryUnitText?: string
    grantPermissionCode?: string
    nodeKey?: string
  }>(),
  {
    saving: false,
    title: '资源树',
    summaryUnitText: '项',
    grantPermissionCode: '',
    nodeKey: 'id'
  }
)

const emit = defineEmits<{
  (e: 'update:checkedKeys', value: string[]): void
  (e: 'check-all'): void
  (e: 'clear-all'): void
  (e: 'reset'): void
  (e: 'save'): void
}>()

const treeRef = ref<TreeInstance>()

/** 递归标记虚拟分组节点为 disabled（不可勾选） */
const markVirtualGroupDisabled = (nodes: unknown[]): unknown[] => {
  return nodes.map((node: unknown) => {
    const n = node as Record<string, unknown>
    const isVirtual = typeof n.id === 'string' && n.id.startsWith('__group__')
    const children = Array.isArray(n.children) ? markVirtualGroupDisabled(n.children) : n.children

    return {
      ...n,
      disabled: isVirtual ? true : undefined,
      children
    }
  })
}

const treeDataForElTree = computed(
  () => markVirtualGroupDisabled(props.treeData) as unknown as TreeNodeData[]
)

const checkedCount = computed(() => props.checkedKeys.length)

const applyCheckedKeys = (nextKeys: string[]) => {
  treeRef.value?.setCheckedKeys(nextKeys)
}

const syncCheckedKeysFromTree = () => {
  const strictCheckedKeys = (treeRef.value?.getCheckedKeys() || []) as string[]
  emit('update:checkedKeys', strictCheckedKeys)
}

watch(
  () => props.checkedKeys,
  nextKeys => {
    applyCheckedKeys(nextKeys)
  },
  {
    immediate: true
  }
)
</script>

<template>
  <div class="grant-tree-card">
    <div class="grant-tree-card__header">
      <div class="grant-tree-card__title-wrap">
        <span class="grant-tree-card__title">{{ title }}</span>
        <span class="grant-tree-card__meta">当前对象：{{ subjectName || '未选择' }}</span>
      </div>

      <div class="grant-tree-card__actions">
        <el-button type="info" plain size="small" @click="emit('check-all')">全选</el-button>
        <el-button type="info" plain size="small" @click="emit('clear-all')">清空</el-button>
        <el-button type="info" plain size="small" @click="emit('reset')">重置</el-button>
        <el-button
          v-permission="grantPermissionCode"
          color="var(--c-info)"
          size="small"
          :loading="saving"
          @click="emit('save')"
        >
          保存授权
        </el-button>
      </div>
    </div>

    <div class="grant-tree-card__summary">
      <span>已勾选 {{ checkedCount }} {{ summaryUnitText }}</span>
    </div>

    <el-scrollbar class="grant-tree-card__scrollbar">
      <el-tree
        ref="treeRef"
        :data="treeDataForElTree"
        :node-key="nodeKey"
        show-checkbox
        default-expand-all
        :expand-on-click-node="false"
        @check="syncCheckedKeysFromTree"
      >
        <template #default="{ data }">
          <slot name="node" :data="data">
            <span class="grant-tree-card__default-node">{{ data.name || '-' }}</span>
          </slot>
        </template>
      </el-tree>
    </el-scrollbar>
  </div>
</template>

<style scoped lang="scss">
.grant-tree-card {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  height: 100%;
  min-height: 0;
  padding: var(--card-padding-sm);
  border: 1px solid var(--border-light);
  border-radius: var(--radius-lg);
  background-color: var(--bg-white);

  &__header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: var(--space-3);
    flex-wrap: wrap;
  }

  &__title-wrap {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  &__title {
    color: var(--t-primary);
    font-size: var(--font-size-base);
    font-weight: 600;
  }

  &__meta,
  &__summary {
    color: var(--t-secondary);
    font-size: 12px;
  }

  &__actions {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    flex-wrap: wrap;
  }

  &__scrollbar {
    flex: 1;
    min-height: 0;
    border: 1px solid var(--border-light);
    border-radius: var(--radius-md);
    padding: var(--space-2);
    background-color: var(--bg-page);
  }

  &__default-node {
    color: var(--t-primary);
    font-size: 13px;
  }

  :deep(.el-tree) {
    background-color: transparent;
  }

  :deep(.el-tree-node__content) {
    height: auto;
    min-height: 26px;
    align-items: flex-start;
    padding-top: 2px;
    padding-bottom: 2px;
  }
}
</style>
