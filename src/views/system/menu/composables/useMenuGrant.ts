import { computed, ref, watch, type Ref } from 'vue'
import { Message } from '@/utils/message'
import type { MenuAuthSubject, MenuResourceNode } from '@/types/menu'

interface UseMenuGrantOptions {
  menuTreeData: Ref<MenuResourceNode[]>
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
    'm-dashboard',
    'm-user-root',
    'm-user-info',
    'm-system-root',
    'm-system-menu',
    'm-system-permission'
  ],
  'u-admin-01': ['m-dashboard', 'm-user-root', 'm-user-info', 'm-system-root', 'm-system-menu'],
  'u-operator-01': ['m-dashboard', 'm-user-root', 'm-user-info'],
  'u-user-01': ['m-dashboard']
}

const collectAllNodeIds = (nodes: MenuResourceNode[], ids: string[] = []) => {
  nodes.forEach(node => {
    ids.push(node.id)

    if (node.children?.length) {
      collectAllNodeIds(node.children, ids)
    }
  })

  return ids
}

export const useMenuGrant = ({ menuTreeData }: UseMenuGrantOptions) => {
  const subjectKeyword = ref('')
  const subjects = ref<MenuAuthSubject[]>(mockSubjects)
  const selectedSubjectId = ref('')
  const checkedMenuKeys = ref<string[]>([])
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
    checkedMenuKeys.value = [...(grantMap.value[subjectId] || [])]
  }

  const resetCurrentSubjectGrant = () => {
    if (!selectedSubjectId.value) {
      return
    }

    checkedMenuKeys.value = [...(grantMap.value[selectedSubjectId.value] || [])]
  }

  const checkAllMenus = () => {
    checkedMenuKeys.value = collectAllNodeIds(menuTreeData.value)
  }

  const clearAllMenus = () => {
    checkedMenuKeys.value = []
  }

  const saveCurrentSubjectGrant = async () => {
    if (!selectedSubjectId.value) {
      Message.warning('请先选择授权对象')
      return
    }

    saving.value = true

    try {
      grantMap.value[selectedSubjectId.value] = [...checkedMenuKeys.value]

      const subjectName = selectedSubject.value?.nickname || selectedSubject.value?.username || ''
      Message.success(`已保存 ${subjectName} 的菜单授权`)
    } finally {
      saving.value = false
    }
  }

  watch(
    filteredSubjects,
    nextSubjects => {
      if (!nextSubjects.length) {
        selectedSubjectId.value = ''
        checkedMenuKeys.value = []
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
    checkedMenuKeys,
    saving,
    selectSubject,
    resetCurrentSubjectGrant,
    checkAllMenus,
    clearAllMenus,
    saveCurrentSubjectGrant,
    menuTreeData
  }
}
