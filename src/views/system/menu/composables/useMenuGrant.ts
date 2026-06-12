import { computed, ref, watch, type Ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getRoleMenuGrantDetail, updateRoleMenuGrant } from '@/api/menu'
import { getRoleSimpleList } from '@/api/role'
import { useUserStore } from '@/stores/user'
import { Message } from '@/utils/message'
import type { MenuAuthSubject, MenuResourceNode } from '@/types/menu'

interface UseMenuGrantOptions {
  menuTreeData: Ref<MenuResourceNode[]>
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
  const route = useRoute()
  const router = useRouter()
  const userStore = useUserStore()
  const subjectKeyword = ref('')
  const subjects = ref<MenuAuthSubject[]>([])
  const selectedSubjectId = ref('')
  const checkedMenuKeys = ref<string[]>([])
  const originalCheckedMenuKeys = ref<string[]>([])
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
    checkedMenuKeys.value = [...originalCheckedMenuKeys.value]
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
      await updateRoleMenuGrant({
        roleId: selectedSubjectId.value,
        menuIds: checkedMenuKeys.value
      })

      await userStore.syncCurrentUserInfo({ force: true })
      await router.replace(route.fullPath)

      originalCheckedMenuKeys.value = [...checkedMenuKeys.value]

      const subjectName = selectedSubject.value?.nickname || selectedSubject.value?.username || ''
      Message.success(`已保存 ${subjectName} 的菜单授权`)
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
    const detail = await getRoleMenuGrantDetail(roleId)
    checkedMenuKeys.value = detail.checkedMenuIds
    originalCheckedMenuKeys.value = [...detail.checkedMenuIds]
  }

  const refreshSubjects = async () => {
    await loadSubjects()

    const firstSubject = subjects.value[0]
    if (!firstSubject) {
      selectedSubjectId.value = ''
      checkedMenuKeys.value = []
      originalCheckedMenuKeys.value = []
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
        checkedMenuKeys.value = []
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
    checkedMenuKeys,
    saving,
    selectSubject,
    resetCurrentSubjectGrant,
    checkAllMenus,
    clearAllMenus,
    saveCurrentSubjectGrant,
    refreshSubjects,
    menuTreeData
  }
}
