<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { getRoleUserGrantDetail, updateRoleUserGrant } from '@/api/role'
import { getUserList } from '@/api/user'
import type { RoleInfo } from '@/types/role'
import { Message } from '@/utils/message'
import RoleUserGrantPanel from './RoleUserGrantPanel.vue'

interface GrantUserItem {
  id: string
  username: string
  nickname: string
  email: string
  avatarUrl: string | null
  label: string
}

const props = defineProps<{
  visible: boolean
  role: RoleInfo | null
  submitPermission?: string | string[]
}>()

const emit = defineEmits<{
  'update:visible': [value: boolean]
  saved: []
}>()

const localVisible = computed({
  get: () => props.visible,
  set: value => emit('update:visible', value)
})

const loading = ref(false)
const saving = ref(false)
const selectedUserIds = ref<string[]>([])
const allUsers = ref<GrantUserItem[]>([])
const availableKeyword = ref('')
const grantedKeyword = ref('')
const availableCheckedIds = ref<string[]>([])
const grantedCheckedIds = ref<string[]>([])

const roleDisplayName = computed(() => props.role?.name || '')

const selectedUserCount = computed(() => selectedUserIds.value.length)

const normalizeKeyword = (keyword: string) => keyword.trim().toLowerCase()

const grantedUserSet = computed(() => new Set(selectedUserIds.value))

const availableUsers = computed(() => {
  return allUsers.value.filter(item => !grantedUserSet.value.has(item.id))
})

const grantedUsers = computed(() => {
  const userMap = new Map(allUsers.value.map(item => [item.id, item]))
  return selectedUserIds.value
    .map(id => userMap.get(id))
    .filter((item): item is GrantUserItem => Boolean(item))
})

const filteredAvailableUsers = computed(() => {
  const keyword = normalizeKeyword(availableKeyword.value)
  if (!keyword) {
    return availableUsers.value
  }

  return availableUsers.value.filter(item => item.label.toLowerCase().includes(keyword))
})

const filteredGrantedUsers = computed(() => {
  const keyword = normalizeKeyword(grantedKeyword.value)
  if (!keyword) {
    return grantedUsers.value
  }

  return grantedUsers.value.filter(item => item.label.toLowerCase().includes(keyword))
})

const filteredAvailableUserIds = computed(() => filteredAvailableUsers.value.map(item => item.id))
const filteredGrantedUserIds = computed(() => filteredGrantedUsers.value.map(item => item.id))

const availableAllChecked = computed(() => {
  return (
    filteredAvailableUserIds.value.length > 0 &&
    filteredAvailableUserIds.value.every(id => availableCheckedIds.value.includes(id))
  )
})

const grantedAllChecked = computed(() => {
  return (
    filteredGrantedUserIds.value.length > 0 &&
    filteredGrantedUserIds.value.every(id => grantedCheckedIds.value.includes(id))
  )
})

const availableIndeterminate = computed(() => {
  const checkedCount = filteredAvailableUserIds.value.filter(id =>
    availableCheckedIds.value.includes(id)
  ).length
  return checkedCount > 0 && checkedCount < filteredAvailableUserIds.value.length
})

const grantedIndeterminate = computed(() => {
  const checkedCount = filteredGrantedUserIds.value.filter(id =>
    grantedCheckedIds.value.includes(id)
  ).length
  return checkedCount > 0 && checkedCount < filteredGrantedUserIds.value.length
})

const closeDialog = () => {
  localVisible.value = false
}

const resetPanelState = () => {
  availableKeyword.value = ''
  grantedKeyword.value = ''
  availableCheckedIds.value = []
  grantedCheckedIds.value = []
}

const loadGrantData = async () => {
  if (!props.role?.id) {
    selectedUserIds.value = []
    allUsers.value = []
    resetPanelState()
    return
  }

  loading.value = true

  try {
    const [grantDetail, userListResult] = await Promise.all([
      getRoleUserGrantDetail(props.role.id),
      getUserList({
        all: true,
        status: 'enabled'
      })
    ])

    selectedUserIds.value = grantDetail.checkedUserIds
    allUsers.value = userListResult.list.map(item => ({
      id: item.id,
      username: item.username,
      nickname: item.nickname || item.username,
      email: item.email,
      avatarUrl: item.avatarUrl || null,
      label: `${item.nickname || item.username} (${item.email})`
    }))

    resetPanelState()
  } finally {
    loading.value = false
  }
}

const toggleAllAvailable = (checked: boolean | string | number) => {
  if (!checked) {
    availableCheckedIds.value = []
    return
  }

  availableCheckedIds.value = [...filteredAvailableUserIds.value]
}

const toggleAllGranted = (checked: boolean | string | number) => {
  if (!checked) {
    grantedCheckedIds.value = []
    return
  }

  grantedCheckedIds.value = [...filteredGrantedUserIds.value]
}

const moveToGranted = () => {
  if (!availableCheckedIds.value.length) {
    return
  }

  const nextSelected = new Set(selectedUserIds.value)
  availableCheckedIds.value.forEach(id => nextSelected.add(id))

  selectedUserIds.value = allUsers.value.map(item => item.id).filter(id => nextSelected.has(id))
  availableCheckedIds.value = []
}

const moveToAvailable = () => {
  if (!grantedCheckedIds.value.length) {
    return
  }

  const removedSet = new Set(grantedCheckedIds.value)
  selectedUserIds.value = selectedUserIds.value.filter(id => !removedSet.has(id))
  grantedCheckedIds.value = []
}

const saveGrant = async () => {
  if (!props.role?.id) {
    return
  }

  saving.value = true

  try {
    await updateRoleUserGrant({
      roleId: props.role.id,
      userIds: selectedUserIds.value
    })

    Message.success(`已保存「${props.role.name}」的用户授权`)
    emit('saved')
    closeDialog()
  } finally {
    saving.value = false
  }
}

watch(
  () => [props.visible, props.role?.id] as const,
  ([visible, roleId]) => {
    if (!visible || !roleId) {
      return
    }

    void loadGrantData()
  },
  { immediate: true }
)

watch(
  () => localVisible.value,
  visible => {
    if (visible) {
      return
    }

    resetPanelState()
  }
)
</script>

<template>
  <el-drawer
    v-model="localVisible"
    :title="`角色用户授权 · ${roleDisplayName}`"
    size="min(980px, 100vw)"
    class="role-grant-drawer"
    destroy-on-close
    append-to-body
  >
    <div v-loading="loading" class="role-grant-drawer__body">
      <div class="role-grant-drawer__summary">
        <div class="role-grant-drawer__summary-item">
          <span class="label">已授权用户</span>
          <strong class="value">{{ selectedUserCount }}</strong>
        </div>
        <div class="role-grant-drawer__summary-item">
          <span class="label">可选用户</span>
          <strong class="value">{{ availableUsers.length }}</strong>
        </div>
      </div>

      <div class="role-grant-drawer__grid">
        <RoleUserGrantPanel
          v-model:keyword="availableKeyword"
          v-model:checked-ids="availableCheckedIds"
          title="可选用户"
          :users="availableUsers"
          :filtered-users="filteredAvailableUsers"
          :all-checked="availableAllChecked"
          :indeterminate="availableIndeterminate"
          empty-text="无可选用户"
          @toggle-all="toggleAllAvailable"
        />

        <section class="grant-actions">
          <el-button
            color="var(--c-info)"
            :disabled="availableCheckedIds.length === 0"
            @click="moveToGranted"
          >
            <i-ep-arrow-right />
          </el-button>
          <el-button
            type="info"
            plain
            :disabled="grantedCheckedIds.length === 0"
            @click="moveToAvailable"
          >
            <i-ep-arrow-left />
          </el-button>
        </section>

        <RoleUserGrantPanel
          v-model:keyword="grantedKeyword"
          v-model:checked-ids="grantedCheckedIds"
          title="已授权用户"
          :users="grantedUsers"
          :filtered-users="filteredGrantedUsers"
          :all-checked="grantedAllChecked"
          :indeterminate="grantedIndeterminate"
          empty-text="暂无已授权用户"
          @toggle-all="toggleAllGranted"
        />
      </div>
    </div>

    <template #footer>
      <el-button @click="closeDialog">取消</el-button>
      <el-button
        v-permission="submitPermission"
        color="var(--c-info)"
        :loading="saving"
        @click="saveGrant"
      >
        保存授权
      </el-button>
    </template>
  </el-drawer>
</template>

<style scoped lang="scss">
:deep(.role-grant-drawer) {
  .el-drawer__header {
    margin-bottom: 0;
    padding: var(--space-4) var(--space-5) var(--space-3);
    border-bottom: 1px solid var(--border-light);
  }

  .el-drawer__body {
    padding: var(--space-4) var(--space-5);
  }

  .el-drawer__footer {
    padding: var(--space-3) var(--space-5) var(--space-5);
    border-top: 1px solid var(--border-light);
  }
}

.role-grant-drawer__body {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.role-grant-drawer__summary {
  display: flex;
  gap: var(--space-3);
  flex-wrap: wrap;
}

.role-grant-drawer__summary-item {
  display: inline-flex;
  align-items: baseline;
  gap: var(--space-2);
  padding: 6px 10px;
  border-radius: var(--radius-md);
  background: var(--bg-hover);

  .label {
    color: var(--t-secondary);
    font-size: 12px;
  }

  .value {
    color: var(--c-primary);
    font-size: var(--font-size-lg);
    line-height: 1;
  }
}

.role-grant-drawer__grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
  gap: var(--space-3);
  align-items: stretch;
}

.grant-actions {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: var(--space-2);

  :deep(.el-button) {
    margin: 0;
    min-width: 40px;
  }
}

@include respond-to(tablet-down) {
  .role-grant-drawer__grid {
    grid-template-columns: 1fr;
  }

  .grant-actions {
    flex-direction: row;
    justify-content: center;
  }
}
</style>
