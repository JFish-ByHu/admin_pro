import { reactive, ref, computed } from 'vue'
import { getLogList } from '@/api/log'
import type { LogQuery, OperationLogItem } from '@/types/log'
import type { TableFilterField } from '@/components/common/CommonTableFilter.vue'
import type { TablePagination } from '@/components/common/CommonTable.vue'
import type { Ref } from 'vue'

/** 日志模块选项 */
const MODULE_OPTIONS = [
  { label: '用户管理', value: '用户管理' },
  { label: '角色管理', value: '角色管理' },
  { label: '菜单管理', value: '菜单管理' },
  { label: '权限管理', value: '权限管理' },
  { label: '认证', value: '认证' }
]

/** 操作类型选项 */
const ACTION_OPTIONS = [
  { label: '新增', value: '新增' },
  { label: '修改', value: '修改' },
  { label: '删除', value: '删除' },
  { label: '批量删除', value: '批量删除' },
  { label: '登录', value: '登录' },
  { label: '邮箱登录', value: '邮箱登录' },
  { label: '登出', value: '登出' },
  { label: '注册', value: '注册' },
  { label: '密码重置', value: '密码重置' },
  { label: '授权', value: '授权' },
  { label: '角色分配', value: '角色分配' },
  { label: '用户授权', value: '用户授权' }
]

/** 结果选项 */
const RESULT_OPTIONS = [
  { label: '成功', value: 'success' },
  { label: '失败', value: 'fail' }
]

/** 获取当前 Tab 的默认筛选条件 */
const getDefaultQuery = (isErrorTab: boolean): LogQuery => ({
  keyword: '',
  module: '',
  action: '',
  result: isErrorTab ? 'fail' : undefined,
  startDate: '',
  endDate: ''
})

export const useLogList = (isErrorTab: Ref<boolean>) => {
  const loading = ref(false)
  const tableData = ref<OperationLogItem[]>([])

  const query = ref<LogQuery>(getDefaultQuery(isErrorTab.value))

  const filterFields = computed<TableFilterField[]>(() => {
    const fields: TableFilterField[] = [
      {
        prop: 'keyword',
        label: '关键词',
        type: 'input',
        placeholder: '用户名 / 昵称 / 模块 / 操作对象'
      },
      { prop: 'module', label: '模块', type: 'select', options: MODULE_OPTIONS },
      { prop: 'action', label: '操作', type: 'select', options: ACTION_OPTIONS },
      { prop: 'dateRange', label: '时间范围', type: 'daterange', placeholder: '选择日期范围' }
    ]

    if (!isErrorTab.value) {
      fields.splice(3, 0, {
        prop: 'result',
        label: '结果',
        type: 'select',
        options: RESULT_OPTIONS
      })
    }

    return fields
  })

  const pagination = reactive<TablePagination>({
    page: 1,
    pageSize: 20,
    total: 0
  })

  const getLogs = async () => {
    loading.value = true

    try {
      const result = await getLogList({
        keyword: query.value.keyword || undefined,
        module: query.value.module || undefined,
        action: query.value.action || undefined,
        result: (query.value.result as 'success' | 'fail') || undefined,
        startDate: query.value.startDate || undefined,
        endDate: query.value.endDate || undefined,
        page: pagination.page,
        pageSize: pagination.pageSize
      })

      tableData.value = result.list
      pagination.total = result.total
      pagination.page = result.page
      pagination.pageSize = result.pageSize
    } finally {
      loading.value = false
    }
  }

  const searchLogs = async () => {
    pagination.page = 1
    await getLogs()
  }

  /** 重置筛选：恢复当前 Tab 默认条件并重新查询 */
  const resetLogFilters = async () => {
    query.value = getDefaultQuery(isErrorTab.value)
    pagination.page = 1
    await getLogs()
  }

  const refreshLogs = async () => {
    await getLogs()
  }

  return {
    loading,
    query,
    filterFields,
    pagination,
    tableData,
    getLogs,
    searchLogs,
    resetLogFilters,
    refreshLogs
  }
}
