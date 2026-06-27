<script setup lang="ts">
import { computed, h, onMounted, ref, watch } from 'vue'
import { Refresh } from '@element-plus/icons-vue'
import { ElTag } from 'element-plus'
import CommonTable, { type CommonTableColumn } from '@/components/common/CommonTable.vue'
import CommonTableFilter from '@/components/common/CommonTableFilter.vue'
import CommonTableToolbar, {
  type CommonTableToolbarAction
} from '@/components/common/CommonTableToolbar.vue'
import { LOG_PERMISSION_CODES } from '@/constants/permission'
import { useUserStore } from '@/stores/user'
import { useContentRefresh } from '@/composables/useContentRefresh'
import { useLogList } from './composables/useLogList'
import { LogActionCell, LogDetailDrawer } from './CompsExport'
import type { OperationLogItem } from '@/types/log'

/** 当前激活的 Tab */
const activeTab = defineModel<'operation' | 'error'>('activeTab', {
  default: 'operation'
})

const userStore = useUserStore()

const hasLogListPermission = computed(() =>
  userStore.permissions.includes(LOG_PERMISSION_CODES.LIST)
)
const hasLogDetailPermission = computed(() =>
  userStore.permissions.includes(LOG_PERMISSION_CODES.DETAIL)
)

const isErrorTab = computed(() => activeTab.value === 'error')

const {
  loading,
  query,
  filterFields,
  pagination,
  tableData,
  getLogs,
  searchLogs,
  resetLogFilters,
  refreshLogs
} = useLogList(isErrorTab)

/** 详情抽屉状态 */
const detailVisible = ref(false)
const detailLog = ref<OperationLogItem | null>(null)

/** 模块 Tag 颜色映射 */
const moduleTagConfigMap: Record<
  string,
  { type: 'primary' | 'success' | 'warning' | 'danger' | 'info' }
> = {
  用户管理: { type: 'primary' },
  角色管理: { type: 'success' },
  菜单管理: { type: 'warning' },
  权限管理: { type: 'danger' },
  认证: { type: 'info' },
  异常: { type: 'danger' }
}

/** 操作 Tag 颜色映射 */
const actionTagConfigMap: Record<
  string,
  { type: 'primary' | 'success' | 'warning' | 'danger' | 'info' }
> = {
  新增: { type: 'success' },
  修改: { type: 'warning' },
  删除: { type: 'danger' },
  批量删除: { type: 'danger' },
  登录: { type: 'primary' },
  邮箱登录: { type: 'primary' },
  登出: { type: 'info' },
  注册: { type: 'success' },
  密码重置: { type: 'warning' },
  授权: { type: 'primary' },
  角色分配: { type: 'primary' },
  用户授权: { type: 'primary' }
}

/** 表格列定义 */
const logColumns: CommonTableColumn[] = [
  {
    key: 'index',
    title: '序号',
    width: 72,
    align: 'center',
    cellRenderer: ({ rowIndex }) =>
      h('span', null, String((pagination.page - 1) * pagination.pageSize + rowIndex + 1))
  },
  {
    key: 'operator',
    title: '操作人',
    width: 140,
    cellRenderer: ({ rowData }) => {
      const row = rowData as unknown as OperationLogItem
      return h('span', null, row.nickname || row.username || '-')
    }
  },
  {
    key: 'module',
    title: '模块',
    width: 110,
    align: 'center',
    cellRenderer: ({ rowData }) => {
      const row = rowData as unknown as OperationLogItem
      const cfg = moduleTagConfigMap[row.module] || { type: 'info' as const }
      return h(ElTag, { type: cfg.type, effect: 'light', size: 'small' }, () => row.module)
    }
  },
  {
    key: 'action',
    title: '操作',
    width: 100,
    align: 'center',
    cellRenderer: ({ rowData }) => {
      const row = rowData as unknown as OperationLogItem
      const cfg = actionTagConfigMap[row.action] || { type: 'info' as const }
      return h(ElTag, { type: cfg.type, effect: 'light', size: 'small' }, () => row.action)
    }
  },
  {
    key: 'target',
    dataKey: 'target',
    title: '操作对象',
    minWidth: 160,
    showOverflowTooltip: true,
    formatter: row => (row.target ? String(row.target) : '-')
  },
  {
    key: 'url',
    dataKey: 'url',
    title: '请求路径',
    minWidth: 200,
    showOverflowTooltip: true
  },
  {
    key: 'duration',
    dataKey: 'duration',
    title: '耗时',
    width: 80,
    align: 'center',
    formatter: row => `${row.duration}ms`
  },
  {
    key: 'result',
    dataKey: 'result',
    title: '结果',
    width: 80,
    align: 'center',
    cellRenderer: ({ rowData }) => {
      const row = rowData as unknown as OperationLogItem
      return h(
        ElTag,
        {
          type: row.result === 'success' ? 'success' : 'danger',
          effect: 'light',
          size: 'small'
        },
        () => (row.result === 'success' ? '成功' : '失败')
      )
    }
  },
  {
    key: 'createTime',
    dataKey: 'createTime',
    title: '操作时间',
    minWidth: 170
  },
  {
    key: 'actionBtns',
    title: '操作',
    width: 100,
    fixed: 'right',
    align: 'center',
    cellRenderer: ({ rowData }) => {
      const row = rowData as unknown as OperationLogItem
      return h(LogActionCell, {
        row,
        canDetail: hasLogDetailPermission.value,
        onDetail: openDetailDrawer
      })
    }
  }
]

const toolbarActions = computed<CommonTableToolbarAction[]>(() => [
  {
    key: 'refresh-logs',
    label: '刷新',
    icon: Refresh,
    size: 'small',
    type: 'info',
    plain: true,
    permission: LOG_PERMISSION_CODES.LIST,
    disabled: !hasLogListPermission.value,
    onClick: refreshLogs
  }
])

const openDetailDrawer = (log: OperationLogItem) => {
  detailLog.value = log
  detailVisible.value = true
}

/** Tab 切换时重置查询条件并刷新 */
watch(activeTab, async () => {
  await resetLogFilters()
})

/** 表格列配置 */
const displayColumns = computed<CommonTableColumn[]>(() => {
  return logColumns
})

const refreshTabData = async () => {
  await refreshLogs()
}

onMounted(() => {
  void getLogs()
})

useContentRefresh(() => refreshTabData())
</script>

<template>
  <div class="log-management-page">
    <el-tabs v-model="activeTab" class="log-management-tabs">
      <el-tab-pane label="操作日志" name="operation">
        <div class="log-management-page__pane">
          <CommonTableFilter
            v-model="query"
            :fields="filterFields"
            :loading="loading"
            collapsible
            @search="searchLogs"
            @reset="resetLogFilters"
          />

          <CommonTable
            v-model:page="pagination.page"
            v-model:page-size="pagination.pageSize"
            :columns="displayColumns"
            :data="tableData"
            :loading="loading"
            :pagination="pagination"
            settings-key="log-operation-table"
            show-settings
            configurable-columns
            @page-change="refreshLogs"
          >
            <template #header>
              <CommonTableToolbar :actions="toolbarActions" />
            </template>
          </CommonTable>
        </div>
      </el-tab-pane>

      <el-tab-pane label="异常日志" name="error">
        <div class="log-management-page__pane">
          <CommonTableFilter
            v-model="query"
            :fields="filterFields"
            :loading="loading"
            collapsible
            @search="searchLogs"
            @reset="resetLogFilters"
          />

          <CommonTable
            v-model:page="pagination.page"
            v-model:page-size="pagination.pageSize"
            :columns="displayColumns"
            :data="tableData"
            :loading="loading"
            :pagination="pagination"
            settings-key="log-error-table"
            show-settings
            configurable-columns
            @page-change="refreshLogs"
          >
            <template #header>
              <CommonTableToolbar :actions="toolbarActions" />
            </template>
          </CommonTable>
        </div>
      </el-tab-pane>
    </el-tabs>

    <LogDetailDrawer v-model:visible="detailVisible" :log="detailLog" />
  </div>
</template>

<style scoped lang="scss">
.log-management-page {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  overflow: hidden;

  &__pane {
    display: flex;
    flex-direction: column;
    flex: 1;
    gap: var(--layout-gap);
    min-height: 0;
  }
}

.log-management-tabs {
  display: flex;
  flex: 1;
  min-height: 0;
  flex-direction: column;

  :deep(.el-tabs__content) {
    flex: 1;
    min-height: 0;
    overflow: hidden;
  }

  :deep(.el-tab-pane) {
    height: 100%;
    min-height: 0;
    display: flex;
    flex-direction: column;
  }
}
</style>
