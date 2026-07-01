<script setup lang="ts">
import { computed, h, onMounted, ref } from 'vue'
import { CirclePlus, Delete, FolderAdd, Refresh } from '@element-plus/icons-vue'
import { ElTag } from 'element-plus'
import CommonTableFilter from '@/components/common/CommonTableFilter.vue'
import CommonTable, { type CommonTableColumn } from '@/components/common/CommonTable.vue'
import CommonTableToolbar, {
  type CommonTableToolbarAction
} from '@/components/common/CommonTableToolbar.vue'
import {
  addPermissionGroup,
  addPermissionResource,
  batchDeletePermissionGroups,
  batchDeletePermissionResources,
  deletePermissionGroupById,
  deletePermissionResourceById,
  getPermissionGroups,
  updatePermissionGroup,
  updatePermissionResource
} from '@/api/permission'
import { PERMISSION_PERMISSION_CODES } from '@/constants/permission'
import { useUserStore } from '@/stores/user'
import { Message } from '@/utils/message'
import { useContentRefresh } from '@/composables/useContentRefresh'
import ResourceTreeNodeRow from '@/views/system/components/ResourceTreeNodeRow.vue'
import SystemGrantPane from '@/views/system/components/SystemGrantPane.vue'
import type {
  PermissionGroupItem,
  PermissionResourceFormModel,
  PermissionResourceNode,
  PermissionResourceTableItem
} from '@/types/permission'
import { usePermissionGrant } from './composables/usePermissionGrant'
import { usePermissionResourceList } from './composables/usePermissionResourceList'
import {
  PermissionResourceActionCell,
  PermissionResourceFormDialog,
  PermissionGroupFormDialog,
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

const groupDialogVisible = ref(false)
const groupDialogSubmitting = ref(false)
const groupEditVisible = ref(false)
const groupEditSubmitting = ref(false)
const editingGroupId = ref('')
const editingGroupFormModel = ref<{
  groupCode: string
  groupName: string
  sort: number
  status: 'enabled' | 'disabled'
}>({
  groupCode: '',
  groupName: '',
  sort: 0,
  status: 'enabled'
})
const groupList = ref<PermissionGroupItem[]>([])

const loadGroupList = async () => {
  try {
    groupList.value = await getPermissionGroups()
  } catch {
    // ignore
  }
}

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
  groupCode: '',
  name: '',
  permissionCode: '',
  type: 'api',
  apiPath: '',
  httpMethod: 'GET',
  sort: 0,
  status: 'enabled'
})

const formModel = ref<PermissionResourceFormModel>(createInitialFormModel())

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
    groupCode: row.groupCode || '',
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
        groupCode: payload.groupCode || undefined,
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
        groupCode: payload.groupCode || null,
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

const openGroupDialog = () => {
  if (!canCreatePermission.value) {
    return
  }

  groupDialogVisible.value = true
}

const submitGroupDialog = async (payload: {
  groupCode: string
  groupName: string
  sort: number
  status: string
}) => {
  if (!canCreatePermission.value) {
    return
  }

  groupDialogSubmitting.value = true

  try {
    await addPermissionGroup({
      code: payload.groupCode,
      name: payload.groupName,
      isActive: payload.status === 'enabled'
    })

    Message.success('分组创建成功')
    groupDialogVisible.value = false
    selectedRowKeys.value = []
    await Promise.all([loadGroupList(), refreshPermissionResources(), refreshSubjects()])
  } finally {
    groupDialogSubmitting.value = false
  }
}

const openEditGroupDialog = (row: PermissionResourceTableItem) => {
  if (!canUpdatePermission.value) {
    return
  }

  // 从 groupCode 反查 groupList 获取完整分组信息
  const groupCode = row.groupCode || ''
  const group = groupList.value.find(g => g.code === groupCode)

  editingGroupId.value = group?.id || ''
  editingGroupFormModel.value = {
    groupCode,
    groupName: group?.name || groupCode,
    sort: row.sort,
    status: row.status
  }
  groupEditVisible.value = true
}

const submitEditGroupDialog = async (payload: {
  groupCode: string
  groupName: string
  sort: number
  status: string
}) => {
  if (!canUpdatePermission.value) {
    return
  }

  groupEditSubmitting.value = true

  try {
    await updatePermissionGroup(editingGroupId.value, {
      name: payload.groupName,
      isActive: payload.status === 'enabled'
    })

    Message.success('分组更新成功')
    groupEditVisible.value = false
    await Promise.all([loadGroupList(), refreshPermissionResources(), refreshSubjects()])
  } finally {
    groupEditSubmitting.value = false
  }
}

const deleteGroup = (row: PermissionResourceTableItem) => {
  if (!canDeletePermission.value) {
    return
  }

  const groupCode = row.groupCode || ''
  const group = groupList.value.find(g => g.code === groupCode)
  const groupId = group?.id

  if (!groupId) {
    Message.warning('未找到对应分组记录')
    return
  }

  ElMessageBox.confirm(
    `确认删除分组「${row.name}」吗？该分组下的权限将变为无分组状态。`,
    '删除分组确认',
    {
      type: 'warning',
      confirmButtonText: '确认删除',
      cancelButtonText: '取消'
    }
  )
    .then(async () => {
      await deletePermissionGroupById(groupId)

      Message.success('分组删除成功')
      await Promise.all([loadGroupList(), refreshPermissionResources(), refreshSubjects()])
    })
    .catch(err => {
      console.error('Delete Group Error:', err)
    })
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

  const allKeys = selectedRowKeys.value.map(String)

  // 拆分为分组虚拟 ID 和权限真实 ID
  const groupKeys = allKeys.filter(k => k.startsWith('__group__'))
  const permissionKeys = allKeys.filter(k => !k.startsWith('__group__'))

  // 将分组虚拟 ID 映射为真实 UUID
  const groupIds = groupKeys
    .map(key => {
      const code = key.replace('__group__', '')
      return groupList.value.find(g => g.code === code)?.id
    })
    .filter(Boolean) as string[]

  const parts: string[] = []
  if (groupIds.length) {
    parts.push(`${groupIds.length} 个分组`)
  }
  if (permissionKeys.length) {
    parts.push(`${permissionKeys.length} 个权限`)
  }

  const totalCount = groupIds.length + permissionKeys.length

  ElMessageBox.confirm(
    `确认删除已选中的 ${parts.join(' + ')}（共 ${totalCount} 项）吗？`,
    '批量删除确认',
    {
      type: 'warning',
      confirmButtonText: '确认删除',
      cancelButtonText: '取消'
    }
  )
    .then(async () => {
      const tasks: Promise<unknown>[] = []

      if (groupIds.length) {
        tasks.push(batchDeletePermissionGroups(groupIds))
      }
      if (permissionKeys.length) {
        tasks.push(batchDeletePermissionResources(permissionKeys))
      }

      await Promise.all(tasks)

      const nextTotal = Math.max(0, pagination.total - totalCount)
      const maxPage = Math.max(1, Math.ceil(nextTotal / pagination.pageSize))
      pagination.page = Math.min(pagination.page, maxPage)
      selectedRowKeys.value = []

      Message.success(`已删除 ${totalCount} 项`)
      await Promise.all([loadGroupList(), refreshPermissionResources(), refreshSubjects()])
    })
    .catch(err => {
      console.error('Batch Delete Error:', err)
    })
}

const statusTagConfigMap = {
  enabled: { label: '启用', type: 'success' },
  disabled: { label: '禁用', type: 'info' }
} as const

const permissionTypeTagConfigMap = {
  api: { label: '接口', type: 'danger' },
  button: { label: '按钮', type: 'info' }
} as const

const getPermissionNodeTagInfo = (data: unknown) => {
  const node = data as PermissionResourceNode
  // 虚拟分组节点显示"分组"标签
  if (node.id.startsWith('__group__')) {
    return { label: '分组', type: 'success' as const }
  }
  return permissionTypeTagConfigMap[node.type || 'api']
}

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
        onDelete: deletePermission,
        onEditGroup: openEditGroupDialog,
        onDeleteGroup: deleteGroup
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
      key: 'add-group',
      label: '新增分组',
      icon: FolderAdd,
      size: 'small',
      color: 'var(--c-info)',
      permission: PERMISSION_PERMISSION_CODES.CREATE,
      disabled: !canCreatePermission.value,
      onClick: openGroupDialog
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
  void Promise.all([getPermissionResources(), refreshSubjects(), loadGroupList()])
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
            collapsible
            settings-key="permission-filter"
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
            :group-list="groupList"
            @submit="submitPermissionDialog"
          />

          <PermissionGroupFormDialog
            v-model:visible="groupDialogVisible"
            :submitting="groupDialogSubmitting"
            :submit-permission="PERMISSION_PERMISSION_CODES.CREATE"
            :group-list="groupList"
            @submit="submitGroupDialog"
          />

          <PermissionGroupFormDialog
            v-model:visible="groupEditVisible"
            mode="edit"
            :submitting="groupEditSubmitting"
            :submit-permission="PERMISSION_PERMISSION_CODES.UPDATE"
            :group-list="groupList"
            :initial-value="editingGroupFormModel"
            @submit="submitEditGroupDialog"
          />
        </div>
      </el-tab-pane>

      <el-tab-pane label="权限授权" name="grant">
        <SystemGrantPane
          v-model:subject-keyword="subjectKeyword"
          v-model:checked-keys="checkedPermissionKeys"
          :subjects="filteredSubjects"
          :selected-subject-id="selectedSubjectId"
          :role-label-map="roleLabelMap"
          :tree-data="permissionTreeData"
          :subject-name="selectedSubject?.nickname || selectedSubject?.username || ''"
          :saving="saving"
          tree-title="权限资源树"
          summary-unit-text="项权限"
          :grant-permission-code="PERMISSION_PERMISSION_CODES.GRANT"
          @select="selectSubject"
          @check-all="checkAllPermissions"
          @clear-all="clearAllPermissions"
          @reset="resetCurrentSubjectGrant"
          @save="saveCurrentSubjectGrant"
        >
          <template #node="{ data }">
            <ResourceTreeNodeRow
              :name="(data as PermissionResourceNode).name"
              :tag-label="getPermissionNodeTagInfo(data).label"
              :tag-type="getPermissionNodeTagInfo(data).type"
              :descriptor="(data as PermissionResourceNode).permissionCode || ''"
            />
          </template>
        </SystemGrantPane>
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
</style>
