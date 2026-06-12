import { computed, reactive, ref } from 'vue'
import { getMenuResourceList, getMenuResourceTree } from '@/api/menu'
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

  const menuLevelMap = computed(() => {
    const levelMap = new Map<string, number>()

    const travel = (nodes: MenuResourceNode[], level: number) => {
      nodes.forEach(node => {
        levelMap.set(node.id, level)

        if (node.children?.length) {
          travel(node.children, level + 1)
        }
      })
    }

    travel(sourceMenuTree.value, 0)
    return levelMap
  })

  const getMenuResources = async () => {
    loading.value = true

    try {
      const [listResult, treeResult] = await Promise.all([
        getMenuResourceList({
          keyword: query.value.keyword || undefined,
          type: query.value.type || undefined,
          status: query.value.status || undefined,
          page: pagination.page,
          pageSize: pagination.pageSize
        }),
        getMenuResourceTree()
      ])

      sourceMenuTree.value = treeResult

      tableData.value = listResult.list.map(item => ({
        ...item,
        level: menuLevelMap.value.get(item.id) || 0
      }))

      pagination.total = listResult.total
      pagination.page = listResult.page
      pagination.pageSize = listResult.pageSize
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
