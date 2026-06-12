<script setup lang="ts">
import { computed, h, onMounted, ref } from 'vue'
import { CirclePlus, Delete, Refresh } from '@element-plus/icons-vue'
import { ElTag } from 'element-plus'
import CommonTableFilter from '@/components/common/CommonTableFilter.vue'
import CommonTable, { type CommonTableColumn } from '@/components/common/CommonTable.vue'
import CommonTableToolbar, {
  type CommonTableToolbarAction
} from '@/components/common/CommonTableToolbar.vue'
import { addRole, batchDeleteRoles, deleteRoleById, updateRole } from '@/api/role'
import { ROLE_PERMISSION_CODES } from '@/constants/permission'
import { Message } from '@/utils/message'
import { useUserStore } from '@/stores/user'
import { useContentRefresh } from '@/composables/useContentRefresh'
import type { RoleFormModel, RoleInfo, RoleStatus, RoleView } from '@/types/role'
import { useRoleListQuery } from './composables/useRoleListQuery'
import { RoleActionCell, RoleFormDialog, RoleUserGrantDialog } from './CompsExport'

const selectedRowKeys = ref<Array<string | number>>([])
const dialogVisible = ref(false)
const dialogSubmitting = ref(false)
const dialogMode = ref<'add' | 'edit'>('add')
const editingRoleId = ref('')
const grantDialogVisible = ref(false)
const grantRole = ref<RoleInfo | null>(null)

const userStore = useUserStore()

const normalizeRole = (role: RoleView): RoleInfo => {
  return {
    id: role.id,
    code: role.code,
    name: role.name,
    description: role.description || '',
    isSystem: role.isSystem,
    status: role.isActive ? 'enabled' : 'disabled',
    permissionCount: role.permissionCount,
    menuCount: role.menuCount,
    userCount: role.userCount,
    createTime: role.createTime,
    updateTime: role.updateTime
  }
}

const {
  loading,
  query,
  filterFields,
  pagination,
  tableData,
  getRoles,
  searchRoles,
  resetRoleFilters,
  refreshRoleList
} = useRoleListQuery({
  selectedRowKeys,
  normalizeRole
})

const hasPermission = (permissionCode: string) => {
  return userStore.permissions.includes(permissionCode)
}

const canCreateRole = computed(() => hasPermission(ROLE_PERMISSION_CODES.CREATE))
const canUpdateRole = computed(() => hasPermission(ROLE_PERMISSION_CODES.UPDATE))
const canDeleteRole = computed(() => hasPermission(ROLE_PERMISSION_CODES.DELETE))

const dialogTitle = computed(() => {
  return dialogMode.value === 'add' ? '新增角色' : '编辑角色'
})

const roleStatusTagConfigMap = {
  enabled: { label: '启用', type: 'success' },
  disabled: { label: '禁用', type: 'info' }
} as const

const systemRoleTagConfigMap = {
  true: { label: '系统内置', type: 'warning' },
  false: { label: '自定义', type: 'success' }
} as const

const createInitialFormModel = (): RoleFormModel => ({
  code: '',
  name: '',
  description: '',
  status: 'enabled'
})

const formModel = ref<RoleFormModel>(createInitialFormModel())

const openAddRoleDialog = () => {
  if (!canCreateRole.value) {
    return
  }

  dialogMode.value = 'add'
  editingRoleId.value = ''
  formModel.value = createInitialFormModel()
  dialogVisible.value = true
}

const openEditRoleDialog = (row: RoleInfo) => {
  if (!canUpdateRole.value) {
    return
  }

  dialogMode.value = 'edit'
  editingRoleId.value = row.id
  formModel.value = {
    code: row.code,
    name: row.name,
    description: row.description,
    status: row.status
  }
  dialogVisible.value = true
}

const closeRoleDialog = () => {
  dialogVisible.value = false
  formModel.value = createInitialFormModel()
}

const submitRoleDialog = async (payload: RoleFormModel) => {
  if (dialogMode.value === 'add' && !canCreateRole.value) {
    return
  }

  if (dialogMode.value === 'edit' && !canUpdateRole.value) {
    return
  }

  dialogSubmitting.value = true

  try {
    if (dialogMode.value === 'add') {
      await addRole({
        code: payload.code,
        name: payload.name,
        description: payload.description || undefined,
        isActive: payload.status === 'enabled'
      })
      Message.success('角色创建成功')
    } else {
      await updateRole(editingRoleId.value, {
        name: payload.name,
        description: payload.description || undefined,
        isActive: payload.status === 'enabled'
      })
      Message.success('角色更新成功')
    }

    closeRoleDialog()
    selectedRowKeys.value = []
    await getRoles()
  } finally {
    dialogSubmitting.value = false
  }
}

const toggleRoleStatus = async (row: RoleInfo) => {
  if (!canUpdateRole.value) {
    return
  }

  const nextStatus: RoleStatus = row.status === 'enabled' ? 'disabled' : 'enabled'

  await updateRole(row.id, {
    isActive: nextStatus === 'enabled'
  })

  Message.success(`已${nextStatus === 'enabled' ? '启用' : '禁用'}角色：${row.name}`)
  await getRoles()
}

const deleteRole = (row: RoleInfo) => {
  if (!canDeleteRole.value) {
    return
  }

  if (row.isSystem) {
    Message.warning('系统内置角色不允许删除')
    return
  }

  if (row.userCount > 0) {
    Message.warning('角色下仍存在用户绑定，不能删除')
    return
  }

  ElMessageBox.confirm(`确认删除角色「${row.name}」吗？`, '删除确认', {
    type: 'warning',
    confirmButtonText: '确认删除',
    cancelButtonText: '取消'
  })
    .then(async () => {
      await deleteRoleById(row.id)

      const nextTotal = Math.max(0, pagination.total - 1)
      const maxPage = Math.max(1, Math.ceil(nextTotal / pagination.pageSize))
      pagination.page = Math.min(pagination.page, maxPage)

      Message.success('删除成功')
      await getRoles()
    })
    .catch(err => {
      console.error('Delete Role Error:', err)
    })
}

const deleteSelectedRoles = () => {
  if (!canDeleteRole.value) {
    return
  }

  if (!selectedRowKeys.value.length) {
    return
  }

  const selectedRows = tableData.value.filter(item => selectedRowKeys.value.includes(item.id))

  if (selectedRows.some(item => item.isSystem)) {
    Message.warning('选中项包含系统内置角色，不允许批量删除')
    return
  }

  if (selectedRows.some(item => item.userCount > 0)) {
    Message.warning('选中项中存在已绑定用户的角色，不允许批量删除')
    return
  }

  const deleteCount = selectedRowKeys.value.length

  ElMessageBox.confirm(`确认删除已选中的 ${deleteCount} 个角色吗？`, '批量删除确认', {
    type: 'warning',
    confirmButtonText: '确认删除',
    cancelButtonText: '取消'
  })
    .then(async () => {
      await batchDeleteRoles(selectedRowKeys.value.map(String))

      const nextTotal = Math.max(0, pagination.total - deleteCount)
      const maxPage = Math.max(1, Math.ceil(nextTotal / pagination.pageSize))
      pagination.page = Math.min(pagination.page, maxPage)
      selectedRowKeys.value = []

      Message.success(`已删除 ${deleteCount} 个角色`)
      await getRoles()
    })
    .catch(err => {
      console.error('Batch Delete Role Error:', err)
    })
}

const openUserGrantDialog = (row: RoleInfo) => {
  if (!canUpdateRole.value) {
    return
  }

  grantRole.value = row
  grantDialogVisible.value = true
}

const closeGrantDialog = () => {
  grantDialogVisible.value = false
  grantRole.value = null
}

const getToggleStatusDisabledReason = () => {
  if (!canUpdateRole.value) {
    return '无状态变更权限'
  }

  return ''
}

const getDeleteDisabledReason = (row: RoleInfo) => {
  if (!canDeleteRole.value) {
    return '无删除权限'
  }

  if (row.isSystem) {
    return '系统内置角色不允许删除'
  }

  if (row.userCount > 0) {
    return '角色下存在用户绑定，不能删除'
  }

  return ''
}

const toRoleRow = (rowData: Record<string, unknown>) => rowData as unknown as RoleInfo

const roleColumns: CommonTableColumn[] = [
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
    title: '角色信息',
    minWidth: 260,
    cellRenderer: ({ rowData }) => {
      const row = toRoleRow(rowData)

      return h('div', { class: 'role-name-cell' }, [
        h('span', { class: 'role-name-cell__name' }, row.name),
        h('span', { class: 'role-name-cell__code' }, row.code)
      ])
    }
  },
  {
    key: 'status',
    dataKey: 'status',
    title: '状态',
    width: 110,
    align: 'center',
    cellRenderer: ({ rowData }) => {
      const config = roleStatusTagConfigMap[toRoleRow(rowData).status]
      return h(ElTag, { type: config.type, effect: 'light' }, () => config.label)
    }
  },
  {
    key: 'isSystem',
    dataKey: 'isSystem',
    title: '角色类型',
    width: 120,
    align: 'center',
    cellRenderer: ({ rowData }) => {
      const config = systemRoleTagConfigMap[String(toRoleRow(rowData).isSystem) as 'true' | 'false']
      return h(ElTag, { type: config.type, effect: 'light' }, () => config.label)
    }
  },
  {
    key: 'userCount',
    dataKey: 'userCount',
    title: '用户数',
    width: 90,
    align: 'center'
  },
  {
    key: 'menuCount',
    dataKey: 'menuCount',
    title: '菜单数',
    width: 90,
    align: 'center'
  },
  {
    key: 'permissionCount',
    dataKey: 'permissionCount',
    title: '权限数',
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
    width: 180,
    fixed: 'right',
    align: 'center',
    cellRenderer: ({ rowData }) => {
      const row = toRoleRow(rowData)
      const deleteDisabledReason = getDeleteDisabledReason(row)

      return h(RoleActionCell, {
        row,
        canEdit: canUpdateRole.value,
        canGrantUsers: canUpdateRole.value,
        canToggleStatus: canUpdateRole.value,
        canDelete: !deleteDisabledReason,
        grantUsersDisabledReason: canUpdateRole.value ? '' : '无授权权限',
        toggleStatusDisabledReason: getToggleStatusDisabledReason(),
        deleteDisabledReason,
        onEdit: openEditRoleDialog,
        onGrantUsers: openUserGrantDialog,
        onToggleStatus: toggleRoleStatus,
        onDelete: deleteRole
      })
    }
  }
]

const toolbarActions = computed<CommonTableToolbarAction[]>(() => {
  return [
    {
      key: 'create-role',
      label: '新增角色',
      permission: ROLE_PERMISSION_CODES.CREATE,
      icon: CirclePlus,
      size: 'small',
      color: 'var(--c-info)',
      disabled: !canCreateRole.value,
      onClick: openAddRoleDialog
    },
    {
      key: 'batch-delete-role',
      label: '批量删除',
      permission: ROLE_PERMISSION_CODES.DELETE,
      icon: Delete,
      size: 'small',
      type: 'danger',
      plain: true,
      disabled: !canDeleteRole.value || selectedRowKeys.value.length === 0,
      onClick: deleteSelectedRoles
    },
    {
      key: 'refresh-role',
      label: '刷新',
      permission: ROLE_PERMISSION_CODES.LIST,
      icon: Refresh,
      size: 'small',
      type: 'info',
      plain: true,
      onClick: refreshRoleList
    }
  ]
})

const refreshData = async () => {
  await refreshRoleList()
}

onMounted(() => {
  void getRoles()
})

useContentRefresh(() => refreshData())
</script>

<template>
  <div class="role-management-page">
    <CommonTableFilter
      v-model="query"
      :fields="filterFields"
      :loading="loading"
      @search="searchRoles"
      @reset="resetRoleFilters"
    />

    <CommonTable
      v-model:page="pagination.page"
      v-model:page-size="pagination.pageSize"
      v-model:selected-row-keys="selectedRowKeys"
      :columns="roleColumns"
      :data="tableData"
      :loading="loading"
      :pagination="pagination"
      selectable
      settings-key="role-management-table"
      show-settings
      configurable-selection
      configurable-columns
      @page-change="refreshRoleList"
    >
      <template #header>
        <CommonTableToolbar
          :actions="toolbarActions"
          show-selection-summary
          :selected-count="selectedRowKeys.length"
          empty-text="请选择要操作的角色"
        />
      </template>
    </CommonTable>

    <RoleFormDialog
      v-model:visible="dialogVisible"
      :mode="dialogMode"
      :title="dialogTitle"
      :submitting="dialogSubmitting"
      :submit-permission="
        dialogMode === 'add' ? ROLE_PERMISSION_CODES.CREATE : ROLE_PERMISSION_CODES.UPDATE
      "
      :initial-value="formModel"
      @submit="submitRoleDialog"
    />

    <RoleUserGrantDialog
      v-model:visible="grantDialogVisible"
      :role="grantRole"
      :submit-permission="ROLE_PERMISSION_CODES.UPDATE"
      @saved="refreshRoleList"
      @update:visible="value => (!value ? closeGrantDialog() : undefined)"
    />
  </div>
</template>

<style scoped lang="scss">
.role-management-page {
  display: flex;
  flex-direction: column;
  gap: var(--layout-gap);
  height: 100%;
  min-height: 0;
  overflow: hidden;
}

.role-name-cell {
  display: flex;
  flex-direction: column;
  min-width: 0;
  line-height: 1.35;

  &__name {
    color: var(--t-primary);
    font-size: 13px;
    font-weight: 500;
  }

  &__code {
    color: var(--t-secondary);
    font-size: 12px;
    word-break: break-all;
  }
}
</style>
