<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import type { FormInstance, FormRules } from 'element-plus'
import type { PermissionGroupItem } from '@/types/permission'

export interface PermissionGroupFormModel {
  groupCode: string
  groupName: string
  sort: number
  status: 'enabled' | 'disabled'
}

const props = defineProps<{
  visible: boolean
  mode?: 'add' | 'edit'
  title?: string
  submitting: boolean
  submitPermission?: string | string[]
  groupList?: PermissionGroupItem[]
  initialValue?: PermissionGroupFormModel
}>()

const emit = defineEmits<{
  'update:visible': [value: boolean]
  submit: [value: PermissionGroupFormModel]
}>()

const formRef = ref<FormInstance>()

const isEditMode = computed(() => props.mode === 'edit')
const dialogTitle = computed(() => props.title || (isEditMode.value ? '编辑分组' : '新增分组'))

const createInitialFormModel = (): PermissionGroupFormModel => ({
  groupCode: '',
  groupName: '',
  sort: 0,
  status: 'enabled'
})

const localFormModel = ref<PermissionGroupFormModel>(createInitialFormModel())

const localVisible = computed({
  get: () => props.visible,
  set: value => emit('update:visible', value)
})

const existingCodes = computed(() => (props.groupList || []).map(g => g.code))

const formRules = computed<FormRules<PermissionGroupFormModel>>(() => ({
  groupCode: [
    { required: !isEditMode.value, message: '请输入分组标识', trigger: 'blur' },
    { max: 50, message: '分组标识最多 50 字符', trigger: 'blur' },
    {
      validator: (_rule: unknown, value: string, callback: (error?: Error) => void) => {
        if (isEditMode.value) {
          callback()
          return
        }
        const code = (value || '').trim().toLowerCase()
        if (!code) {
          callback()
          return
        }
        if (existingCodes.value.includes(code)) {
          callback(new Error('分组标识已存在，请更换'))
          return
        }
        callback()
      },
      trigger: 'blur'
    }
  ],
  groupName: [
    { required: true, message: '请输入分组名称', trigger: 'blur' },
    { max: 100, message: '分组名称最多 100 字符', trigger: 'blur' }
  ]
}))

const resetFormModel = () => {
  localFormModel.value = {
    ...createInitialFormModel(),
    ...(props.initialValue || {})
  }
}

const closeDialog = () => {
  localVisible.value = false
}

const submitDialog = async () => {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) {
    return
  }

  emit('submit', {
    ...localFormModel.value,
    groupCode: localFormModel.value.groupCode.trim().toLowerCase(),
    groupName: localFormModel.value.groupName.trim()
  })
}

watch(
  () => props.visible,
  async visible => {
    if (!visible) {
      return
    }
    resetFormModel()
    await nextTick()
    formRef.value?.clearValidate()
  },
  { immediate: true }
)
</script>

<template>
  <el-dialog
    v-model="localVisible"
    :title="dialogTitle"
    width="min(480px, calc(100vw - 32px))"
    class="permission-group-form-dialog"
    destroy-on-close
  >
    <el-form ref="formRef" :model="localFormModel" :rules="formRules" label-position="top">
      <el-form-item label="分组标识" prop="groupCode">
        <el-input
          v-model="localFormModel.groupCode"
          :disabled="isEditMode"
          placeholder="英文标识，如 report"
          maxlength="50"
        />
      </el-form-item>

      <el-form-item label="分组名称" prop="groupName">
        <el-input
          v-model="localFormModel.groupName"
          placeholder="中文名称，如 报告"
          maxlength="100"
        />
      </el-form-item>

      <el-row :gutter="16">
        <el-col :xs="24" :sm="12">
          <el-form-item label="排序">
            <el-input-number v-model="localFormModel.sort" :min="0" :step="1" :precision="0" />
          </el-form-item>
        </el-col>

        <el-col :xs="24" :sm="12">
          <el-form-item label="状态" prop="status">
            <el-switch
              v-model="localFormModel.status"
              active-value="enabled"
              inactive-value="disabled"
              active-text="启用"
              inactive-text="禁用"
            />
          </el-form-item>
        </el-col>
      </el-row>
    </el-form>

    <template #footer>
      <el-button @click="closeDialog">取消</el-button>
      <el-button
        v-permission="submitPermission"
        color="var(--c-info)"
        :loading="submitting"
        @click="submitDialog"
      >
        {{ isEditMode ? '保存修改' : '创建分组' }}
      </el-button>
    </template>
  </el-dialog>
</template>

<style scoped lang="scss">
:deep(.permission-group-form-dialog) {
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
    padding: var(--space-4) var(--space-5) var(--space-3);
  }

  .el-dialog__footer {
    padding: var(--space-3) var(--space-5) var(--space-5);
    border-top: 1px solid var(--border-light);
  }
}
</style>
