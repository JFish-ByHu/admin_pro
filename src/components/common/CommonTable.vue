<script setup lang="ts">
import {
  computed,
  defineComponent,
  nextTick,
  ref,
  watch,
  type PropType,
  type VNodeChild
} from 'vue'
import type { TableInstance } from 'element-plus'

/**
 * 分页配置
 */
export interface TablePagination {
  page: number
  pageSize: number
  total: number
}

export interface CommonTableColumn {
  key: string
  prop?: string
  dataKey?: string
  label?: string
  title?: string
  width?: number | string
  minWidth?: number | string
  fixed?: true | 'left' | 'right'
  align?: 'left' | 'center' | 'right'
  showOverflowTooltip?: boolean
  formatter?: (row: Record<string, unknown>, column: CommonTableColumn, rowIndex: number) => unknown
  cellRenderer?: (scope: CommonTableCellScope) => VNodeChild
  headerCellRenderer?: (scope: CommonTableHeaderScope) => VNodeChild
}

export interface CommonTableCellScope {
  rowData: Record<string, unknown>
  rowIndex: number
  column: CommonTableColumn
}

export interface CommonTableHeaderScope {
  column: CommonTableColumn
}

interface NormalizedColumn extends CommonTableColumn {
  prop: string
  label: string
}

const props = withDefaults(
  defineProps<{
    /** 表格列配置 */
    columns: CommonTableColumn[]
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

const RenderVNode = defineComponent({
  name: 'RenderVNode',
  props: {
    render: {
      type: Function as PropType<() => VNodeChild>,
      required: true
    }
  },
  setup(renderProps) {
    return () => renderProps.render()
  }
})

const tableRef = ref<TableInstance>()
const isSyncingSelection = ref(false)

const normalizedColumns = computed<NormalizedColumn[]>(() => {
  return props.columns.map(column => ({
    ...column,
    prop: column.prop ?? column.dataKey ?? '',
    label: column.label ?? column.title ?? ''
  }))
})

const getRowKey = (row: Record<string, unknown>) => {
  return row[props.rowKey] as string | number
}

const syncSelectionState = async () => {
  if (!props.selectable || !tableRef.value) {
    return
  }

  isSyncingSelection.value = true
  tableRef.value.clearSelection()

  const selectedKeySet = new Set(props.selectedRowKeys)
  props.data.forEach(row => {
    if (selectedKeySet.has(getRowKey(row))) {
      tableRef.value?.toggleRowSelection(row, true)
    }
  })

  await nextTick()
  isSyncingSelection.value = false
}

watch(
  [() => props.data, () => props.selectedRowKeys, () => props.selectable],
  () => {
    void syncSelectionState()
  },
  {
    immediate: true,
    flush: 'post'
  }
)

const updateSelectedRowKeys = (keys: Array<string | number>) => {
  emit('update:selectedRowKeys', keys)
  emit('selection-change', keys)
}

const handleSelectionChange = (rows: Record<string, unknown>[]) => {
  if (isSyncingSelection.value) {
    return
  }

  updateSelectedRowKeys(rows.map(getRowKey))
}

const formatCellValue = (
  column: NormalizedColumn,
  row: Record<string, unknown>,
  rowIndex: number
) => {
  if (column.formatter) {
    return column.formatter(row, column, rowIndex)
  }

  if (!column.prop) {
    return ''
  }

  return row[column.prop] ?? ''
}

const handleCurrentChange = (page: number) => {
  emit('update:page', page)
  emit('page-change')
}

const handleSizeChange = (size: number) => {
  emit('update:pageSize', size)
  emit('page-change')
}
</script>

<template>
  <div class="common-table">
    <div v-loading="loading" class="common-table__main">
      <el-table
        ref="tableRef"
        :data="data"
        :row-key="rowKey"
        height="100%"
        style="width: 100%"
        @selection-change="handleSelectionChange"
      >
        <el-table-column
          v-if="selectable"
          type="selection"
          :width="selectionWidth"
          align="center"
          reserve-selection
        />

        <el-table-column
          v-for="column in normalizedColumns"
          :key="column.key"
          :prop="column.prop"
          :label="column.label"
          :width="column.width"
          :min-width="column.minWidth"
          :fixed="column.fixed"
          :align="column.align"
          :show-overflow-tooltip="column.showOverflowTooltip"
        >
          <template v-if="column.headerCellRenderer" #header>
            <RenderVNode :render="() => column.headerCellRenderer?.({ column })" />
          </template>

          <template #default="scope">
            <RenderVNode
              v-if="column.cellRenderer"
              :render="
                () =>
                  column.cellRenderer?.({
                    rowData: scope.row,
                    rowIndex: scope.$index,
                    column
                  })
              "
            />
            <span v-else>{{ formatCellValue(column, scope.row, scope.$index) }}</span>
          </template>
        </el-table-column>

        <template #empty>
          <div class="common-table__empty">
            <el-empty description="暂无数据" :image-size="120" />
          </div>
        </template>
      </el-table>
    </div>

    <div v-if="pagination" class="common-table__footer">
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
.common-table {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
  background-color: var(--bg-white);
  border: 1px solid var(--border-light);
  border-radius: 12px;
  box-shadow: var(--shadow-sm);

  &__main {
    position: relative;
    flex: 1;
    min-height: 0;
  }

  &__empty {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    padding: 32px 0;
  }

  &__footer {
    display: flex;
    justify-content: flex-end;
    padding: clamp(10px, 1.2vw, 16px) var(--layout-padding);
    border-top: 1px solid var(--border-light);

    @include respond-to(mobile) {
      justify-content: center;
    }
  }

  :deep(.el-table) {
    --el-table-border-color: var(--border-light);
    --el-table-header-bg-color: var(--bg-page);
    --el-table-tr-bg-color: var(--bg-white);
    --el-table-row-hover-bg-color: var(--bg-hover);
    --el-table-header-text-color: var(--t-primary);
    --el-table-text-color: var(--t-regular);
    --el-table-bg-color: var(--bg-white);
  }

  :deep(.el-table__inner-wrapper::before) {
    display: none;
  }

  :deep(.el-table th.el-table__cell) {
    background-color: var(--bg-page);
    font-weight: 600;
    color: var(--t-primary);
  }

  :deep(.el-table td.el-table__cell) {
    color: var(--t-regular);
    border-bottom-color: var(--border-light);
  }

  :deep(.el-table .cell) {
    font-size: var(--font-size-base);
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
