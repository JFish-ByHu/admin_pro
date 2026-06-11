import { computed, ref, watch, type Ref } from 'vue'
import { Message } from '@/utils/message'
import type { MenuAuthSubject } from '@/types/menu'
import type { PermissionResourceNode } from '@/types/permission'

interface UsePermissionGrantOptions {
  permissionTreeData: Ref<PermissionResourceNode[]>
}

const mockSubjects: MenuAuthSubject[] = [
  {
    id: 'u-super-admin',
    username: 'super_admin',
    nickname: '超级管理员',
    email: 'super_admin@example.com',
    role: 'super'
  },
  {
    id: 'u-admin-01',
    username: 'admin_ops',
    nickname: '运营管理员',
    email: 'admin_ops@example.com',
    role: 'admin'
  },
  {
    id: 'u-operator-01',
    username: 'operator_a',
    nickname: '业务运营A',
    email: 'operator_a@example.com',
    role: 'operator'
  },
  {
    id: 'u-user-01',
    username: 'user_demo',
    nickname: '普通用户示例',
    email: 'user_demo@example.com',
    role: 'user'
  }
]

const mockGrantMap: Record<string, string[]> = {
  'u-super-admin': [
    'p-user-module',
    'p-user-create',
    'p-user-update',
    'p-user-delete',
    'p-menu-module',
    'p-menu-create',
    'p-menu-update',
    'p-menu-grant'
  ],
  'u-admin-01': [
    'p-user-module',
    'p-user-update',
    'p-menu-module',
    'p-menu-create',
    'p-menu-update'
  ],
  'u-operator-01': ['p-user-module', 'p-menu-module'],
  'u-user-01': []
}

const collectAllNodeIds = (nodes: PermissionResourceNode[], ids: string[] = []) => {
  nodes.forEach(node => {
    ids.push(node.id)

    if (node.children?.length) {
      collectAllNodeIds(node.children, ids)
    }
  })

  return ids
}

export const usePermissionGrant = ({ permissionTreeData }: UsePermissionGrantOptions) => {
  const subjectKeyword = ref('')
  const subjects = ref<MenuAuthSubject[]>(mockSubjects)
  const selectedSubjectId = ref('')
  const checkedPermissionKeys = ref<string[]>([])
  const saving = ref(false)

  const grantMap = ref<Record<string, string[]>>({ ...mockGrantMap })

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
    checkedPermissionKeys.value = [...(grantMap.value[subjectId] || [])]
  }

  const resetCurrentSubjectGrant = () => {
    if (!selectedSubjectId.value) {
      return
    }

    checkedPermissionKeys.value = [...(grantMap.value[selectedSubjectId.value] || [])]
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
      grantMap.value[selectedSubjectId.value] = [...checkedPermissionKeys.value]

      const subjectName = selectedSubject.value?.nickname || selectedSubject.value?.username || ''
      Message.success(`已保存 ${subjectName} 的权限授权`)
    } finally {
      saving.value = false
    }
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
          selectSubject(firstSubject.id)
        }
      }
    },
    {
      immediate: true
    }
  )

  return {
    filteredSubjects,
    subjectKeyword,
    selectedSubjectId,
    selectedSubject,
    checkedPermissionKeys,
    saving,
    selectSubject,
    resetCurrentSubjectGrant,
    checkAllPermissions,
    clearAllPermissions,
    saveCurrentSubjectGrant
  }
}
