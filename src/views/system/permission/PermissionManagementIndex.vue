<script setup lang="ts">
import { computed, h, onMounted } from 'vue'
import { CirclePlus, Refresh } from '@element-plus/icons-vue'
import { ElTag } from 'element-plus'
import CommonTableFilter from '@/components/common/CommonTableFilter.vue'
import CommonTable, { type CommonTableColumn } from '@/components/common/CommonTable.vue'
import CommonTableToolbar, {
  type CommonTableToolbarAction
} from '@/components/common/CommonTableToolbar.vue'
import CommonGrantSubjectList from '@/components/common/CommonGrantSubjectList.vue'
import CommonGrantTreeCard from '@/components/common/CommonGrantTreeCard.vue'
import { PERMISSION_PERMISSION_CODES } from '@/constants/permission'
import { Message } from '@/utils/message'
import { useContentRefresh } from '@/composables/useContentRefresh'
import type { PermissionResourceNode, PermissionResourceTableItem } from '@/types/permission'
import { usePermissionGrant } from './composables/usePermissionGrant'
import { usePermissionResourceList } from './composables/usePermissionResourceList'
import { PermissionResourceNameCell } from './CompsExport'

const activeTab = defineModel<'resource' | 'grant'>('activeTab', {
  default: 'resource'
})

const {
  loading,
  query,
  filterFields,
  pagination,
  tableData,
  permissionTreeData,
  getPermissionResources,
  searchPermissionResources,
  resetPermissionFilters,
  refreshPermissionResources
} = usePermissionResourceList()

const {
  filteredSubjects,
  subjectKeyword,
  selectedSubjectId,
  selectedSubject,
  checkedPermissionKeys,
  saving,
  selectSubject,
  resetCurrentSubjectGrant,
  checkAllPermissions,
  clearAllPermissions,
  saveCurrentSubjectGrant
} = usePermissionGrant({ permissionTreeData })

const toPermissionRow = (rowData: Record<string, unknown>) =>
  rowData as unknown as PermissionResourceTableItem

const permissionTypeTagConfigMap = {
  api: { label: '接口', type: 'danger' },
  button: { label: '按钮', type: 'info' }
} as const

const statusTagConfigMap = {
  enabled: { label: '启用', type: 'success' },
  disabled: { label: '禁用', type: 'info' }
} as const

const resourceColumns: CommonTableColumn[] = [
  {
    key: 'index',
    title: '序号',
    width: 72,
    align: 'center',
    cellRenderer: ({ rowIndex }) =>
      h('span', null, String((pagination.page - 1) * pagination.pageSize + rowIndex + 1))
  },
  {
    key: 'name',
    dataKey: 'name',
    title: '权限名称',
    minWidth: 260,
    cellRenderer: ({ rowData }) => h(PermissionResourceNameCell, { row: toPermissionRow(rowData) })
  },
  {
    key: 'type',
    dataKey: 'type',
    title: '类型',
    width: 120,
    align: 'center',
    cellRenderer: ({ rowData }) => {
      const config = permissionTypeTagConfigMap[toPermissionRow(rowData).type]
      return h(ElTag, { type: config.type, effect: 'light' }, () => config.label)
    }
  },
  {
    key: 'permissionCode',
    dataKey: 'permissionCode',
    title: '权限标识',
    minWidth: 220,
    showOverflowTooltip: true
  },
  {
    key: 'apiPath',
    dataKey: 'apiPath',
    title: '接口路径',
    minWidth: 220,
    showOverflowTooltip: true,
    formatter: row => (row.apiPath ? String(row.apiPath) : '-')
  },
  {
    key: 'httpMethod',
    dataKey: 'httpMethod',
    title: '请求方法',
    width: 110,
    align: 'center'
  },
  {
    key: 'status',
    dataKey: 'status',
    title: '状态',
    width: 110,
    align: 'center',
    cellRenderer: ({ rowData }) => {
      const config = statusTagConfigMap[toPermissionRow(rowData).status]
      return h(ElTag, { type: config.type, effect: 'light' }, () => config.label)
    }
  },
  {
    key: 'updatedAt',
    dataKey: 'updatedAt',
    title: '更新时间',
    minWidth: 180
  }
]

const toolbarActions = computed<CommonTableToolbarAction[]>(() => {
  return [
    {
      key: 'add-permission',
      label: '新增权限',
      icon: CirclePlus,
      size: 'small',
      color: 'var(--c-info)',
      permission: PERMISSION_PERMISSION_CODES.CREATE,
      onClick: () => Message.info('后端接口未接入，当前为页面原型模式')
    },
    {
      key: 'refresh-permission',
      label: '刷新',
      icon: Refresh,
      size: 'small',
      type: 'info',
      plain: true,
      permission: PERMISSION_PERMISSION_CODES.LIST,
      onClick: refreshPermissionResources
    }
  ]
})

const refreshTabData = async () => {
  if (activeTab.value === 'resource') {
    await refreshPermissionResources()
    return
  }

  resetCurrentSubjectGrant()
}

onMounted(() => {
  void getPermissionResources()
})

useContentRefresh(() => refreshTabData())
</script>

<template>
  <div class="permission-management-page">
    <el-tabs v-model="activeTab" class="permission-management-tabs">
      <el-tab-pane label="权限资源" name="resource">
        <div class="permission-management-page__pane">
          <CommonTableFilter
            v-model="query"
            :fields="filterFields"
            :loading="loading"
            @search="searchPermissionResources"
            @reset="resetPermissionFilters"
          />

          <CommonTable
            v-model:page="pagination.page"
            v-model:page-size="pagination.pageSize"
            :columns="resourceColumns"
            :data="tableData"
            :loading="loading"
            :pagination="pagination"
            settings-key="permission-resource-table"
            show-settings
            configurable-columns
            @page-change="refreshPermissionResources"
          >
            <template #header>
              <CommonTableToolbar :actions="toolbarActions" />
            </template>
          </CommonTable>
        </div>
      </el-tab-pane>

      <el-tab-pane label="权限授权" name="grant">
        <div class="permission-pane">
          <div class="permission-pane__left">
            <CommonGrantSubjectList
              :subjects="filteredSubjects"
              :selected-id="selectedSubjectId"
              :keyword="subjectKeyword"
              @update:keyword="value => (subjectKeyword = value)"
              @select="selectSubject"
            />
          </div>

          <div class="permission-pane__right">
            <CommonGrantTreeCard
              v-model:checked-keys="checkedPermissionKeys"
              :tree-data="permissionTreeData"
              :subject-name="selectedSubject?.nickname || selectedSubject?.username || ''"
              :saving="saving"
              title="权限资源树"
              summary-unit-text="项权限"
              :grant-permission-code="PERMISSION_PERMISSION_CODES.GRANT"
              @check-all="checkAllPermissions"
              @clear-all="clearAllPermissions"
              @reset="resetCurrentSubjectGrant"
              @save="saveCurrentSubjectGrant"
            >
              <template #node="{ data }">
                <div class="permission-tree-card__node">
                  <span class="permission-tree-card__node-name">{{
                    (data as PermissionResourceNode).name
                  }}</span>
                  <el-tag
                    :type="permissionTypeTagConfigMap[(data as PermissionResourceNode).type].type"
                    effect="light"
                  >
                    {{ permissionTypeTagConfigMap[(data as PermissionResourceNode).type].label }}
                  </el-tag>
                  <span class="permission-tree-card__node-code">{{
                    (data as PermissionResourceNode).permissionCode
                  }}</span>
                </div>
              </template>
            </CommonGrantTreeCard>
          </div>
        </div>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<style scoped lang="scss">
.permission-management-page {
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

.permission-management-tabs {
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

.permission-pane {
  display: grid;
  flex: 1;
  grid-template-columns: minmax(280px, 360px) minmax(0, 1fr);
  gap: var(--layout-gap);
  height: 100%;
  min-height: 0;

  &__left,
  &__right {
    display: flex;
    flex-direction: column;
    min-height: 0;
  }

  @include respond-to(tablet-down) {
    grid-template-columns: 1fr;
    grid-template-rows: minmax(280px, 36vh) minmax(0, 1fr);
  }
}

.permission-tree-card {
  &__node {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: var(--space-2);
    width: 100%;
    min-width: 0;
    line-height: 1.4;
  }

  &__node-name {
    color: var(--t-primary);
    font-size: 13px;
    font-weight: 500;
  }

  &__node-code {
    color: var(--t-placeholder);
    font-size: 12px;
    white-space: normal;
    word-break: break-all;
    line-height: 1.35;
  }
}
</style>
