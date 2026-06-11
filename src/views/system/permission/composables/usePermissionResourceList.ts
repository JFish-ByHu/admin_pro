import { computed, reactive, ref } from 'vue'
import type { TableFilterField } from '@/components/common/CommonTableFilter.vue'
import type { TablePagination } from '@/components/common/CommonTable.vue'
import type {
  PermissionResourceNode,
  PermissionResourceQuery,
  PermissionResourceStatus,
  PermissionResourceTableItem,
  PermissionResourceType
} from '@/types/permission'

const mockPermissionTree: PermissionResourceNode[] = [
  {
    id: 'p-user-module',
    parentId: null,
    name: '用户模块权限',
    type: 'api',
    permissionCode: 'system:user:list',
    apiPath: '/api/users/list',
    httpMethod: 'GET',
    status: 'enabled',
    sort: 1,
    updatedAt: '2026-06-11 10:30:00',
    children: [
      {
        id: 'p-user-create',
        parentId: 'p-user-module',
        name: '新增用户按钮',
        type: 'button',
        permissionCode: 'system:user:create',
        apiPath: '/api/users/add',
        httpMethod: 'POST',
        status: 'enabled',
        sort: 1,
        updatedAt: '2026-06-11 10:31:00'
      },
      {
        id: 'p-user-update',
        parentId: 'p-user-module',
        name: '编辑用户按钮',
        type: 'button',
        permissionCode: 'system:user:update',
        apiPath: '/api/users/update/:id',
        httpMethod: 'PATCH',
        status: 'enabled',
        sort: 2,
        updatedAt: '2026-06-11 10:31:20'
      },
      {
        id: 'p-user-delete',
        parentId: 'p-user-module',
        name: '删除用户按钮',
        type: 'button',
        permissionCode: 'system:user:delete',
        apiPath: '/api/users/delete/:id',
        httpMethod: 'DELETE',
        status: 'enabled',
        sort: 3,
        updatedAt: '2026-06-11 10:31:50'
      }
    ]
  },
  {
    id: 'p-menu-module',
    parentId: null,
    name: '菜单模块权限',
    type: 'api',
    permissionCode: 'system:menu:list',
    apiPath: '/api/menus/list',
    httpMethod: 'GET',
    status: 'enabled',
    sort: 2,
    updatedAt: '2026-06-11 10:32:40',
    children: [
      {
        id: 'p-menu-create',
        parentId: 'p-menu-module',
        name: '新增菜单按钮',
        type: 'button',
        permissionCode: 'system:menu:create',
        apiPath: '/api/menus/add',
        httpMethod: 'POST',
        status: 'enabled',
        sort: 1,
        updatedAt: '2026-06-11 10:33:05'
      },
      {
        id: 'p-menu-update',
        parentId: 'p-menu-module',
        name: '更新菜单按钮',
        type: 'button',
        permissionCode: 'system:menu:update',
        apiPath: '/api/menus/update/:id',
        httpMethod: 'PATCH',
        status: 'enabled',
        sort: 2,
        updatedAt: '2026-06-11 10:33:20'
      },
      {
        id: 'p-menu-grant',
        parentId: 'p-menu-module',
        name: '权限授权按钮',
        type: 'button',
        permissionCode: 'system:permission:grant',
        apiPath: '/api/permissions/grant',
        httpMethod: 'POST',
        status: 'enabled',
        sort: 3,
        updatedAt: '2026-06-11 10:33:50'
      }
    ]
  }
]

const flattenPermissionTree = (
  nodes: PermissionResourceNode[],
  level = 0,
  result: PermissionResourceTableItem[] = []
): PermissionResourceTableItem[] => {
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
        permissionCode: node.permissionCode,
        apiPath: node.apiPath,
        httpMethod: node.httpMethod,
        status: node.status,
        sort: node.sort,
        updatedAt: node.updatedAt
      })

      if (node.children?.length) {
        flattenPermissionTree(node.children, level + 1, result)
      }
    })

  return result
}

const includesKeyword = (item: PermissionResourceTableItem, keyword: string) => {
  const currentKeyword = keyword.trim().toLowerCase()

  if (!currentKeyword) {
    return true
  }

  return (
    item.name.toLowerCase().includes(currentKeyword) ||
    item.permissionCode.toLowerCase().includes(currentKeyword) ||
    item.apiPath.toLowerCase().includes(currentKeyword)
  )
}

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

  const sourcePermissionTree = ref<PermissionResourceNode[]>(mockPermissionTree)
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

  const flatPermissionList = computed(() => flattenPermissionTree(sourcePermissionTree.value))
  const permissionTreeData = computed(() => sourcePermissionTree.value)

  const getPermissionResources = async () => {
    loading.value = true

    try {
      const filteredData = flatPermissionList.value.filter(item => {
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
