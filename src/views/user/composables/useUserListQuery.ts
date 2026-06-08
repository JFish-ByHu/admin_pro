import { reactive, ref, type Ref } from 'vue'
import { getUserList } from '@/api/user'
import type { UserInfo, UserQuery, UserStatus, UserView } from '@/types/user'
import type { TableFilterField } from '@/components/common/CommonTableFilter.vue'
import type { TablePagination } from '@/components/common/CommonTable.vue'

interface SelectOption {
  label: string
  value: string
}

interface UseUserListQueryOptions {
  roleOptions: SelectOption[]
  statusOptions: { label: string; value: UserStatus }[]
  selectedRowKeys: Ref<Array<string | number>>
  normalizeUser: (user: UserView) => UserInfo
}

export const useUserListQuery = ({
  roleOptions,
  statusOptions,
  selectedRowKeys,
  normalizeUser
}: UseUserListQueryOptions) => {
  const loading = ref(false)
  const tableData = ref<UserInfo[]>([])

  const query = ref<UserQuery>({
    keyword: '',
    role: '',
    status: ''
  })

  const filterFields: TableFilterField[] = [
    { prop: 'keyword', label: '关键词', type: 'input', placeholder: '用户名 / 昵称 / 邮箱' },
    { prop: 'role', label: '角色', type: 'select', options: roleOptions },
    { prop: 'status', label: '状态', type: 'select', options: statusOptions }
  ]

  const pagination = reactive<TablePagination>({
    page: 1,
    pageSize: 20,
    total: 0
  })

  const getUsers = async () => {
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

  const searchUsers = async () => {
    pagination.page = 1
    await getUsers()
  }

  const resetFilters = async () => {
    pagination.page = 1
    await getUsers()
  }

  const refreshPageData = async () => {
    await getUsers()
  }

  return {
    loading,
    tableData,
    query,
    filterFields,
    pagination,
    getUsers,
    searchUsers,
    resetFilters,
    refreshPageData
  }
}
