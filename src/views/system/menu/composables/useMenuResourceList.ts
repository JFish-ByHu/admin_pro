import { computed, reactive, ref } from 'vue'
import { getMenuResourceTree } from '@/api/menu'
import type { TableFilterField } from '@/components/common/CommonTableFilter.vue'
import type { TablePagination } from '@/components/common/CommonTable.vue'
import type {
  MenuResourceNode,
  MenuResourceQuery,
  MenuResourceStatus,
  MenuResourceTableItem,
  MenuResourceType
} from '@/types/menu'

export const useMenuResourceList = () => {
  const loading = ref(false)
  const query = ref<MenuResourceQuery>({
    keyword: '',
    type: '',
    status: ''
  })

  const pagination = reactive<TablePagination>({
    page: 1,
    pageSize: 20,
    total: 0
  })

  const sourceMenuTree = ref<MenuResourceNode[]>([])
  const tableData = ref<MenuResourceTableItem[]>([])

  const filterFields: TableFilterField[] = [
    {
      prop: 'keyword',
      label: '关键词',
      type: 'input',
      placeholder: '菜单名称 / 路由 / 组件路径'
    },
    {
      prop: 'type',
      label: '菜单类型',
      type: 'select',
      options: [
        { label: '目录', value: 'directory' },
        { label: '菜单', value: 'menu' }
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

  const menuTreeData = computed(() => sourceMenuTree.value)

  const getTreeTableRows = (nodes: MenuResourceNode[], level = 0): MenuResourceTableItem[] => {
    return nodes
      .slice()
      .sort((a, b) => a.sort - b.sort)
      .flatMap(node => {
        const currentRow: MenuResourceTableItem = {
          id: node.id,
          parentId: node.parentId,
          level,
          name: node.name,
          type: node.type,
          routePath: node.routePath,
          componentPath: node.componentPath,
          icon: node.icon,
          status: node.status,
          sort: node.sort,
          createTime: node.createTime,
          updateTime: node.updateTime
        }

        const children = node.children?.length ? getTreeTableRows(node.children, level + 1) : []
        return [currentRow, ...children]
      })
  }

  const isRowMatched = (row: MenuResourceTableItem) => {
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

    return [row.name, row.routePath, row.componentPath]
      .filter(Boolean)
      .some(value => value.toLowerCase().includes(keyword))
  }

  const getMenuResources = async () => {
    loading.value = true

    try {
      const treeResult = await getMenuResourceTree()

      sourceMenuTree.value = treeResult

      const allRows = getTreeTableRows(sourceMenuTree.value)
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

  const searchMenuResources = async () => {
    pagination.page = 1
    await getMenuResources()
  }

  const resetMenuFilters = async () => {
    query.value = {
      keyword: '',
      type: '',
      status: ''
    }

    pagination.page = 1
    await getMenuResources()
  }

  const refreshMenuResources = async () => {
    pagination.page = 1
    await getMenuResources()
  }

  return {
    loading,
    query,
    filterFields,
    pagination,
    tableData,
    menuTreeData,
    getMenuResources,
    searchMenuResources,
    resetMenuFilters,
    refreshMenuResources
  }
}

export type MenuResourceTypeOption = {
  label: string
  value: MenuResourceType
}

export type MenuResourceStatusOption = {
  label: string
  value: MenuResourceStatus
}
