<script setup lang="ts">
import { computed, h, reactive, ref, onMounted } from 'vue'
import { CirclePlus, Delete } from '@element-plus/icons-vue'
import CommonTableFilter, { type TableFilterField } from '@/components/common/CommonTableFilter.vue'
import CommonTable, {
  type CommonTableColumn,
  type CommonTableRowReorderPayload,
  type TablePagination
} from '@/components/common/CommonTable.vue'
import CommonTableToolbar, {
  type CommonTableToolbarAction
} from '@/components/common/CommonTableToolbar.vue'
import {
  addUser,
  batchDeleteUsers,
  deleteUserById,
  getUserList,
  updateUser as updateUserApi
} from '@/api/user'
import type {
  UserCreateParams,
  UserFormModel,
  UserInfo,
  UserQuery,
  UserStatus,
  UserView
} from '@/types/user'
import { Message } from '@/utils/message'
import {
  UserActionCell,
  UserFormDialog,
  UserIdentityCell,
  UserRoleTag,
  UserStatusTag
} from './CompsExport'

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

// 筛选条件
const query = ref<UserQuery>({
  keyword: '',
  role: '',
  status: ''
})

// 筛选字段配置
const filterFields: TableFilterField[] = [
  { prop: 'keyword', label: '关键词', type: 'input', placeholder: '用户名 / 昵称 / 邮箱' },
  { prop: 'role', label: '角色', type: 'select', options: roleOptions },
  { prop: 'status', label: '状态', type: 'select', options: statusOptions }
]

// 加载状态
const loading = ref(false)
const selectedRowKeys = ref<Array<string | number>>([])
const isTableRowSortable = ref(false)
const tableData = ref<UserInfo[]>([])
const dialogVisible = ref(false)
const dialogSubmitting = ref(false)
const dialogMode = ref<'add' | 'edit'>('add')
const editingUserId = ref('')

// 分页
const pagination = reactive<TablePagination>({
  page: 1,
  pageSize: 20,
  total: 0
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

const fetchUsers = async () => {
  loading.value = true

  try {
    const result = await getUserList({
      keyword: query.value.keyword || undefined,
      role: query.value.role || undefined,
      status: query.value.status || undefined,
      page: pagination.page,
      pageSize: pagination.pageSize
    })

    tableData.value = result.list.map(normalizeUser)
    selectedRowKeys.value = selectedRowKeys.value.filter(key =>
      tableData.value.some(row => row.id === key)
    )
    pagination.total = result.total
    pagination.page = result.page
    pagination.pageSize = result.pageSize
  } finally {
    loading.value = false
  }
}

// 查询
const searchUsers = async () => {
  pagination.page = 1
  await fetchUsers()
}

// 重置
const resetFilters = async () => {
  pagination.page = 1
  await fetchUsers()
}

// 翻页
const refreshPageData = async () => {
  await fetchUsers()
}

const openAddDialog = () => {
  dialogMode.value = 'add'
  editingUserId.value = ''
  formModel.value = createInitialFormModel()
  dialogVisible.value = true
}

const openEditDialog = (row: UserInfo) => {
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

const closeDialog = () => {
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

const submitDialog = async () => {
  dialogSubmitting.value = true

  try {
    if (dialogMode.value === 'add') {
      await addUser(buildCreatePayload())
      Message.success('用户创建成功')
    } else {
      await updateUserApi(editingUserId.value, {
        email: formModel.value.email.trim(),
        password: formModel.value.password || undefined,
        nickname: formModel.value.nickname.trim(),
        avatarUrl: formModel.value.avatarUrl.trim() || undefined,
        role: formModel.value.role,
        isActive: formModel.value.status === 'enabled'
      })
      Message.success('用户更新成功')
    }

    closeDialog()
    selectedRowKeys.value = []
    await fetchUsers()
  } finally {
    dialogSubmitting.value = false
  }
}

const onDialogSubmit = async (payload: UserFormModel) => {
  formModel.value = payload
  await submitDialog()
}

// 行操作
const editUser = (row: UserInfo) => {
  openEditDialog(row)
}

const toggleUserStatus = async (row: UserInfo) => {
  const nextStatus: UserStatus = row.status === 'enabled' ? 'disabled' : 'enabled'

  await updateUserApi(row.id, {
    isActive: nextStatus === 'enabled'
  })

  Message.success(`已${nextStatus === 'enabled' ? '启用' : '禁用'}用户：${row.nickname}`)
  await fetchUsers()
}

const deleteUser = (row: UserInfo) => {
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
      await fetchUsers()
    })
    .catch(() => {})
}

const createUser = () => {
  openAddDialog()
}

const deleteSelectedUsers = () => {
  if (!selectedRowKeys.value.length) {
    Message.warning('请先选择要删除的用户')
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
      await fetchUsers()
    })
    .catch(() => {})
}

const reorderCurrentPageUsers = (payload: CommonTableRowReorderPayload) => {
  const reorderedRows = payload.currentPageData.map(row => toUserRow(row))
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
      icon: CirclePlus,
      size: 'small',
      color: 'var(--c-info)',
      onClick: createUser
    },
    {
      key: 'batch-delete',
      label: '批量删除',
      icon: Delete,
      type: 'danger',
      size: 'small',
      disabled: selectedRowKeys.value.length === 0,
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
// 普通表格列配置
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
    cellRenderer: ({ rowData }) => h(UserRoleTag, { role: toUserRow(rowData).role, roleLabelMap })
  },
  {
    key: 'status',
    dataKey: 'status',
    title: '状态',
    width: 110,
    align: 'center',
    cellRenderer: ({ rowData }) => h(UserStatusTag, { status: toUserRow(rowData).status })
  },
  { key: 'createTime', dataKey: 'createTime', title: '创建时间', minWidth: 180 },
  {
    key: 'actions',
    title: '操作',
    width: 200,
    align: 'center',
    fixed: 'right',
    cellRenderer: ({ rowData }) =>
      h(UserActionCell, {
        row: toUserRow(rowData),
        onEdit: editUser,
        onToggleStatus: toggleUserStatus,
        onDelete: deleteUser
      })
  }
]

onMounted(() => {
  void fetchUsers()
})
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
