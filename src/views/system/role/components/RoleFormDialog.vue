<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import type { FormInstance, FormRules } from 'element-plus'
import type { RoleFormModel } from '@/types/role'

const props = defineProps<{
  visible: boolean
  mode: 'add' | 'edit'
  title: string
  submitting: boolean
  submitPermission?: string | string[]
  initialValue: RoleFormModel
}>()

const emit = defineEmits<{
  'update:visible': [value: boolean]
  submit: [value: RoleFormModel]
}>()

const formRef = ref<FormInstance>()
const localFormModel = ref<RoleFormModel>(createInitialFormModel())

const localVisible = computed({
  get: () => props.visible,
  set: value => emit('update:visible', value)
})

const formRules: FormRules<RoleFormModel> = {
  code: [
    { required: true, message: '请输入角色编码', trigger: 'blur' },
    { min: 2, max: 50, message: '角色编码长度为 2-50 位', trigger: 'blur' }
  ],
  name: [
    { required: true, message: '请输入角色名称', trigger: 'blur' },
    { min: 2, max: 50, message: '角色名称长度为 2-50 位', trigger: 'blur' }
  ],
  description: [{ max: 255, message: '描述最多 255 字', trigger: 'blur' }],
  status: [{ required: true, message: '请选择状态', trigger: 'change' }]
}

function createInitialFormModel(): RoleFormModel {
  return {
    code: '',
    name: '',
    description: '',
    status: 'enabled'
  }
}

const resetFormModel = () => {
  localFormModel.value = {
    ...createInitialFormModel(),
    ...props.initialValue
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
    code: localFormModel.value.code.trim(),
    name: localFormModel.value.name.trim(),
    description: localFormModel.value.description.trim()
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
    :title="title"
    width="min(640px, calc(100vw - 32px))"
    class="role-form-dialog"
    destroy-on-close
  >
    <el-form ref="formRef" :model="localFormModel" :rules="formRules" label-position="top">
      <el-row :gutter="16">
        <el-col :xs="24" :sm="12">
          <el-form-item label="角色编码" prop="code">
            <el-input
              v-model="localFormModel.code"
              :disabled="mode === 'edit'"
              placeholder="如：admin、operator"
            />
          </el-form-item>
        </el-col>

        <el-col :xs="24" :sm="12">
          <el-form-item label="角色名称" prop="name">
            <el-input v-model="localFormModel.name" placeholder="请输入角色名称" />
          </el-form-item>
        </el-col>

        <el-col :xs="24" :sm="24">
          <el-form-item label="角色描述" prop="description">
            <el-input
              v-model="localFormModel.description"
              type="textarea"
              :rows="4"
              maxlength="255"
              show-word-limit
              placeholder="请输入角色描述（可选）"
            />
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
        {{ mode === 'add' ? '创建角色' : '保存修改' }}
      </el-button>
    </template>
  </el-dialog>
</template>

<style scoped lang="scss">
:deep(.role-form-dialog) {
  .el-dialog {
    background: var(--bg-white);
    border: 1px solid var(--border-light);
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-lg);
  }

  .el-dialog__header {
    padding: var(--space-4) var(--space-5) var(--space-2);
    border-bottom: 1px solid var(--border-light);

    .el-dialog__title {
      color: var(--t-primary);
      font-size: var(--font-size-lg);
      font-weight: 600;
    }

    .el-dialog__headerbtn .el-dialog__close {
      color: var(--t-secondary);
    }
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
