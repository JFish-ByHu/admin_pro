<script setup lang="ts">
import { computed, nextTick, ref, watch, type Component } from 'vue'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import type { FormInstance, FormRules } from 'element-plus'
import type { MenuResourceFormModel, MenuResourceType } from '@/types/menu'

interface ParentOption {
  label: string
  value: string
  type: MenuResourceType
}

const props = defineProps<{
  visible: boolean
  mode: 'add' | 'edit'
  title: string
  submitting: boolean
  submitPermission?: string | string[]
  initialValue: MenuResourceFormModel
  parentOptions: ParentOption[]
}>()

const emit = defineEmits<{
  'update:visible': [value: boolean]
  submit: [value: MenuResourceFormModel]
}>()

const formRef = ref<FormInstance>()
const localFormModel = ref<MenuResourceFormModel>(createInitialFormModel())
const iconComponentMap = ElementPlusIconsVue as Record<string, Component>
const iconOptions = computed(() => Object.keys(iconComponentMap).sort())

const localVisible = computed({
  get: () => props.visible,
  set: value => emit('update:visible', value)
})

const selectedParentType = computed(() => {
  return (
    props.parentOptions.find(option => option.value === localFormModel.value.parentId)?.type || null
  )
})

const forceMenuType = computed(() => selectedParentType.value === 'directory')

const formRules: FormRules<MenuResourceFormModel> = {
  name: [
    { required: true, message: '请输入菜单名称', trigger: 'blur' },
    { min: 2, max: 100, message: '菜单名称长度为 2-100 位', trigger: 'blur' }
  ],
  type: [{ required: true, message: '请选择菜单类型', trigger: 'change' }],
  routePath: [
    {
      validator: (_, value, callback) => {
        const routePath = (value || '').trim()

        if (localFormModel.value.type === 'menu' && !routePath) {
          callback(new Error('菜单类型必须填写路由路径'))
          return
        }

        if (routePath && !routePath.startsWith('/')) {
          callback(new Error('路由路径需以 / 开头'))
          return
        }

        callback()
      },
      trigger: 'blur'
    },
    { max: 255, message: '路由路径最多 255 字符', trigger: 'blur' }
  ],
  componentPath: [
    {
      validator: (_, value, callback) => {
        const componentPath = (value || '').trim()

        if (localFormModel.value.type === 'menu' && !componentPath) {
          callback(new Error('菜单类型必须填写组件路径'))
          return
        }

        callback()
      },
      trigger: 'blur'
    },
    { max: 255, message: '组件路径最多 255 字符', trigger: 'blur' }
  ]
}

function createInitialFormModel(): MenuResourceFormModel {
  return {
    parentId: '',
    name: '',
    type: 'menu',
    routePath: '',
    componentPath: '',
    icon: '',
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
    name: localFormModel.value.name.trim(),
    routePath: localFormModel.value.routePath.trim(),
    componentPath: localFormModel.value.componentPath.trim(),
    icon: localFormModel.value.type === 'directory' ? localFormModel.value.icon.trim() : ''
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

watch(
  () => forceMenuType.value,
  async mustBeMenu => {
    if (!mustBeMenu || localFormModel.value.type !== 'directory') {
      return
    }

    localFormModel.value.type = 'menu'

    await nextTick()
    formRef.value?.clearValidate(['type'])
  }
)

watch(
  () => localFormModel.value.type,
  value => {
    if (value !== 'directory' && localFormModel.value.icon) {
      localFormModel.value.icon = ''
    }
  }
)

watch(
  () => localFormModel.value.parentId,
  async () => {
    if (!forceMenuType.value || localFormModel.value.type !== 'directory') {
      return
    }

    localFormModel.value.type = 'menu'

    await nextTick()
    formRef.value?.clearValidate(['type'])
  }
)
</script>

<template>
  <el-dialog
    v-model="localVisible"
    :title="title"
    width="min(720px, calc(100vw - 32px))"
    class="menu-resource-form-dialog"
    destroy-on-close
  >
    <el-form ref="formRef" :model="localFormModel" :rules="formRules" label-position="top">
      <el-row :gutter="16">
        <el-col :xs="24" :sm="12">
          <el-form-item label="父级菜单">
            <el-select v-model="localFormModel.parentId" placeholder="目录级菜单">
              <el-option label="目录级菜单" value="" />
              <el-option
                v-for="option in parentOptions"
                :key="option.value"
                :label="option.label"
                :value="option.value"
              />
            </el-select>
          </el-form-item>
        </el-col>

        <el-col :xs="24" :sm="12">
          <el-form-item label="菜单类型" prop="type">
            <el-select v-model="localFormModel.type" placeholder="请选择菜单类型">
              <el-option label="目录" value="directory" :disabled="forceMenuType" />
              <el-option label="菜单" value="menu" />
            </el-select>
            <div v-if="forceMenuType" class="form-tip">父级为目录时，子级仅支持菜单类型</div>
          </el-form-item>
        </el-col>

        <el-col :xs="24" :sm="12">
          <el-form-item label="菜单名称" prop="name">
            <el-input v-model="localFormModel.name" placeholder="请输入菜单名称" />
          </el-form-item>
        </el-col>

        <el-col :xs="24" :sm="12">
          <el-form-item label="排序">
            <el-input-number v-model="localFormModel.sort" :min="0" :step="1" :precision="0" />
          </el-form-item>
        </el-col>

        <el-col :xs="24" :sm="12">
          <el-form-item
            :label="localFormModel.type === 'menu' ? '路由路径 *' : '路由路径'"
            prop="routePath"
          >
            <el-input
              v-model="localFormModel.routePath"
              :placeholder="
                localFormModel.type === 'menu' ? '如 /system/menu' : '目录可选，如 /system'
              "
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

        <el-col v-if="localFormModel.type === 'directory'" :xs="24" :sm="12">
          <el-form-item label="目录图标">
            <el-select
              v-model="localFormModel.icon"
              clearable
              filterable
              placeholder="请选择 Element Plus 图标"
            >
              <el-option
                v-for="iconName in iconOptions"
                :key="iconName"
                :label="iconName"
                :value="iconName"
              >
                <div class="icon-option">
                  <el-icon class="icon-option__preview">
                    <component :is="iconComponentMap[iconName]" />
                  </el-icon>
                  <span>{{ iconName }}</span>
                </div>
              </el-option>
            </el-select>
          </el-form-item>
        </el-col>

        <el-col :xs="24">
          <el-form-item
            :label="localFormModel.type === 'menu' ? '组件路径 *' : '组件路径'"
            prop="componentPath"
          >
            <el-input
              v-model="localFormModel.componentPath"
              :placeholder="
                localFormModel.type === 'menu'
                  ? '如 views/system/menu/MenuManagementIndex.vue'
                  : '目录可选，如 views/system/dashboard/DashboardIndex.vue'
              "
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
        {{ mode === 'add' ? '创建菜单' : '保存修改' }}
      </el-button>
    </template>
  </el-dialog>
</template>

<style scoped lang="scss">
:deep(.menu-resource-form-dialog) {
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

.form-tip {
  margin-top: 6px;
  color: var(--text-secondary);
  font-size: 12px;
  line-height: 1.4;
}

.icon-option {
  display: inline-flex;
  align-items: center;
  gap: 8px;

  &__preview {
    font-size: 14px;
  }
}
</style>
