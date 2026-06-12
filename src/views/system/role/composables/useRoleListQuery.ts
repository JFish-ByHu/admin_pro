import { reactive, ref, type Ref } from 'vue'
import { getRoleList } from '@/api/role'
import type { RoleInfo, RoleListParams, RoleStatus, RoleView } from '@/types/role'
import type { TableFilterField } from '@/components/common/CommonTableFilter.vue'
import type { TablePagination } from '@/components/common/CommonTable.vue'

interface UseRoleListQueryOptions {
  selectedRowKeys: Ref<Array<string | number>>
  normalizeRole: (role: RoleView) => RoleInfo
}

export const useRoleListQuery = ({ selectedRowKeys, normalizeRole }: UseRoleListQueryOptions) => {
  const loading = ref(false)
  const tableData = ref<RoleInfo[]>([])

  const query = ref<RoleListParams>({
    keyword: '',
    status: ''
  })

  const filterFields: TableFilterField[] = [
    { prop: 'keyword', label: '关键词', type: 'input', placeholder: '角色名称 / 角色编码' },
    {
      prop: 'status',
      label: '状态',
      type: 'select',
      options: [
        { label: '启用', value: 'enabled' },
        { label: '禁用', value: 'disabled' }
      ]
    }
  ]

  const pagination = reactive<TablePagination>({
    page: 1,
    pageSize: 20,
    total: 0
  })

  const getRoles = async () => {
    loading.value = true

    try {
      const result = await getRoleList({
        keyword: query.value.keyword || undefined,
        status: (query.value.status as RoleStatus) || undefined,
        page: pagination.page,
        pageSize: pagination.pageSize
      })

      tableData.value = result.list.map(normalizeRole)
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

  const searchRoles = async () => {
    pagination.page = 1
    await getRoles()
  }

  const resetRoleFilters = async () => {
    query.value = {
      keyword: '',
      status: ''
    }

    pagination.page = 1
    await getRoles()
  }

  const refreshRoleList = async () => {
    await getRoles()
  }

  return {
    loading,
    tableData,
    query,
    filterFields,
    pagination,
    getRoles,
    searchRoles,
    resetRoleFilters,
    refreshRoleList
  }
}
