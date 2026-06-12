<script setup lang="ts">
import { computed, h, onMounted, ref } from 'vue'
import { CirclePlus, Delete, Refresh } from '@element-plus/icons-vue'
import { ElTag } from 'element-plus'
import CommonTableFilter from '@/components/common/CommonTableFilter.vue'
import CommonTable, { type CommonTableColumn } from '@/components/common/CommonTable.vue'
import CommonTableToolbar, {
  type CommonTableToolbarAction
} from '@/components/common/CommonTableToolbar.vue'
import CommonGrantSubjectList from '@/components/common/CommonGrantSubjectList.vue'
import CommonGrantTreeCard from '@/components/common/CommonGrantTreeCard.vue'
import {
  addMenuResource,
  batchDeleteMenuResources,
  deleteMenuResourceById,
  updateMenuResource
} from '@/api/menu'
import { MENU_PERMISSION_CODES } from '@/constants/permission'
import { useUserStore } from '@/stores/user'
import { Message } from '@/utils/message'
import { useContentRefresh } from '@/composables/useContentRefresh'
import type { MenuResourceFormModel, MenuResourceNode, MenuResourceTableItem } from '@/types/menu'
import { useMenuGrant } from './composables/useMenuGrant'
import { useMenuResourceList } from './composables/useMenuResourceList'
import { MenuResourceActionCell, MenuResourceFormDialog, MenuResourceNameCell } from './CompsExport'

const activeTab = defineModel<'resource' | 'grant'>('activeTab', {
  default: 'resource'
})

const userStore = useUserStore()
const selectedRowKeys = ref<Array<string | number>>([])
const dialogVisible = ref(false)
const dialogSubmitting = ref(false)
const dialogMode = ref<'add' | 'edit'>('add')
const editingMenuId = ref('')
const editingMenuNode = ref<MenuResourceTableItem | null>(null)

const hasPermission = (permissionCode: string) => {
  return userStore.permissions.includes(permissionCode)
}

const canCreateMenu = computed(() => hasPermission(MENU_PERMISSION_CODES.CREATE))
const canUpdateMenu = computed(() => hasPermission(MENU_PERMISSION_CODES.UPDATE))
const canDeleteMenu = computed(() => hasPermission(MENU_PERMISSION_CODES.DELETE))

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
  roleLabelMap,
  subjectKeyword,
  selectedSubjectId,
  selectedSubject,
  checkedMenuKeys,
  saving,
  selectSubject,
  resetCurrentSubjectGrant,
  checkAllMenus,
  clearAllMenus,
  saveCurrentSubjectGrant,
  refreshSubjects
} = useMenuGrant({ menuTreeData })

const toMenuRow = (rowData: Record<string, unknown>) => rowData as unknown as MenuResourceTableItem

const dialogTitle = computed(() => {
  return dialogMode.value === 'add' ? '新增菜单' : '编辑菜单'
})

const createInitialFormModel = (): MenuResourceFormModel => ({
  parentId: '',
  name: '',
  type: 'menu',
  routePath: '',
  componentPath: '',
  sort: 0,
  status: 'enabled'
})

const formModel = ref<MenuResourceFormModel>(createInitialFormModel())

const menuNodeChildrenMap = computed(() => {
  const childrenMap = new Map<string, string[]>()

  const travel = (nodes: MenuResourceNode[]) => {
    nodes.forEach(node => {
      if (node.parentId) {
        const siblings = childrenMap.get(node.parentId) || []
        siblings.push(node.id)
        childrenMap.set(node.parentId, siblings)
      }

      if (node.children?.length) {
        travel(node.children)
      }
    })
  }

  travel(menuTreeData.value)
  return childrenMap
})

const editingNodeDescendants = computed(() => {
  if (!editingMenuId.value) {
    return new Set<string>()
  }

  const descendants = new Set<string>()
  const stack = [editingMenuId.value]

  while (stack.length > 0) {
    const currentId = stack.pop() as string
    const children = menuNodeChildrenMap.value.get(currentId) || []

    children.forEach(childId => {
      if (!descendants.has(childId)) {
        descendants.add(childId)
        stack.push(childId)
      }
    })
  }

  return descendants
})

const parentOptions = computed(() => {
  const options: Array<{ label: string; value: string }> = []

  const travel = (nodes: MenuResourceNode[], level: number) => {
    nodes
      .slice()
      .sort((a, b) => a.sort - b.sort)
      .forEach(node => {
        if (node.id !== editingMenuId.value && !editingNodeDescendants.value.has(node.id)) {
          options.push({
            label: `${'  '.repeat(level)}${node.name}`,
            value: node.id
          })
        }

        if (node.children?.length) {
          travel(node.children, level + 1)
        }
      })
  }

  travel(menuTreeData.value, 0)
  return options
})

const openAddMenuDialog = () => {
  if (!canCreateMenu.value) {
    return
  }

  dialogMode.value = 'add'
  editingMenuId.value = ''
  editingMenuNode.value = null
  formModel.value = createInitialFormModel()
  dialogVisible.value = true
}

const openEditMenuDialog = (row: MenuResourceTableItem) => {
  if (!canUpdateMenu.value) {
    return
  }

  dialogMode.value = 'edit'
  editingMenuId.value = row.id
  editingMenuNode.value = row
  formModel.value = {
    parentId: row.parentId || '',
    name: row.name,
    type: row.type,
    routePath: row.routePath,
    componentPath: row.componentPath,
    sort: row.sort,
    status: row.status
  }
  dialogVisible.value = true
}

const closeMenuDialog = () => {
  dialogVisible.value = false
  editingMenuId.value = ''
  editingMenuNode.value = null
  formModel.value = createInitialFormModel()
}

const submitMenuDialog = async (payload: MenuResourceFormModel) => {
  if (dialogMode.value === 'add' && !canCreateMenu.value) {
    return
  }

  if (dialogMode.value === 'edit' && !canUpdateMenu.value) {
    return
  }

  dialogSubmitting.value = true

  try {
    if (dialogMode.value === 'add') {
      await addMenuResource({
        parentId: payload.parentId || undefined,
        name: payload.name,
        type: payload.type,
        routePath: payload.routePath,
        componentPath: payload.componentPath,
        sort: payload.sort,
        isActive: payload.status === 'enabled'
      })
      Message.success('菜单创建成功')
    } else {
      await updateMenuResource(editingMenuId.value, {
        parentId: payload.parentId || null,
        name: payload.name,
        type: payload.type,
        routePath: payload.routePath,
        componentPath: payload.componentPath,
        sort: payload.sort,
        isActive: payload.status === 'enabled'
      })
      Message.success('菜单更新成功')
    }

    closeMenuDialog()
    selectedRowKeys.value = []
    await Promise.all([refreshMenuResources(), refreshSubjects()])
  } finally {
    dialogSubmitting.value = false
  }
}

const deleteMenu = (row: MenuResourceTableItem) => {
  if (!canDeleteMenu.value) {
    return
  }

  ElMessageBox.confirm(`确认删除菜单「${row.name}」吗？`, '删除确认', {
    type: 'warning',
    confirmButtonText: '确认删除',
    cancelButtonText: '取消'
  })
    .then(async () => {
      await deleteMenuResourceById(row.id)

      const nextTotal = Math.max(0, pagination.total - 1)
      const maxPage = Math.max(1, Math.ceil(nextTotal / pagination.pageSize))
      pagination.page = Math.min(pagination.page, maxPage)

      Message.success('删除成功')
      await Promise.all([refreshMenuResources(), refreshSubjects()])
    })
    .catch(err => {
      console.error('Delete Menu Error:', err)
    })
}

const deleteSelectedMenus = () => {
  if (!canDeleteMenu.value || !selectedRowKeys.value.length) {
    return
  }

  const deleteCount = selectedRowKeys.value.length

  ElMessageBox.confirm(`确认删除已选中的 ${deleteCount} 个菜单吗？`, '批量删除确认', {
    type: 'warning',
    confirmButtonText: '确认删除',
    cancelButtonText: '取消'
  })
    .then(async () => {
      await batchDeleteMenuResources(selectedRowKeys.value.map(String))

      const nextTotal = Math.max(0, pagination.total - deleteCount)
      const maxPage = Math.max(1, Math.ceil(nextTotal / pagination.pageSize))
      pagination.page = Math.min(pagination.page, maxPage)
      selectedRowKeys.value = []

      Message.success(`已删除 ${deleteCount} 个菜单`)
      await Promise.all([refreshMenuResources(), refreshSubjects()])
    })
    .catch(err => {
      console.error('Batch Delete Menu Error:', err)
    })
}

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
    key: 'updateTime',
    dataKey: 'updateTime',
    title: '更新时间',
    minWidth: 180
  },
  {
    key: 'action',
    title: '操作',
    width: 130,
    fixed: 'right',
    align: 'center',
    cellRenderer: ({ rowData }) => {
      const row = toMenuRow(rowData)

      return h(MenuResourceActionCell, {
        row,
        canEdit: canUpdateMenu.value,
        canDelete: canDeleteMenu.value,
        deleteDisabledReason: canDeleteMenu.value ? '' : '无删除权限',
        onEdit: openEditMenuDialog,
        onDelete: deleteMenu
      })
    }
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
      disabled: !canCreateMenu.value,
      onClick: openAddMenuDialog
    },
    {
      key: 'batch-delete-menu',
      label: '批量删除',
      icon: Delete,
      size: 'small',
      type: 'danger',
      plain: true,
      permission: MENU_PERMISSION_CODES.DELETE,
      disabled: !canDeleteMenu.value || selectedRowKeys.value.length === 0,
      onClick: deleteSelectedMenus
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
  void Promise.all([getMenuResources(), refreshSubjects()])
})

const refreshTabData = async () => {
  if (activeTab.value === 'resource') {
    await refreshMenuResources()
    return
  }

  await refreshSubjects()
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
            v-model:selected-row-keys="selectedRowKeys"
            :columns="resourceColumns"
            :data="tableData"
            :loading="loading"
            :pagination="pagination"
            selectable
            settings-key="menu-resource-table"
            show-settings
            configurable-selection
            configurable-columns
            @page-change="refreshMenuResources"
          >
            <template #header>
              <CommonTableToolbar
                :actions="toolbarActions"
                show-selection-summary
                :selected-count="selectedRowKeys.length"
                empty-text="请选择要操作的菜单"
              />
            </template>
          </CommonTable>

          <MenuResourceFormDialog
            v-model:visible="dialogVisible"
            :mode="dialogMode"
            :title="dialogTitle"
            :submitting="dialogSubmitting"
            :submit-permission="
              dialogMode === 'add' ? MENU_PERMISSION_CODES.CREATE : MENU_PERMISSION_CODES.UPDATE
            "
            :initial-value="formModel"
            :parent-options="parentOptions"
            @submit="submitMenuDialog"
          />
        </div>
      </el-tab-pane>

      <el-tab-pane label="菜单授权" name="grant">
        <div class="menu-grant-pane">
          <div class="menu-grant-pane__left">
            <CommonGrantSubjectList
              :subjects="filteredSubjects"
              :selected-id="selectedSubjectId"
              :keyword="subjectKeyword"
              title="授权角色"
              placeholder="搜索角色名称 / 编码"
              empty-text="暂无可授权角色"
              :role-label-map="roleLabelMap"
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
