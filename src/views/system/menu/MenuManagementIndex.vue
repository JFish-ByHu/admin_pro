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
import { MENU_PERMISSION_CODES } from '@/constants/permission'
import { Message } from '@/utils/message'
import { useContentRefresh } from '@/composables/useContentRefresh'
import type { MenuResourceNode, MenuResourceTableItem } from '@/types/menu'
import { useMenuGrant } from './composables/useMenuGrant'
import { useMenuResourceList } from './composables/useMenuResourceList'
import { MenuResourceNameCell } from './CompsExport'

const activeTab = defineModel<'resource' | 'grant'>('activeTab', {
  default: 'resource'
})

const {
  loading,
  query,
  filterFields,
  pagination,
  tableData,
  menuTreeData,
  getMenuResources,
  searchMenuResources,
  resetMenuFilters,
  refreshMenuResources
} = useMenuResourceList()

const {
  filteredSubjects,
  subjectKeyword,
  selectedSubjectId,
  selectedSubject,
  checkedMenuKeys,
  saving,
  selectSubject,
  resetCurrentSubjectGrant,
  checkAllMenus,
  clearAllMenus,
  saveCurrentSubjectGrant
} = useMenuGrant({ menuTreeData })

const toMenuRow = (rowData: Record<string, unknown>) => rowData as unknown as MenuResourceTableItem

const menuTypeTagConfigMap = {
  directory: { label: '目录', type: 'warning' },
  menu: { label: '菜单', type: 'success' }
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
    title: '菜单名称',
    minWidth: 260,
    cellRenderer: ({ rowData }) => h(MenuResourceNameCell, { row: toMenuRow(rowData) })
  },
  {
    key: 'type',
    dataKey: 'type',
    title: '类型',
    width: 120,
    align: 'center',
    cellRenderer: ({ rowData }) => {
      const config = menuTypeTagConfigMap[toMenuRow(rowData).type]
      return h(ElTag, { type: config.type, effect: 'light' }, () => config.label)
    }
  },
  {
    key: 'routePath',
    dataKey: 'routePath',
    title: '路由路径',
    minWidth: 220,
    showOverflowTooltip: true,
    formatter: row => (row.routePath ? String(row.routePath) : '-')
  },
  {
    key: 'componentPath',
    dataKey: 'componentPath',
    title: '组件路径',
    minWidth: 240,
    showOverflowTooltip: true,
    formatter: row => (row.componentPath ? String(row.componentPath) : '-')
  },
  {
    key: 'status',
    dataKey: 'status',
    title: '状态',
    width: 110,
    align: 'center',
    cellRenderer: ({ rowData }) => {
      const config = statusTagConfigMap[toMenuRow(rowData).status]
      return h(ElTag, { type: config.type, effect: 'light' }, () => config.label)
    }
  },
  {
    key: 'sort',
    dataKey: 'sort',
    title: '排序',
    width: 90,
    align: 'center'
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
      key: 'add-menu',
      label: '新增菜单',
      icon: CirclePlus,
      size: 'small',
      color: 'var(--c-info)',
      permission: MENU_PERMISSION_CODES.CREATE,
      onClick: () => Message.info('后端接口未接入，当前为页面原型模式')
    },
    {
      key: 'refresh-menu',
      label: '刷新',
      icon: Refresh,
      size: 'small',
      type: 'info',
      plain: true,
      permission: MENU_PERMISSION_CODES.LIST,
      onClick: refreshMenuResources
    }
  ]
})

onMounted(() => {
  void getMenuResources()
})

const refreshTabData = async () => {
  if (activeTab.value === 'resource') {
    await refreshMenuResources()
    return
  }

  resetCurrentSubjectGrant()
}

useContentRefresh(() => refreshTabData())
</script>

<template>
  <div class="menu-management-page">
    <el-tabs v-model="activeTab" class="menu-management-tabs">
      <el-tab-pane label="菜单资源" name="resource">
        <div class="menu-management-page__pane">
          <CommonTableFilter
            v-model="query"
            :fields="filterFields"
            :loading="loading"
            @search="searchMenuResources"
            @reset="resetMenuFilters"
          />

          <CommonTable
            v-model:page="pagination.page"
            v-model:page-size="pagination.pageSize"
            :columns="resourceColumns"
            :data="tableData"
            :loading="loading"
            :pagination="pagination"
            settings-key="menu-resource-table"
            show-settings
            configurable-columns
            @page-change="refreshMenuResources"
          >
            <template #header>
              <CommonTableToolbar :actions="toolbarActions" />
            </template>
          </CommonTable>
        </div>
      </el-tab-pane>

      <el-tab-pane label="菜单授权" name="grant">
        <div class="menu-grant-pane">
          <div class="menu-grant-pane__left">
            <CommonGrantSubjectList
              :subjects="filteredSubjects"
              :selected-id="selectedSubjectId"
              :keyword="subjectKeyword"
              @update:keyword="value => (subjectKeyword = value)"
              @select="selectSubject"
            />
          </div>

          <div class="menu-grant-pane__right">
            <CommonGrantTreeCard
              v-model:checked-keys="checkedMenuKeys"
              :tree-data="menuTreeData"
              :subject-name="selectedSubject?.nickname || selectedSubject?.username || ''"
              :saving="saving"
              title="菜单资源树"
              summary-unit-text="项菜单"
              :grant-permission-code="MENU_PERMISSION_CODES.GRANT"
              @check-all="checkAllMenus"
              @clear-all="clearAllMenus"
              @reset="resetCurrentSubjectGrant"
              @save="saveCurrentSubjectGrant"
            >
              <template #node="{ data }">
                <div class="menu-tree-card__node">
                  <span class="menu-tree-card__node-name">{{
                    (data as MenuResourceNode).name
                  }}</span>
                  <el-tag
                    :type="menuTypeTagConfigMap[(data as MenuResourceNode).type].type"
                    effect="light"
                  >
                    {{ menuTypeTagConfigMap[(data as MenuResourceNode).type].label }}
                  </el-tag>
                  <span class="menu-tree-card__node-path">{{
                    (data as MenuResourceNode).routePath || '-'
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
.menu-management-page {
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

.menu-management-tabs {
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

.menu-grant-pane {
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

.menu-tree-card {
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

  &__node-path {
    color: var(--t-placeholder);
    font-size: 12px;
    white-space: normal;
    word-break: break-all;
    line-height: 1.35;
  }
}
</style>
