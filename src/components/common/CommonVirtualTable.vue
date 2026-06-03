<script setup lang="ts">
import { computed, h } from 'vue'
import { ElCheckbox, type Column } from 'element-plus'

/**
 * 分页配置
 */
export interface TablePagination {
  page: number
  pageSize: number
  total: number
}

const props = withDefaults(
  defineProps<{
    /** Table V2 列配置 */
    columns: Column[]
    /** 表格数据 */
    data: Record<string, unknown>[]
    /** 加载状态 */
    loading?: boolean
    /** 行唯一标识字段，默认 id */
    rowKey?: string
    /** 分页配置，传入则显示分页器 */
    pagination?: TablePagination
    /** 可选页大小，默认 [10, 20, 50, 100] */
    pageSizes?: number[]
    /** 是否开启选择列 */
    selectable?: boolean
    /** 已选中的行 key 列表 */
    selectedRowKeys?: Array<string | number>
    /** 选择列宽度 */
    selectionWidth?: number
  }>(),
  {
    loading: false,
    rowKey: 'id',
    pagination: undefined,
    pageSizes: () => [10, 20, 50, 100],
    selectable: false,
    selectedRowKeys: () => [],
    selectionWidth: 56
  }
)

const emit = defineEmits<{
  (e: 'update:page', page: number): void
  (e: 'update:pageSize', size: number): void
  (e: 'update:selectedRowKeys', keys: Array<string | number>): void
  (e: 'page-change'): void
  (e: 'selection-change', keys: Array<string | number>): void
}>()

// 获取行唯一 key
const getRowKey = (row: Record<string, unknown>) => {
  return row[props.rowKey] as string | number
}

// 当前页数据对应的 key 列表
const currentPageRowKeys = computed(() => props.data.map(getRowKey))

// 已选中 key 集合
const selectedKeySet = computed(() => new Set(props.selectedRowKeys))

// 当前页是否全选
const isAllSelected = computed(() => {
  if (!currentPageRowKeys.value.length) {
    return false
  }
  return currentPageRowKeys.value.every(key => selectedKeySet.value.has(key))
})

// 当前页是否半选
const isIndeterminate = computed(() => {
  if (!currentPageRowKeys.value.length) {
    return false
  }
  const selectedCount = currentPageRowKeys.value.filter(key => selectedKeySet.value.has(key)).length
  return selectedCount > 0 && selectedCount < currentPageRowKeys.value.length
})

// 更新选中状态
const updateSelectedRowKeys = (keys: Array<string | number>) => {
  emit('update:selectedRowKeys', keys)
  emit('selection-change', keys)
}

// 切换单行勾选
const toggleRowSelection = (row: Record<string, unknown>, checked: boolean | string | number) => {
  const rowKey = getRowKey(row)
  const nextKeys = new Set(props.selectedRowKeys)

  if (checked) {
    nextKeys.add(rowKey)
  } else {
    nextKeys.delete(rowKey)
  }

  updateSelectedRowKeys([...nextKeys])
}

// 切换当前页全选
const toggleAllSelection = (checked: boolean | string | number) => {
  const nextKeys = new Set(props.selectedRowKeys)

  if (checked) {
    currentPageRowKeys.value.forEach(key => nextKeys.add(key))
  } else {
    currentPageRowKeys.value.forEach(key => nextKeys.delete(key))
  }

  updateSelectedRowKeys([...nextKeys])
}

// 注入选择列后的最终列配置
const mergedColumns = computed<Column[]>(() => {
  if (!props.selectable) {
    return props.columns
  }

  const selectionColumn: Column = {
    key: '__selection__',
    title: '',
    dataKey: '__selection__',
    width: props.selectionWidth,
    align: 'center',
    fixed: true,
    headerCellRenderer: () =>
      h(ElCheckbox, {
        modelValue: isAllSelected.value,
        indeterminate: isIndeterminate.value,
        onChange: toggleAllSelection
      }),
    cellRenderer: ({ rowData }) =>
      h(ElCheckbox, {
        modelValue: selectedKeySet.value.has(getRowKey(rowData as Record<string, unknown>)),
        onChange: (checked: boolean | string | number) =>
          toggleRowSelection(rowData as Record<string, unknown>, checked)
      })
  }

  return [selectionColumn, ...props.columns]
})

// 切换页码
const handleCurrentChange = (page: number) => {
  emit('update:page', page)
  emit('page-change')
}

// 切换每页条数
const handleSizeChange = (size: number) => {
  emit('update:pageSize', size)
  emit('page-change')
}
</script>

<template>
  <div class="pro-table">
    <div v-loading="loading" class="pro-table__main">
      <el-auto-resizer>
        <template #default="{ height, width }">
          <el-table-v2
            :columns="mergedColumns"
            :data="data"
            :width="width"
            :height="height"
            :row-key="rowKey"
            :header-height="52"
            :row-height="56"
            fixed
          >
            <!-- 空数据展示 -->
            <template #empty>
              <div class="pro-table__empty">
                <el-empty description="暂无数据" :image-size="120" />
              </div>
            </template>
          </el-table-v2>
        </template>
      </el-auto-resizer>
    </div>

    <!-- 分页器 -->
    <div v-if="pagination" class="pro-table__footer">
      <el-pagination
        :current-page="pagination.page"
        :page-size="pagination.pageSize"
        :total="pagination.total"
        :page-sizes="pageSizes"
        layout="total, sizes, prev, pager, next, jumper"
        background
        @current-change="handleCurrentChange"
        @size-change="handleSizeChange"
      />
    </div>
  </div>
</template>

<style scoped lang="scss">
.pro-table {
  display: flex;
  flex-direction: column;
  min-height: 0;
  flex: 1;
  background-color: var(--bg-white);
  border: 1px solid var(--border-light);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  overflow: hidden;

  &__main {
    flex: 1;
    min-height: 0;
    position: relative;
  }

  &__empty {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    padding: 32px 0;
  }

  // 分页区域
  &__footer {
    display: flex;
    justify-content: flex-end;
    padding: clamp(10px, 1.2vw, 16px) var(--layout-padding);
    border-top: 1px solid var(--border-light);

    @include respond-to(mobile) {
      justify-content: center;
    }
  }

  // 主题适配 Table V2
  :deep(.el-table-v2__header-row) {
    background-color: var(--bg-page);
    font-weight: 600;
    color: var(--t-primary);
  }

  :deep(.el-table-v2__header-cell) {
    background-color: var(--bg-page);
  }

  :deep(.el-table-v2__row) {
    color: var(--t-regular);
    border-bottom: 1px solid var(--border-light);
    transition: background-color 0.2s;

    &:hover {
      background-color: var(--bg-hover);
    }
  }

  :deep(.el-table-v2__cell-text) {
    font-size: var(--font-size-base);
  }

  :deep(.el-table-v2__header-cell),
  :deep(.el-table-v2__cell) {
    display: flex;
    align-items: center;
  }

  :deep(.el-checkbox) {
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }

  :deep(.el-pager li.is-active) {
    background-color: var(--c-info) !important;
    color: #fff !important;
  }
}
</style>
