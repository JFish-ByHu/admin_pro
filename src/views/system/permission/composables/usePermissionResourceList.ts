import { computed, reactive, ref } from 'vue'
import { getPermissionResourceTree } from '@/api/permission'
import type { TableFilterField } from '@/components/common/CommonTableFilter.vue'
import type { TablePagination } from '@/components/common/CommonTable.vue'
import type {
  PermissionResourceNode,
  PermissionResourceQuery,
  PermissionResourceStatus,
  PermissionResourceTableItem,
  PermissionResourceType
} from '@/types/permission'

export const usePermissionResourceList = () => {
  const loading = ref(false)
  const query = ref<PermissionResourceQuery>({
    keyword: '',
    type: '',
    status: ''
  })

  const pagination = reactive<TablePagination>({
    page: 1,
    pageSize: 20,
    total: 0
  })

  const sourcePermissionTree = ref<PermissionResourceNode[]>([])
  const tableData = ref<PermissionResourceTableItem[]>([])

  const filterFields: TableFilterField[] = [
    {
      prop: 'keyword',
      label: '关键词',
      type: 'input',
      placeholder: '权限名称 / 权限标识 / 接口路径'
    },
    {
      prop: 'type',
      label: '权限类型',
      type: 'select',
      options: [
        { label: '接口', value: 'api' },
        { label: '按钮', value: 'button' }
      ]
    },
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

  const permissionTreeData = computed(() => sourcePermissionTree.value)

  const getTreeTableRows = (
    nodes: PermissionResourceNode[],
    level = 0
  ): PermissionResourceTableItem[] => {
    return nodes
      .slice()
      .sort((a, b) => a.sort - b.sort)
      .flatMap(node => {
        const currentRow: PermissionResourceTableItem = {
          id: node.id,
          parentId: node.parentId,
          level,
          name: node.name,
          type: node.type,
          permissionCode: node.permissionCode,
          apiPath: node.apiPath,
          httpMethod: node.httpMethod,
          status: node.status,
          sort: node.sort,
          createTime: node.createTime,
          updateTime: node.updateTime
        }

        const children = node.children?.length ? getTreeTableRows(node.children, level + 1) : []
        return [currentRow, ...children]
      })
  }

  const isRowMatched = (row: PermissionResourceTableItem) => {
    const keyword = query.value.keyword.trim().toLowerCase()

    if (query.value.type && row.type !== query.value.type) {
      return false
    }

    if (query.value.status && row.status !== query.value.status) {
      return false
    }

    if (!keyword) {
      return true
    }

    return [row.name, row.permissionCode, row.apiPath]
      .filter(Boolean)
      .some(value => value.toLowerCase().includes(keyword))
  }

  const getPermissionResources = async () => {
    loading.value = true

    try {
      const treeResult = await getPermissionResourceTree()

      sourcePermissionTree.value = treeResult

      const allRows = getTreeTableRows(sourcePermissionTree.value)
      const filteredRows = allRows.filter(isRowMatched)

      pagination.total = filteredRows.length

      const maxPage = Math.max(1, Math.ceil(filteredRows.length / pagination.pageSize))
      pagination.page = Math.min(pagination.page, maxPage)

      const startIndex = (pagination.page - 1) * pagination.pageSize
      const endIndex = startIndex + pagination.pageSize
      tableData.value = filteredRows.slice(startIndex, endIndex)
    } finally {
      loading.value = false
    }
  }

  const searchPermissionResources = async () => {
    pagination.page = 1
    await getPermissionResources()
  }

  const resetPermissionFilters = async () => {
    query.value = {
      keyword: '',
      type: '',
      status: ''
    }

    pagination.page = 1
    await getPermissionResources()
  }

  const refreshPermissionResources = async () => {
    pagination.page = 1
    await getPermissionResources()
  }

  return {
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
  }
}

export type PermissionResourceTypeOption = {
  label: string
  value: PermissionResourceType
}

export type PermissionResourceStatusOption = {
  label: string
  value: PermissionResourceStatus
}
