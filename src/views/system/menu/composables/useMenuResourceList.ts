import { computed, reactive, ref } from 'vue'
import type { TableFilterField } from '@/components/common/CommonTableFilter.vue'
import type { TablePagination } from '@/components/common/CommonTable.vue'
import type {
  MenuResourceNode,
  MenuResourceQuery,
  MenuResourceStatus,
  MenuResourceTableItem,
  MenuResourceType
} from '@/types/menu'

const mockMenuTree: MenuResourceNode[] = [
  {
    id: 'm-dashboard',
    parentId: null,
    name: '控制台',
    type: 'menu',
    routePath: '/dashboard',
    componentPath: 'views/dashboard/DashboardIndex.vue',
    status: 'enabled',
    sort: 1,
    updatedAt: '2026-06-11 10:16:20'
  },
  {
    id: 'm-user-root',
    parentId: null,
    name: '用户管理',
    type: 'directory',
    routePath: '/user',
    componentPath: 'components/layout/LayoutIndex.vue',
    status: 'enabled',
    sort: 10,
    updatedAt: '2026-06-11 10:17:03',
    children: [
      {
        id: 'm-user-info',
        parentId: 'm-user-root',
        name: '用户信息',
        type: 'menu',
        routePath: '/user/info',
        componentPath: 'views/user/UserInfoIndex.vue',
        status: 'enabled',
        sort: 1,
        updatedAt: '2026-06-11 10:17:58'
      }
    ]
  },
  {
    id: 'm-system-root',
    parentId: null,
    name: '系统管理',
    type: 'directory',
    routePath: '/system',
    componentPath: 'components/layout/LayoutIndex.vue',
    status: 'enabled',
    sort: 20,
    updatedAt: '2026-06-11 10:19:48',
    children: [
      {
        id: 'm-system-menu',
        parentId: 'm-system-root',
        name: '菜单管理',
        type: 'menu',
        routePath: '/system/menu',
        componentPath: 'views/system/menu/MenuManagementIndex.vue',
        status: 'enabled',
        sort: 1,
        updatedAt: '2026-06-11 10:20:10'
      },
      {
        id: 'm-system-permission',
        parentId: 'm-system-root',
        name: '权限管理',
        type: 'menu',
        routePath: '/system/permission',
        componentPath: 'views/system/permission/PermissionManagementIndex.vue',
        status: 'enabled',
        sort: 2,
        updatedAt: '2026-06-11 10:20:45'
      }
    ]
  }
]

const flattenMenuTree = (
  nodes: MenuResourceNode[],
  level = 0,
  result: MenuResourceTableItem[] = []
): MenuResourceTableItem[] => {
  nodes
    .slice()
    .sort((a, b) => a.sort - b.sort)
    .forEach(node => {
      result.push({
        id: node.id,
        parentId: node.parentId,
        level,
        name: node.name,
        type: node.type,
        routePath: node.routePath,
        componentPath: node.componentPath,
        status: node.status,
        sort: node.sort,
        updatedAt: node.updatedAt
      })

      if (node.children?.length) {
        flattenMenuTree(node.children, level + 1, result)
      }
    })

  return result
}

const includesKeyword = (item: MenuResourceTableItem, keyword: string) => {
  const currentKeyword = keyword.trim().toLowerCase()

  if (!currentKeyword) {
    return true
  }

  return (
    item.name.toLowerCase().includes(currentKeyword) ||
    item.routePath.toLowerCase().includes(currentKeyword) ||
    item.componentPath.toLowerCase().includes(currentKeyword)
  )
}

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

  const sourceMenuTree = ref<MenuResourceNode[]>(mockMenuTree)
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

  const flatMenuList = computed(() => flattenMenuTree(sourceMenuTree.value))
  const menuTreeData = computed(() => sourceMenuTree.value)

  const getMenuResources = async () => {
    loading.value = true

    try {
      const filteredData = flatMenuList.value.filter(item => {
        const typeMatched = !query.value.type || item.type === query.value.type
        const statusMatched = !query.value.status || item.status === query.value.status
        return typeMatched && statusMatched && includesKeyword(item, query.value.keyword)
      })

      pagination.total = filteredData.length

      const startIndex = (pagination.page - 1) * pagination.pageSize
      const endIndex = startIndex + pagination.pageSize

      tableData.value = filteredData.slice(startIndex, endIndex)
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
