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
  addPermissionResource,
  batchDeletePermissionResources,
  deletePermissionResourceById,
  updatePermissionResource
} from '@/api/permission'
import { PERMISSION_PERMISSION_CODES } from '@/constants/permission'
import { useUserStore } from '@/stores/user'
import { Message } from '@/utils/message'
import { useContentRefresh } from '@/composables/useContentRefresh'
import type {
  PermissionResourceFormModel,
  PermissionResourceNode,
  PermissionResourceTableItem
} from '@/types/permission'
import { usePermissionGrant } from './composables/usePermissionGrant'
import { usePermissionResourceList } from './composables/usePermissionResourceList'
import {
  PermissionResourceActionCell,
  PermissionResourceFormDialog,
  PermissionResourceNameCell
} from './CompsExport'

const activeTab = defineModel<'resource' | 'grant'>('activeTab', {
  default: 'resource'
})

const userStore = useUserStore()
const selectedRowKeys = ref<Array<string | number>>([])
const dialogVisible = ref(false)
const dialogSubmitting = ref(false)
const dialogMode = ref<'add' | 'edit'>('add')
const editingPermissionId = ref('')

const hasPermission = (permissionCode: string) => {
  return userStore.permissions.includes(permissionCode)
}

const canCreatePermission = computed(() => hasPermission(PERMISSION_PERMISSION_CODES.CREATE))
const canUpdatePermission = computed(() => hasPermission(PERMISSION_PERMISSION_CODES.UPDATE))
const canDeletePermission = computed(() => hasPermission(PERMISSION_PERMISSION_CODES.DELETE))

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
  roleLabelMap,
  subjectKeyword,
  selectedSubjectId,
  selectedSubject,
  checkedPermissionKeys,
  saving,
  selectSubject,
  resetCurrentSubjectGrant,
  checkAllPermissions,
  clearAllPermissions,
  saveCurrentSubjectGrant,
  refreshSubjects
} = usePermissionGrant({ permissionTreeData })

const toPermissionRow = (rowData: Record<string, unknown>) =>
  rowData as unknown as PermissionResourceTableItem

const dialogTitle = computed(() => {
  return dialogMode.value === 'add' ? '新增权限' : '编辑权限'
})

const createInitialFormModel = (): PermissionResourceFormModel => ({
  parentId: '',
  name: '',
  permissionCode: '',
  type: 'api',
  apiPath: '',
  httpMethod: 'GET',
  sort: 0,
  status: 'enabled'
})

const formModel = ref<PermissionResourceFormModel>(createInitialFormModel())

const permissionNodeChildrenMap = computed(() => {
  const childrenMap = new Map<string, string[]>()

  const travel = (nodes: PermissionResourceNode[]) => {
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

  travel(permissionTreeData.value)
  return childrenMap
})

const editingNodeDescendants = computed(() => {
  if (!editingPermissionId.value) {
    return new Set<string>()
  }

  const descendants = new Set<string>()
  const stack = [editingPermissionId.value]

  while (stack.length > 0) {
    const currentId = stack.pop() as string
    const children = permissionNodeChildrenMap.value.get(currentId) || []

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

  const travel = (nodes: PermissionResourceNode[], level: number) => {
    nodes
      .slice()
      .sort((a, b) => a.sort - b.sort)
      .forEach(node => {
        if (node.id !== editingPermissionId.value && !editingNodeDescendants.value.has(node.id)) {
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

  travel(permissionTreeData.value, 0)
  return options
})

const openAddPermissionDialog = () => {
  if (!canCreatePermission.value) {
    return
  }

  dialogMode.value = 'add'
  editingPermissionId.value = ''
  formModel.value = createInitialFormModel()
  dialogVisible.value = true
}

const openEditPermissionDialog = (row: PermissionResourceTableItem) => {
  if (!canUpdatePermission.value) {
    return
  }

  dialogMode.value = 'edit'
  editingPermissionId.value = row.id
  formModel.value = {
    parentId: row.parentId || '',
    name: row.name,
    permissionCode: row.permissionCode,
    type: row.type,
    apiPath: row.apiPath,
    httpMethod: row.httpMethod,
    sort: row.sort,
    status: row.status
  }
  dialogVisible.value = true
}

const closePermissionDialog = () => {
  dialogVisible.value = false
  editingPermissionId.value = ''
  formModel.value = createInitialFormModel()
}

const submitPermissionDialog = async (payload: PermissionResourceFormModel) => {
  if (dialogMode.value === 'add' && !canCreatePermission.value) {
    return
  }

  if (dialogMode.value === 'edit' && !canUpdatePermission.value) {
    return
  }

  dialogSubmitting.value = true

  try {
    if (dialogMode.value === 'add') {
      await addPermissionResource({
        parentId: payload.parentId || undefined,
        name: payload.name,
        permissionCode: payload.permissionCode,
        type: payload.type,
        apiPath: payload.apiPath || undefined,
        httpMethod: payload.httpMethod || undefined,
        sort: payload.sort,
        isActive: payload.status === 'enabled'
      })
      Message.success('权限创建成功')
    } else {
      await updatePermissionResource(editingPermissionId.value, {
        parentId: payload.parentId || null,
        name: payload.name,
        permissionCode: payload.permissionCode,
        type: payload.type,
        apiPath: payload.apiPath,
        httpMethod: payload.httpMethod,
        sort: payload.sort,
        isActive: payload.status === 'enabled'
      })
      Message.success('权限更新成功')
    }

    closePermissionDialog()
    selectedRowKeys.value = []
    await Promise.all([refreshPermissionResources(), refreshSubjects()])
  } finally {
    dialogSubmitting.value = false
  }
}

const deletePermission = (row: PermissionResourceTableItem) => {
  if (!canDeletePermission.value) {
    return
  }

  ElMessageBox.confirm(`确认删除权限「${row.name}」吗？`, '删除确认', {
    type: 'warning',
    confirmButtonText: '确认删除',
    cancelButtonText: '取消'
  })
    .then(async () => {
      await deletePermissionResourceById(row.id)

      const nextTotal = Math.max(0, pagination.total - 1)
      const maxPage = Math.max(1, Math.ceil(nextTotal / pagination.pageSize))
      pagination.page = Math.min(pagination.page, maxPage)

      Message.success('删除成功')
      await Promise.all([refreshPermissionResources(), refreshSubjects()])
    })
    .catch(err => {
      console.error('Delete Permission Error:', err)
    })
}

const deleteSelectedPermissions = () => {
  if (!canDeletePermission.value || !selectedRowKeys.value.length) {
    return
  }

  const deleteCount = selectedRowKeys.value.length

  ElMessageBox.confirm(`确认删除已选中的 ${deleteCount} 个权限吗？`, '批量删除确认', {
    type: 'warning',
    confirmButtonText: '确认删除',
    cancelButtonText: '取消'
  })
    .then(async () => {
      await batchDeletePermissionResources(selectedRowKeys.value.map(String))

      const nextTotal = Math.max(0, pagination.total - deleteCount)
      const maxPage = Math.max(1, Math.ceil(nextTotal / pagination.pageSize))
      pagination.page = Math.min(pagination.page, maxPage)
      selectedRowKeys.value = []

      Message.success(`已删除 ${deleteCount} 个权限`)
      await Promise.all([refreshPermissionResources(), refreshSubjects()])
    })
    .catch(err => {
      console.error('Batch Delete Permission Error:', err)
    })
}

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
      const row = toPermissionRow(rowData)

      return h(PermissionResourceActionCell, {
        row,
        canEdit: canUpdatePermission.value,
        canDelete: canDeletePermission.value,
        deleteDisabledReason: canDeletePermission.value ? '' : '无删除权限',
        onEdit: openEditPermissionDialog,
        onDelete: deletePermission
      })
    }
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
      disabled: !canCreatePermission.value,
      onClick: openAddPermissionDialog
    },
    {
      key: 'batch-delete-permission',
      label: '批量删除',
      icon: Delete,
      size: 'small',
      type: 'danger',
      plain: true,
      permission: PERMISSION_PERMISSION_CODES.DELETE,
      disabled: !canDeletePermission.value || selectedRowKeys.value.length === 0,
      onClick: deleteSelectedPermissions
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

  await refreshSubjects()
  resetCurrentSubjectGrant()
}

onMounted(() => {
  void Promise.all([getPermissionResources(), refreshSubjects()])
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
            v-model:selected-row-keys="selectedRowKeys"
            :columns="resourceColumns"
            :data="tableData"
            :loading="loading"
            :pagination="pagination"
            selectable
            settings-key="permission-resource-table"
            show-settings
            configurable-selection
            configurable-columns
            @page-change="refreshPermissionResources"
          >
            <template #header>
              <CommonTableToolbar
                :actions="toolbarActions"
                show-selection-summary
                :selected-count="selectedRowKeys.length"
                empty-text="请选择要操作的权限"
              />
            </template>
          </CommonTable>

          <PermissionResourceFormDialog
            v-model:visible="dialogVisible"
            :mode="dialogMode"
            :title="dialogTitle"
            :submitting="dialogSubmitting"
            :submit-permission="
              dialogMode === 'add'
                ? PERMISSION_PERMISSION_CODES.CREATE
                : PERMISSION_PERMISSION_CODES.UPDATE
            "
            :initial-value="formModel"
            :parent-options="parentOptions"
            @submit="submitPermissionDialog"
          />
        </div>
      </el-tab-pane>

      <el-tab-pane label="权限授权" name="grant">
        <div class="permission-pane">
          <div class="permission-pane__left">
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
