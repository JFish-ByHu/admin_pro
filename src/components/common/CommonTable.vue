<script setup lang="ts">
import {
  computed,
  defineComponent,
  nextTick,
  onMounted,
  onBeforeUnmount,
  onUpdated,
  ref,
  watch,
  type PropType,
  type VNodeChild
} from 'vue'
import type { TableInstance } from 'element-plus'
import Sortable, { type SortableEvent } from 'sortablejs'
import CommonTableSetting, { type CommonTableSettingColumnOption } from './CommonTableSetting.vue'

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

export interface CommonTableRowReorderPayload {
  oldIndex: number
  newIndex: number
  movedRow: Record<string, unknown>
  currentPageData: Record<string, unknown>[]
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
    /** 是否开启当前页行拖拽排序 */
    rowSortable?: boolean
    /** 是否显示表格设置按钮 */
    showSettings?: boolean
    /** 是否允许在设置中切换拖拽排序 */
    configurableRowSortable?: boolean
    /** 是否允许在设置中控制列显隐 */
    configurableColumns?: boolean
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
    rowSortable: false,
    showSettings: false,
    configurableRowSortable: false,
    configurableColumns: false,
    selectedRowKeys: () => [],
    selectionWidth: 56
  }
)

const emit = defineEmits<{
  (e: 'update:page', page: number): void
  (e: 'update:pageSize', size: number): void
  (e: 'update:selectedRowKeys', keys: Array<string | number>): void
  (e: 'update:rowSortable', value: boolean): void
  (e: 'page-change'): void
  (e: 'selection-change', keys: Array<string | number>): void
  (e: 'row-reorder', payload: CommonTableRowReorderPayload): void
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
const tableRootRef = ref<HTMLDivElement | null>(null)
const rowSortableInstance = ref<Sortable | null>(null)
const isRowSorting = ref(false)
const settingsDrawerVisible = ref(false)
const tableRowSortableEnabled = ref(props.rowSortable)
const visibleColumnKeys = ref<string[]>([])

const ROW_SORTABLE_FILTER =
  '.el-button, .el-checkbox, .el-input, .el-input__inner, .el-select, .el-switch, a, button, input, textarea, [contenteditable="true"]'

const waitForNextFrame = () => new Promise<void>(resolve => requestAnimationFrame(() => resolve()))

const normalizedColumns = computed<NormalizedColumn[]>(() => {
  return props.columns.map(column => ({
    ...column,
    prop: column.prop ?? column.dataKey ?? '',
    label: column.label ?? column.title ?? ''
  }))
})

const settingColumnOptions = computed<CommonTableSettingColumnOption[]>(() => {
  return normalizedColumns.value.map(column => ({
    key: column.key,
    label: column.label || column.prop || column.key
  }))
})

const displayColumns = computed(() => {
  const visibleKeySet = new Set(visibleColumnKeys.value)

  return normalizedColumns.value.filter(column => visibleKeySet.has(column.key))
})

const showTableSettings = computed(() => {
  return props.showSettings && (props.configurableRowSortable || props.configurableColumns)
})

watch(
  () => props.rowSortable,
  value => {
    tableRowSortableEnabled.value = value
  },
  {
    immediate: true
  }
)

watch(
  () => normalizedColumns.value.map(column => column.key),
  (nextKeys, previousKeys = []) => {
    if (!visibleColumnKeys.value.length) {
      visibleColumnKeys.value = [...nextKeys]
      return
    }

    const previousKeySet = new Set(previousKeys)
    const currentVisibleKeySet = new Set(visibleColumnKeys.value)

    visibleColumnKeys.value = nextKeys.filter(key => {
      return currentVisibleKeySet.has(key) || !previousKeySet.has(key)
    })
  },
  {
    immediate: true
  }
)

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

const buildReorderedCurrentPageData = (oldIndex: number, newIndex: number) => {
  const currentPageData = [...props.data]
  const movedRow = currentPageData[oldIndex]

  if (!movedRow) {
    return null
  }

  currentPageData.splice(oldIndex, 1)
  currentPageData.splice(newIndex, 0, movedRow)

  return {
    movedRow,
    currentPageData
  }
}

const emitRowReorder = (event: SortableEvent) => {
  const { oldIndex, newIndex } = event

  if (oldIndex == null || newIndex == null || oldIndex === newIndex) {
    return
  }

  const reorderedResult = buildReorderedCurrentPageData(oldIndex, newIndex)

  if (!reorderedResult) {
    return
  }

  emit('row-reorder', {
    oldIndex,
    newIndex,
    movedRow: reorderedResult.movedRow,
    currentPageData: reorderedResult.currentPageData
  })
}

const startRowSorting = () => {
  isRowSorting.value = true
}

const finishRowSorting = (event: SortableEvent) => {
  isRowSorting.value = false
  emitRowReorder(event)
}

const updateTableRowSortable = (value: boolean) => {
  tableRowSortableEnabled.value = value
  emit('update:rowSortable', value)
}

const updateVisibleColumnKeys = (nextKeys: string[]) => {
  const validKeySet = new Set(normalizedColumns.value.map(column => column.key))

  visibleColumnKeys.value = normalizedColumns.value
    .map(column => column.key)
    .filter(key => validKeySet.has(key) && nextKeys.includes(key))
}

const destroyRowSortable = () => {
  rowSortableInstance.value?.destroy()
  rowSortableInstance.value = null
}

const resolveTableBody = async () => {
  for (let attempt = 0; attempt < 6; attempt += 1) {
    const tableBody = tableRootRef.value?.querySelector('.el-table__body-wrapper tbody')

    if (tableBody) {
      return tableBody as HTMLElement
    }

    await nextTick()
    await waitForNextFrame()
  }

  return null
}

const initRowSortable = async () => {
  if (isRowSorting.value) {
    return
  }

  destroyRowSortable()

  if (!tableRowSortableEnabled.value || !tableRootRef.value || !props.data.length) {
    return
  }

  await nextTick()
  await waitForNextFrame()

  const tableBody = await resolveTableBody()

  if (!tableBody) {
    return
  }

  rowSortableInstance.value = Sortable.create(tableBody as HTMLElement, {
    animation: 180,
    draggable: '.el-table__row',
    handle: '.common-table__drag-handle',
    forceFallback: true,
    fallbackOnBody: true,
    fallbackTolerance: 4,
    ghostClass: 'is-row-sortable-ghost',
    chosenClass: 'is-row-sortable-chosen',
    dragClass: 'is-row-sortable-drag',
    fallbackClass: 'is-row-sortable-fallback',
    filter: ROW_SORTABLE_FILTER,
    preventOnFilter: false,
    onStart: startRowSorting,
    onEnd: finishRowSorting
  })
}

const syncSelectionRows = (rows: Record<string, unknown>[]) => {
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

const changePage = (page: number) => {
  emit('update:page', page)
  emit('page-change')
}

const changePageSize = (size: number) => {
  emit('update:pageSize', size)
  emit('page-change')
}

onBeforeUnmount(() => {
  destroyRowSortable()
})

onMounted(() => {
  void initRowSortable()
})

onUpdated(() => {
  void initRowSortable()
})
</script>

<template>
  <div
    ref="tableRootRef"
    class="common-table"
    :class="{ 'is-row-sortable': tableRowSortableEnabled, 'is-row-sorting': isRowSorting }"
  >
    <div v-if="$slots.header || showTableSettings" class="common-table__header">
      <div class="common-table__header-inner">
        <CommonTableSetting
          v-if="showTableSettings"
          v-model="settingsDrawerVisible"
          :row-sortable-enabled="tableRowSortableEnabled"
          :show-row-sortable-switch="configurableRowSortable"
          :column-options="configurableColumns ? settingColumnOptions : []"
          :visible-column-keys="visibleColumnKeys"
          @update:row-sortable-enabled="updateTableRowSortable"
          @update:visible-column-keys="updateVisibleColumnKeys"
        />

        <div v-if="$slots.header" class="common-table__header-content">
          <slot name="header" />
        </div>
      </div>
    </div>

    <div v-loading="loading" class="common-table__main">
      <el-table
        ref="tableRef"
        :data="data"
        :row-key="rowKey"
        height="100%"
        style="width: 100%"
        @selection-change="syncSelectionRows"
      >
        <el-table-column v-if="tableRowSortableEnabled" width="44" align="center" fixed="left">
          <template #header>
            <el-tooltip content="拖拽排序手柄列" placement="top">
              <span class="common-table__drag-header" title="拖拽排序列" aria-label="拖拽排序列" />
            </el-tooltip>
          </template>

          <template #default>
            <el-tooltip content="拖拽排序" placement="top">
              <span class="common-table__drag-handle" title="拖拽排序" aria-label="拖拽排序" />
            </el-tooltip>
          </template>
        </el-table-column>

        <el-table-column
          v-if="selectable"
          type="selection"
          :width="selectionWidth"
          fixed="left"
          align="center"
          reserve-selection
        />

        <el-table-column
          v-for="column in displayColumns"
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
        size="small"
        layout="total, sizes, prev, pager, next, jumper"
        background
        @current-change="changePage"
        @size-change="changePageSize"
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
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);

  &__main {
    position: relative;
    flex: 1;
    min-height: 0;
  }

  &__header {
    padding: 0 var(--layout-padding);
    border-bottom: 1px solid var(--border-light);
    background-color: var(--bg-white);
  }

  &__header-inner {
    display: flex;
    align-items: center;
    gap: 10px;
    min-width: 0;
  }

  &__header-content {
    flex: 1;
    min-width: 0;
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
    padding: clamp(10px, 1.2vw, 10px) var(--layout-padding);
    border-top: 1px solid var(--border-light);

    @include respond-to(mobile) {
      justify-content: center;
    }
  }

  &__drag-handle {
    display: inline-flex;
    width: 18px;
    height: 18px;
    border-radius: 6px;
    cursor: grab;
    opacity: 0.78;
    transition:
      background-color 0.2s ease,
      opacity 0.2s ease,
      transform 0.2s ease;
    background-image:
      radial-gradient(circle, currentColor 1.2px, transparent 1.3px),
      radial-gradient(circle, currentColor 1.2px, transparent 1.3px);
    background-position:
      4px 3px,
      10px 3px;
    background-repeat: repeat-y;
    background-size: 6px 6px;
    color: var(--t-secondary);
  }

  &__drag-header {
    display: inline-flex;
    width: 14px;
    height: 14px;
    opacity: 0.42;
    background-image:
      radial-gradient(circle, currentColor 1px, transparent 1.1px),
      radial-gradient(circle, currentColor 1px, transparent 1.1px);
    background-position:
      3px 2px,
      8px 2px;
    background-repeat: repeat-y;
    background-size: 5px 5px;
    color: var(--t-secondary);
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

  &.is-row-sortable {
    :deep(.el-table__row:hover .common-table__drag-handle) {
      opacity: 1;
      background-color: var(--bg-hover);
      color: var(--t-primary);
    }

    :deep(.el-table__row .common-table__drag-handle:active) {
      cursor: grabbing;
      transform: scale(0.96);
    }

    :deep(.is-row-sortable-ghost td) {
      background-color: var(--bg-hover);
      opacity: 0.5;
    }

    :deep(.is-row-sortable-chosen td) {
      background-color: var(--c-primary-bg);
    }

    :deep(.is-row-sortable-drag td),
    :deep(.is-row-sortable-fallback td) {
      background-color: var(--bg-white);
      box-shadow: var(--shadow-sm);
    }
  }

  &.is-row-sorting {
    :deep(.el-table__body tr:hover > td.el-table__cell),
    :deep(.el-table__body tr.hover-row > td.el-table__cell) {
      background-color: var(--bg-white) !important;
    }

    :deep(.common-table__drag-handle) {
      cursor: grabbing;
    }
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
