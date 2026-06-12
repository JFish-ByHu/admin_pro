import { computed, reactive, ref } from 'vue'
import { getPermissionResourceList, getPermissionResourceTree } from '@/api/permission'
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

  const permissionLevelMap = computed(() => {
    const levelMap = new Map<string, number>()

    const travel = (nodes: PermissionResourceNode[], level: number) => {
      nodes.forEach(node => {
        levelMap.set(node.id, level)

        if (node.children?.length) {
          travel(node.children, level + 1)
        }
      })
    }

    travel(sourcePermissionTree.value, 0)
    return levelMap
  })

  const getPermissionResources = async () => {
    loading.value = true

    try {
      const [listResult, treeResult] = await Promise.all([
        getPermissionResourceList({
          keyword: query.value.keyword || undefined,
          type: query.value.type || undefined,
          status: query.value.status || undefined,
          page: pagination.page,
          pageSize: pagination.pageSize
        }),
        getPermissionResourceTree()
      ])

      sourcePermissionTree.value = treeResult

      tableData.value = listResult.list.map(item => ({
        ...item,
        level: permissionLevelMap.value.get(item.id) || 0
      }))

      pagination.total = listResult.total
      pagination.page = listResult.page
      pagination.pageSize = listResult.pageSize
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
