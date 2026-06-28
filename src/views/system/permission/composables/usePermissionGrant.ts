import { computed, ref, watch, type Ref } from 'vue'
import { getRolePermissionGrantDetail, updateRolePermissionGrant } from '@/api/permission'
import { getRoleSimpleList } from '@/api/role'
import { useUserStore } from '@/stores/user'
import { Message } from '@/utils/message'
import type { MenuAuthSubject } from '@/types/menu'
import type { PermissionResourceNode } from '@/types/permission'

interface UsePermissionGrantOptions {
  permissionTreeData: Ref<PermissionResourceNode[]>
}

const isVirtualGroupNode = (node: PermissionResourceNode) => node.id.startsWith('__group__')

const collectAllNodeIds = (nodes: PermissionResourceNode[], ids: string[] = []) => {
  nodes.forEach(node => {
    // 虚拟分组节点不可勾选
    if (!isVirtualGroupNode(node)) {
      ids.push(node.id)
    }

    if (node.children?.length) {
      collectAllNodeIds(node.children, ids)
    }
  })

  return ids
}

export const usePermissionGrant = ({ permissionTreeData }: UsePermissionGrantOptions) => {
  const userStore = useUserStore()
  const subjectKeyword = ref('')
  const subjects = ref<MenuAuthSubject[]>([])
  const selectedSubjectId = ref('')
  const checkedPermissionKeys = ref<string[]>([])
  const originalCheckedPermissionKeys = ref<string[]>([])
  const saving = ref(false)

  const roleLabelMap = computed(() => {
    return subjects.value.reduce<Record<string, string>>((acc, item) => {
      acc[item.role] = item.nickname
      return acc
    }, {})
  })

  const filteredSubjects = computed(() => {
    const keyword = subjectKeyword.value.trim().toLowerCase()

    if (!keyword) {
      return subjects.value
    }

    return subjects.value.filter(subject => {
      return (
        subject.nickname.toLowerCase().includes(keyword) ||
        subject.username.toLowerCase().includes(keyword) ||
        subject.email.toLowerCase().includes(keyword)
      )
    })
  })

  const selectedSubject = computed(() => {
    return subjects.value.find(subject => subject.id === selectedSubjectId.value) || null
  })

  const selectSubject = (subjectId: string) => {
    selectedSubjectId.value = subjectId
    void loadGrantDetail(subjectId)
  }

  const resetCurrentSubjectGrant = () => {
    checkedPermissionKeys.value = [...originalCheckedPermissionKeys.value]
  }

  const checkAllPermissions = () => {
    checkedPermissionKeys.value = collectAllNodeIds(permissionTreeData.value)
  }

  const clearAllPermissions = () => {
    checkedPermissionKeys.value = []
  }

  const saveCurrentSubjectGrant = async () => {
    if (!selectedSubjectId.value) {
      Message.warning('请先选择授权对象')
      return
    }

    saving.value = true

    try {
      await updateRolePermissionGrant({
        roleId: selectedSubjectId.value,
        permissionIds: checkedPermissionKeys.value
      })

      await userStore.syncCurrentUserInfo({ force: true })

      originalCheckedPermissionKeys.value = [...checkedPermissionKeys.value]

      const subjectName = selectedSubject.value?.nickname || selectedSubject.value?.username || ''
      Message.success(`已保存 ${subjectName} 的权限授权`)
    } finally {
      saving.value = false
    }
  }

  const loadSubjects = async () => {
    const roles = await getRoleSimpleList()

    subjects.value = roles.map(item => ({
      id: item.id,
      username: item.code,
      nickname: item.name,
      email: '-',
      role: item.code
    }))
  }

  const loadGrantDetail = async (roleId: string) => {
    const detail = await getRolePermissionGrantDetail(roleId)
    checkedPermissionKeys.value = detail.checkedPermissionIds
    originalCheckedPermissionKeys.value = [...detail.checkedPermissionIds]
  }

  const refreshSubjects = async () => {
    await loadSubjects()

    const firstSubject = subjects.value[0]
    if (!firstSubject) {
      selectedSubjectId.value = ''
      checkedPermissionKeys.value = []
      originalCheckedPermissionKeys.value = []
      return
    }

    if (
      !selectedSubjectId.value ||
      !subjects.value.some(item => item.id === selectedSubjectId.value)
    ) {
      selectedSubjectId.value = firstSubject.id
    }

    await loadGrantDetail(selectedSubjectId.value)
  }

  watch(
    filteredSubjects,
    nextSubjects => {
      if (!nextSubjects.length) {
        selectedSubjectId.value = ''
        checkedPermissionKeys.value = []
        return
      }

      const isCurrentSubjectVisible = nextSubjects.some(
        subject => subject.id === selectedSubjectId.value
      )

      if (!isCurrentSubjectVisible) {
        const firstSubject = nextSubjects[0]

        if (firstSubject) {
          selectedSubjectId.value = firstSubject.id
          void loadGrantDetail(firstSubject.id)
        }
      }
    },
    {
      immediate: true
    }
  )

  return {
    filteredSubjects,
    roleLabelMap,
    subjectKeyword,
    selectedSubjectId,
    selectedSubject,
    checkedPermissionKeys,
    saving,
    selectSubject,
    resetCurrentSubjectGrant,
    checkAllPermissions,
    clearAllPermissions,
    saveCurrentSubjectGrant,
    refreshSubjects
  }
}
