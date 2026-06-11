<script setup lang="ts">
import { computed, h, ref, onMounted } from 'vue'
import { CirclePlus, Delete } from '@element-plus/icons-vue'
import { ElTag } from 'element-plus'
import CommonTableFilter from '@/components/common/CommonTableFilter.vue'
import CommonTable, {
  type CommonTableColumn,
  type CommonTableRowReorderPayload
} from '@/components/common/CommonTable.vue'
import CommonTableToolbar, {
  type CommonTableToolbarAction
} from '@/components/common/CommonTableToolbar.vue'
import {
  addUser,
  batchDeleteUsers,
  deleteUserById,
  updateUser as updateUserApi,
  updateUserWithFormData
} from '@/api/user'
import type {
  UserCreateParams,
  UserFormModel,
  UserFormSubmitPayload,
  UserInfo,
  UserStatus,
  UserView
} from '@/types/user'
import { USER_PERMISSION_CODES } from '@/constants/permission'
import { Message } from '@/utils/message'
import { useUserStore } from '@/stores/user'
import { useContentRefresh } from '@/composables/useContentRefresh'
import { useUserPermissions } from './composables/useUserPermissions'
import { useUserListQuery } from './composables/useUserListQuery'
import { UserActionCell, UserFormDialog, UserIdentityCell } from './CompsExport'

// 角色选项
const roleOptions: { label: string; value: UserFormModel['role'] }[] = [
  { label: '超级管理员', value: 'super' },
  { label: '管理员', value: 'admin' },
  { label: '运营', value: 'operator' },
  { label: '普通用户', value: 'user' }
]

const roleLabelMap: Record<string, string> = roleOptions.reduce(
  (acc, cur) => ({ ...acc, [cur.value]: cur.label }),
  {}
)

// 状态选项
const statusOptions: { label: string; value: UserStatus }[] = [
  { label: '启用', value: 'enabled' },
  { label: '禁用', value: 'disabled' }
]

const selectedRowKeys = ref<Array<string | number>>([])
const isTableRowSortable = ref(false)
const dialogVisible = ref(false)
const dialogSubmitting = ref(false)
const dialogMode = ref<'add' | 'edit'>('add')
const editingUserId = ref('')
const userStore = useUserStore()
const submitPayload = ref<UserFormSubmitPayload | null>(null)

const {
  canCreateUser,
  canUpdateUser,
  canDeleteUser,
  isSelfSelectedForBatchDelete,
  isSelfTargetUser
} = useUserPermissions(selectedRowKeys)

const normalizeUser = (user: UserView): UserInfo => {
  return {
    id: user.id,
    username: user.username,
    nickname: user.nickname || user.username,
    email: user.email,
    avatarUrl: user.avatarUrl,
    role: user.role,
    status: user.isActive ? 'enabled' : 'disabled',
    createTime: user.createTime,
    updateTime: user.updateTime,
    lastLoginAt: user.lastLoginAt
  }
}

const {
  loading,
  tableData,
  query,
  filterFields,
  pagination,
  getUsers,
  searchUsers,
  resetFilters,
  refreshPageData
} = useUserListQuery({
  roleOptions,
  statusOptions,
  selectedRowKeys,
  normalizeUser
})

const createInitialFormModel = (): UserFormModel => ({
  username: '',
  email: '',
  password: '',
  nickname: '',
  avatarUrl: '',
  role: 'user',
  status: 'enabled'
})

const formModel = ref<UserFormModel>(createInitialFormModel())

const dialogTitle = computed(() => {
  return dialogMode.value === 'add' ? '新增用户' : '编辑用户'
})

const openAddUserDialog = () => {
  if (!canCreateUser.value) {
    return
  }

  dialogMode.value = 'add'
  editingUserId.value = ''
  formModel.value = createInitialFormModel()
  dialogVisible.value = true
}

const openEditUserDialog = (row: UserInfo) => {
  if (!canUpdateUser.value) {
    return
  }

  dialogMode.value = 'edit'
  editingUserId.value = row.id
  formModel.value = {
    username: row.username,
    email: row.email,
    password: '',
    nickname: row.nickname,
    avatarUrl: row.avatarUrl || '',
    role: row.role as UserFormModel['role'],
    status: row.status
  }
  dialogVisible.value = true
}

const closeUserDialog = () => {
  dialogVisible.value = false
  formModel.value = createInitialFormModel()
}

const buildCreatePayload = (): UserCreateParams => {
  return {
    username: formModel.value.username.trim(),
    email: formModel.value.email.trim(),
    password: formModel.value.password,
    nickname: formModel.value.nickname.trim(),
    avatarUrl: formModel.value.avatarUrl.trim() || undefined,
    role: formModel.value.role,
    isActive: formModel.value.status === 'enabled'
  }
}

const submitUserDialog = async () => {
  if (dialogMode.value === 'add' && !canCreateUser.value) {
    return
  }

  if (dialogMode.value === 'edit' && !canUpdateUser.value) {
    return
  }

  dialogSubmitting.value = true

  try {
    if (dialogMode.value === 'add') {
      await addUser(buildCreatePayload())
      Message.success('用户创建成功')
    } else {
      const payload = submitPayload.value
      if (!payload) {
        Message.error('提交数据缺失，请重试')
        return
      }

      const requestData = new FormData()
      requestData.append('email', payload.email.trim())
      requestData.append('nickname', payload.nickname.trim())
      requestData.append('role', payload.role)
      requestData.append('isActive', String(payload.status === 'enabled'))

      if (payload.password) {
        requestData.append('password', payload.password)
      }

      if (payload.avatarFile) {
        requestData.append('avatar', payload.avatarFile)
      } else if (payload.removeAvatar) {
        requestData.append('avatarUrl', '')
      }

      const updatedUser = await updateUserWithFormData(editingUserId.value, requestData)

      if (userStore.userInfo?.id === updatedUser.id) {
        userStore.setUserInfo({
          ...userStore.userInfo,
          email: updatedUser.email,
          nickname: updatedUser.nickname || undefined,
          avatarUrl: updatedUser.avatarUrl || undefined,
          role: updatedUser.role,
          permissions: userStore.userInfo.permissions || []
        })
      }

      Message.success('用户更新成功')
    }

    closeUserDialog()
    submitPayload.value = null
    selectedRowKeys.value = []
    await getUsers()
  } finally {
    dialogSubmitting.value = false
  }
}

const onDialogSubmit = async (payload: UserFormSubmitPayload) => {
  formModel.value = payload
  submitPayload.value = payload
  await submitUserDialog()
}

// 行操作
const editUser = (row: UserInfo) => {
  openEditUserDialog(row)
}

const toggleUserStatus = async (row: UserInfo) => {
  if (isSelfTargetUser(row)) {
    return
  }

  if (!canUpdateUser.value) {
    return
  }

  const nextStatus: UserStatus = row.status === 'enabled' ? 'disabled' : 'enabled'

  await updateUserApi(row.id, {
    isActive: nextStatus === 'enabled'
  })

  Message.success(`已${nextStatus === 'enabled' ? '启用' : '禁用'}用户：${row.nickname}`)
  await getUsers()
}

const deleteUser = (row: UserInfo) => {
  if (isSelfTargetUser(row)) {
    return
  }

  if (!canDeleteUser.value) {
    return
  }

  ElMessageBox.confirm(`确认删除用户「${row.nickname}」吗？`, '删除确认', {
    type: 'warning',
    confirmButtonText: '确认删除',
    cancelButtonText: '取消'
  })
    .then(async () => {
      await deleteUserById(row.id)

      const nextTotal = Math.max(0, pagination.total - 1)
      const maxPage = Math.max(1, Math.ceil(nextTotal / pagination.pageSize))
      pagination.page = Math.min(pagination.page, maxPage)

      Message.success('删除成功')
      await getUsers()
    })
    .catch(err => {
      console.error('Delete User Error:', err)
    })
}

const createUser = () => {
  openAddUserDialog()
}

const deleteSelectedUsers = () => {
  if (isSelfSelectedForBatchDelete.value) {
    return
  }

  if (!canDeleteUser.value) {
    return
  }

  if (!selectedRowKeys.value.length) {
    return
  }

  const deleteCount = selectedRowKeys.value.length

  ElMessageBox.confirm(`确认删除已选中的 ${deleteCount} 个用户吗？`, '批量删除确认', {
    type: 'warning',
    confirmButtonText: '确认删除',
    cancelButtonText: '取消'
  })
    .then(async () => {
      await batchDeleteUsers(selectedRowKeys.value.map(String))

      const nextTotal = Math.max(0, pagination.total - deleteCount)
      const maxPage = Math.max(1, Math.ceil(nextTotal / pagination.pageSize))
      pagination.page = Math.min(pagination.page, maxPage)
      selectedRowKeys.value = []

      Message.success(`已删除 ${deleteCount} 个用户`)
      await getUsers()
    })
    .catch(err => {
      console.error('Batch Delete Error:', err)
    })
}

const reorderCurrentPageUsers = (payload: CommonTableRowReorderPayload) => {
  const reorderedRows = payload.currentPageData.map(row => row as unknown as UserInfo)
  const reorderedIdSet = new Set(reorderedRows.map(row => row.id))
  let nextIndex = 0

  tableData.value = tableData.value.map(user => {
    if (!reorderedIdSet.has(user.id)) {
      return user
    }

    const nextRow = reorderedRows[nextIndex]
    nextIndex += 1

    return nextRow || user
  })
}

const toolbarActions = computed<CommonTableToolbarAction[]>(() => {
  return [
    {
      key: 'create',
      label: '新增',
      permission: USER_PERMISSION_CODES.CREATE,
      icon: CirclePlus,
      size: 'small',
      color: 'var(--c-info)',
      disabled: !canCreateUser.value,
      onClick: createUser
    },
    {
      key: 'batch-delete',
      label: '批量删除',
      permission: USER_PERMISSION_CODES.DELETE,
      icon: Delete,
      type: 'danger',
      size: 'small',
      disabled:
        !canDeleteUser.value ||
        selectedRowKeys.value.length === 0 ||
        isSelfSelectedForBatchDelete.value,
      onClick: deleteSelectedUsers
    }
  ]
})

const toolbarSummaryText = computed(() => {
  const selected = selectedRowKeys.value.length
  const INFO = selected > 0 ? `选中 ${selected} 项` : ''

  return INFO
})

const toUserRow = (rowData: Record<string, unknown>) => rowData as unknown as UserInfo

const roleTagTypeMap = {
  super: 'danger',
  admin: 'warning',
  operator: 'success',
  user: 'info'
} as const

const statusTagConfigMap = {
  enabled: { label: '启用', type: 'success' },
  disabled: { label: '禁用', type: 'info' }
} as const

const baseColumns: CommonTableColumn[] = [
  {
    key: 'index',
    title: '序号',
    width: 70,
    align: 'center',
    cellRenderer: ({ rowIndex }) =>
      h('span', null, String((pagination.page - 1) * pagination.pageSize + rowIndex + 1))
  },
  {
    key: 'username',
    dataKey: 'username',
    title: '用户',
    minWidth: 220,
    cellRenderer: ({ rowData }) => h(UserIdentityCell, { row: toUserRow(rowData) })
  },
  { key: 'email', dataKey: 'email', title: '邮箱', minWidth: 220 },
  {
    key: 'role',
    dataKey: 'role',
    title: '角色',
    width: 130,
    align: 'center',
    cellRenderer: ({ rowData }) => {
      const role = toUserRow(rowData).role
      const tagType = roleTagTypeMap[role as keyof typeof roleTagTypeMap] || 'info'
      return h(ElTag, { type: tagType, effect: 'light' }, () => roleLabelMap[role] || role)
    }
  },
  {
    key: 'status',
    dataKey: 'status',
    title: '状态',
    width: 110,
    align: 'center',
    cellRenderer: ({ rowData }) => {
      const config = statusTagConfigMap[toUserRow(rowData).status]
      return h(ElTag, { type: config.type, effect: 'light' }, () => config.label)
    }
  },
  { key: 'createTime', dataKey: 'createTime', title: '创建时间', minWidth: 180 },
  {
    key: 'actions',
    title: '操作',
    width: 200,
    align: 'center',
    fixed: 'right',
    cellRenderer: ({ rowData }) => {
      const row = toUserRow(rowData)
      const isSelfRow = isSelfTargetUser(row)

      return h(UserActionCell, {
        row,
        canEdit: canUpdateUser.value,
        canToggleStatus: canUpdateUser.value && !isSelfRow,
        canDelete: canDeleteUser.value && !isSelfRow,
        toggleStatusDisabledReason: isSelfRow ? '不能禁用当前登录用户' : '',
        deleteDisabledReason: isSelfRow ? '不能删除当前登录用户' : '',
        onEdit: editUser,
        onToggleStatus: toggleUserStatus,
        onDelete: deleteUser
      })
    }
  }
]

onMounted(() => {
  void getUsers()
})

useContentRefresh(() => getUsers())
</script>

<template>
  <div class="user-info-page">
    <CommonTableFilter
      v-model="query"
      :fields="filterFields"
      :loading="loading"
      @search="searchUsers"
      @reset="resetFilters"
    />
    <CommonTable
      v-model:page="pagination.page"
      v-model:page-size="pagination.pageSize"
      v-model:selected-row-keys="selectedRowKeys"
      v-model:row-sortable="isTableRowSortable"
      :columns="baseColumns"
      :data="tableData"
      :loading="loading"
      :pagination="pagination"
      settings-key="user-info-table"
      show-settings
      configurable-row-sortable
      configurable-selection
      configurable-columns
      selectable
      @page-change="refreshPageData"
      @row-reorder="reorderCurrentPageUsers"
    >
      <template #header>
        <CommonTableToolbar :actions="toolbarActions">
          <template #summary>
            <span class="user-toolbar-summary">{{ toolbarSummaryText }}</span>
          </template>
        </CommonTableToolbar>
      </template>
    </CommonTable>

    <UserFormDialog
      v-model:visible="dialogVisible"
      :mode="dialogMode"
      :title="dialogTitle"
      :submitting="dialogSubmitting"
      :submit-permission="
        dialogMode === 'add' ? USER_PERMISSION_CODES.CREATE : USER_PERMISSION_CODES.UPDATE
      "
      :initial-value="formModel"
      :role-options="roleOptions"
      :status-options="statusOptions"
      @submit="onDialogSubmit"
    />
  </div>
</template>

<style scoped lang="scss">
.user-info-page {
  display: flex;
  flex-direction: column;
  gap: var(--layout-gap);
  height: 100%;
  min-height: 0;
}

.user-toolbar-summary {
  color: var(--t-secondary);
  font-size: var(--font-size-base);
}
</style>
