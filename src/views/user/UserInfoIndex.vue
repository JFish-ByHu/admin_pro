<script setup lang="ts">
import { computed, h, reactive, ref, watchEffect } from 'vue'
import CommonFilter, { type FilterField } from '@/components/common/CommonFilter.vue'
import CommonTable, {
  type CommonTableColumn,
  type TablePagination
} from '@/components/common/CommonTable.vue'
import type { UserInfo, UserQuery, UserStatus } from '@/types/user'
import { Message } from '@/utils/message'
import { UserActionCell, UserIdentityCell, UserRoleTag, UserStatusTag } from './CompsExport'

// 角色选项
const roleOptions = [
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

// 生成 mock 用户数据
const firstNames = ['赵', '钱', '孙', '李', '周', '吴', '郑', '王', '冯', '陈']
const lastNames = ['伟', '芳', '娜', '秀英', '敏', '静', '丽', '强', '磊', '军']
const generateMockUsers = (count: number): UserInfo[] => {
  const list: UserInfo[] = []
  for (let i = 1; i <= count; i++) {
    const fn = firstNames[i % firstNames.length]
    const ln = lastNames[i % lastNames.length]
    const roleItem = roleOptions[i % roleOptions.length]
    const role = roleItem ? roleItem.value : 'user'
    const status: UserStatus = i % 5 === 0 ? 'disabled' : 'enabled'
    const month = String((i % 12) + 1).padStart(2, '0')
    const day = String((i % 28) + 1).padStart(2, '0')
    list.push({
      id: `U${String(i).padStart(4, '0')}`,
      username: `user_${String(i).padStart(3, '0')}`,
      nickname: `${fn}${ln}`,
      email: `user${i}@example.com`,
      phone: `13${String(100000000 + i).slice(0, 9)}`,
      role,
      status,
      createTime: `2024-${month}-${day} 10:${String(i % 60).padStart(2, '0')}:00`
    })
  }
  return list
}

const allUsers = ref<UserInfo[]>(generateMockUsers(86))

// 筛选条件
const query = reactive<UserQuery>({
  keyword: '',
  role: '',
  status: ''
})

// 筛选字段配置
const filterFields: FilterField[] = [
  { prop: 'keyword', label: '关键词', type: 'input', placeholder: '用户名 / 昵称 / 邮箱' },
  { prop: 'role', label: '角色', type: 'select', options: roleOptions },
  { prop: 'status', label: '状态', type: 'select', options: statusOptions }
]

// 加载状态
const loading = ref(false)
const selectedRowKeys = ref<Array<string | number>>([])

// 分页
const pagination = reactive<TablePagination>({
  page: 1,
  pageSize: 20,
  total: 0
})

// 已应用的筛选条件（点击查询后生效）
const appliedQuery = ref<UserQuery>({ ...query })

// 按筛选条件过滤后的完整列表
const filteredUsers = computed(() => {
  const { keyword, role, status } = appliedQuery.value
  return allUsers.value.filter(user => {
    const matchKeyword =
      !keyword ||
      user.username.includes(keyword) ||
      user.nickname.includes(keyword) ||
      user.email.includes(keyword)
    const matchRole = !role || user.role === role
    const matchStatus = !status || user.status === status
    return matchKeyword && matchRole && matchStatus
  })
})

// 同步总条数
watchEffect(() => {
  pagination.total = filteredUsers.value.length
})

// 当前页数据
const tableData = computed(() => {
  const start = (pagination.page - 1) * pagination.pageSize
  return filteredUsers.value.slice(start, start + pagination.pageSize)
})

// 模拟请求延迟
const mockRequest = () => {
  loading.value = true
  setTimeout(() => {
    loading.value = false
  }, 400)
}

// 查询
const handleSearch = () => {
  pagination.page = 1
  appliedQuery.value = { ...query }
  mockRequest()
}

// 重置
const handleReset = () => {
  pagination.page = 1
  appliedQuery.value = { ...query }
  mockRequest()
}

// 翻页
const handlePageChange = () => mockRequest()

// 行操作
const handleEdit = (row: UserInfo) => {
  Message.info(`编辑用户：${row.nickname}（${row.username}）`)
}

const handleToggleStatus = (row: UserInfo) => {
  const target = allUsers.value.find(item => item.id === row.id)
  if (target) {
    target.status = target.status === 'enabled' ? 'disabled' : 'enabled'
    Message.success(`已${target.status === 'enabled' ? '启用' : '禁用'}用户：${target.nickname}`)
  }
}

const handleDelete = (row: UserInfo) => {
  ElMessageBox.confirm(`确认删除用户「${row.nickname}」吗？`, '删除确认', {
    type: 'warning',
    confirmButtonText: '确认删除',
    cancelButtonText: '取消'
  })
    .then(() => {
      allUsers.value = allUsers.value.filter(item => item.id !== row.id)
      Message.success('删除成功')
    })
    .catch(() => {})
}

const toUserRow = (rowData: Record<string, unknown>) => rowData as unknown as UserInfo
// 普通表格列配置
const columns: CommonTableColumn[] = [
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
  { key: 'phone', dataKey: 'phone', title: '手机号', minWidth: 160 },
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
        onEdit: handleEdit,
        onToggleStatus: handleToggleStatus,
        onDelete: handleDelete
      })
  }
]
</script>

<template>
  <div class="user-info-page">
    <CommonFilter
      v-model="query"
      :fields="filterFields"
      :loading="loading"
      @search="handleSearch"
      @reset="handleReset"
    />
    <CommonTable
      v-model:page="pagination.page"
      v-model:page-size="pagination.pageSize"
      v-model:selected-row-keys="selectedRowKeys"
      :columns="columns"
      :data="tableData"
      :loading="loading"
      :pagination="pagination"
      selectable
      @page-change="handlePageChange"
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
</style>
