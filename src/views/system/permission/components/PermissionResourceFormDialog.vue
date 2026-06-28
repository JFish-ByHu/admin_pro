<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import type { FormInstance, FormRules } from 'element-plus'
import type { PermissionGroupItem, PermissionResourceFormModel } from '@/types/permission'

const props = defineProps<{
  visible: boolean
  mode: 'add' | 'edit'
  title: string
  submitting: boolean
  submitPermission?: string | string[]
  initialValue: PermissionResourceFormModel
  groupList?: PermissionGroupItem[]
}>()

const emit = defineEmits<{
  'update:visible': [value: boolean]
  submit: [value: PermissionResourceFormModel]
}>()

const formRef = ref<FormInstance>()
const localFormModel = ref<PermissionResourceFormModel>(createInitialFormModel())

const localVisible = computed({
  get: () => props.visible,
  set: value => emit('update:visible', value)
})

/** 分组下拉选项（从 groupList 动态生成） */
const groupOptions = computed(() => {
  const list = props.groupList || []
  return list.map(item => ({
    label: item.name,
    value: item.code
  }))
})

/** 分组是否可编辑（edit 模式下禁止修改分组） */
const canEditGroup = computed(() => props.mode === 'add')

const formRules: FormRules<PermissionResourceFormModel> = {
  name: [
    { required: true, message: '请输入权限名称', trigger: 'blur' },
    { min: 2, max: 100, message: '权限名称长度为 2-100 位', trigger: 'blur' }
  ],
  permissionCode: [
    { required: true, message: '请输入权限标识', trigger: 'blur' },
    { max: 100, message: '权限标识最多 100 字符', trigger: 'blur' }
  ],
  type: [{ required: true, message: '请选择权限类型', trigger: 'change' }],
  apiPath: [{ max: 255, message: '接口路径最多 255 字符', trigger: 'blur' }],
  httpMethod: [{ max: 12, message: '请求方法最多 12 字符', trigger: 'blur' }]
}

function createInitialFormModel(): PermissionResourceFormModel {
  return {
    groupCode: '',
    name: '',
    permissionCode: '',
    type: 'api',
    apiPath: '',
    httpMethod: 'GET',
    sort: 0,
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
    groupCode: localFormModel.value.groupCode.trim().toLowerCase(),
    name: localFormModel.value.name.trim(),
    permissionCode: localFormModel.value.permissionCode.trim(),
    apiPath: localFormModel.value.apiPath.trim(),
    httpMethod: localFormModel.value.httpMethod.trim().toUpperCase()
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
    width="min(760px, calc(100vw - 32px))"
    class="permission-resource-form-dialog"
    destroy-on-close
  >
    <el-form ref="formRef" :model="localFormModel" :rules="formRules" label-position="top">
      <el-row :gutter="16">
        <el-col :xs="24" :sm="12">
          <el-form-item label="所属分组" prop="groupCode">
            <el-select
              v-model="localFormModel.groupCode"
              :disabled="!canEditGroup"
              placeholder="请选择或输入分组标识"
              filterable
              allow-create
              clearable
              default-first-option
              style="width: 100%"
            >
              <el-option
                v-for="opt in groupOptions"
                :key="opt.value"
                :label="opt.label"
                :value="opt.value"
              />
            </el-select>
          </el-form-item>
        </el-col>

        <el-col :xs="24" :sm="12">
          <el-form-item label="权限名称" prop="name">
            <el-input v-model="localFormModel.name" placeholder="请输入权限名称" />
          </el-form-item>
        </el-col>

        <el-col :xs="24" :sm="12">
          <el-form-item label="权限标识" prop="permissionCode">
            <el-input v-model="localFormModel.permissionCode" placeholder="如 system:menu:list" />
          </el-form-item>
        </el-col>

        <el-col :xs="24" :sm="12">
          <el-form-item label="权限类型" prop="type">
            <el-select v-model="localFormModel.type" style="width: 100%">
              <el-option label="接口" value="api" />
              <el-option label="按钮" value="button" />
            </el-select>
          </el-form-item>
        </el-col>

        <el-col :xs="24" :sm="12">
          <el-form-item label="接口路径" prop="apiPath">
            <el-input v-model="localFormModel.apiPath" placeholder="如 /api/menus/list" />
          </el-form-item>
        </el-col>

        <el-col :xs="24" :sm="12">
          <el-form-item label="请求方法" prop="httpMethod">
            <el-select v-model="localFormModel.httpMethod" placeholder="请选择请求方法" clearable>
              <el-option label="GET" value="GET" />
              <el-option label="POST" value="POST" />
              <el-option label="PATCH" value="PATCH" />
              <el-option label="PUT" value="PUT" />
              <el-option label="DELETE" value="DELETE" />
            </el-select>
          </el-form-item>
        </el-col>

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
        {{ mode === 'add' ? '创建权限' : '保存修改' }}
      </el-button>
    </template>
  </el-dialog>
</template>

<style scoped lang="scss">
:deep(.permission-resource-form-dialog) {
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
