<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { getRoleUserGrantDetail, updateRoleUserGrant } from '@/api/role'
import { getUserList } from '@/api/user'
import type { RoleInfo } from '@/types/role'
import { Message } from '@/utils/message'

interface TransferUserOption {
  key: string
  label: string
  disabled: boolean
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
const userOptions = ref<TransferUserOption[]>([])

const roleDisplayName = computed(() => props.role?.name || '')

const selectedUserCount = computed(() => selectedUserIds.value.length)

const closeDialog = () => {
  localVisible.value = false
}

const loadGrantData = async () => {
  if (!props.role?.id) {
    selectedUserIds.value = []
    userOptions.value = []
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
    userOptions.value = userListResult.list.map(item => ({
      key: item.id,
      label: `${item.nickname || item.username} (${item.email})`,
      disabled: false
    }))
  } finally {
    loading.value = false
  }
}

const filterTransferUser = (keyword: string, item: TransferUserOption) => {
  return item.label.toLowerCase().includes(keyword.toLowerCase())
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
</script>

<template>
  <el-dialog
    v-model="localVisible"
    :title="`角色用户授权 · ${roleDisplayName}`"
    width="min(900px, calc(100vw - 32px))"
    class="role-grant-dialog"
    destroy-on-close
  >
    <div v-loading="loading" class="role-grant-dialog__body">
      <div class="role-grant-dialog__summary">
        <span class="role-grant-dialog__summary-label">已授权用户</span>
        <strong class="role-grant-dialog__summary-value">{{ selectedUserCount }}</strong>
      </div>

      <el-transfer
        v-model="selectedUserIds"
        :data="userOptions"
        filterable
        :filter-method="filterTransferUser"
        filter-placeholder="搜索昵称 / 用户名 / 邮箱"
        :titles="['可选用户', '已授权用户']"
        target-order="push"
      />
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
  </el-dialog>
</template>

<style scoped lang="scss">
:deep(.role-grant-dialog) {
  .el-dialog {
    background: var(--bg-white);
    border: 1px solid var(--border-light);
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-lg);
  }

  .el-dialog__header {
    padding: var(--space-4) var(--space-5) var(--space-2);
    border-bottom: 1px solid var(--border-light);
  }

  .el-dialog__body {
    padding: var(--space-4) var(--space-5);
  }

  .el-dialog__footer {
    padding: var(--space-3) var(--space-5) var(--space-5);
    border-top: 1px solid var(--border-light);
  }
}

.role-grant-dialog__body {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.role-grant-dialog__summary {
  display: inline-flex;
  align-items: baseline;
  gap: var(--space-2);
}

.role-grant-dialog__summary-label {
  color: var(--t-secondary);
  font-size: var(--font-size-base);
}

.role-grant-dialog__summary-value {
  color: var(--c-primary);
  font-size: var(--font-size-lg);
}

:deep(.role-grant-dialog .el-transfer) {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
  gap: var(--space-3);
  align-items: stretch;

  .el-transfer-panel {
    width: 100%;
    border-radius: var(--radius-lg);
    border: 1px solid var(--border-light);
    min-height: 420px;
  }

  .el-transfer-panel__body {
    min-height: 372px;
    height: calc(100% - 48px);
  }

  .el-transfer-panel__list {
    min-height: 340px;
  }

  .el-transfer__buttons {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);

    .el-button {
      margin: 0;
    }
  }

  @include respond-to(tablet-down) {
    grid-template-columns: 1fr;

    .el-transfer__buttons {
      flex-direction: row;
      justify-content: center;
    }

    .el-transfer-panel {
      min-height: 260px;
    }

    .el-transfer-panel__body,
    .el-transfer-panel__list {
      min-height: 200px;
    }
  }
}
</style>
