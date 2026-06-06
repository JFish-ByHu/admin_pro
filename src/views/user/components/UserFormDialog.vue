<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import type { FormInstance, FormRules, UploadInstance, UploadProps } from 'element-plus'
import type { UserFormModel, UserRole, UserStatus } from '@/types/user'
import { Message } from '@/utils/message'

interface Option<T> {
  label: string
  value: T
}

const props = defineProps<{
  visible: boolean
  mode: 'add' | 'edit'
  title: string
  submitting: boolean
  submitPermission?: string | string[]
  initialValue: UserFormModel
  roleOptions: Option<UserRole>[]
  statusOptions: Option<UserStatus>[]
}>()

const emit = defineEmits<{
  'update:visible': [value: boolean]
  submit: [value: UserFormModel]
}>()

const formRef = ref<FormInstance>()
const uploadRef = ref<UploadInstance>()
const localFormModel = ref<UserFormModel>(createInitialFormModel())

const localVisible = computed({
  get: () => props.visible,
  set: value => emit('update:visible', value)
})

const dialogPasswordPlaceholder = computed(() =>
  props.mode === 'add' ? '请输入密码' : '留空则不修改密码'
)

const formRules: FormRules<UserFormModel> = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 50, message: '用户名长度为 3-50 位', trigger: 'blur' }
  ],
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '邮箱格式不正确', trigger: ['blur', 'change'] }
  ],
  password: [
    {
      validator: (_rule, value, callback) => {
        if (props.mode === 'add' && !value) {
          callback(new Error('请输入密码'))
          return
        }
        if (value && value.length < 6) {
          callback(new Error('密码不能少于 6 位'))
          return
        }
        callback()
      },
      trigger: 'blur'
    }
  ],
  nickname: [{ required: true, message: '请输入昵称', trigger: 'blur' }],
  role: [{ required: true, message: '请选择角色', trigger: 'change' }],
  status: [{ required: true, message: '请选择状态', trigger: 'change' }]
}

function createInitialFormModel(): UserFormModel {
  return {
    username: '',
    email: '',
    password: '',
    nickname: '',
    avatarUrl: '',
    role: 'user',
    status: 'enabled'
  }
}

function resetFormModel(): void {
  localFormModel.value = {
    ...createInitialFormModel(),
    ...props.initialValue,
    avatarUrl: props.initialValue.avatarUrl || ''
  }
}

const syncAvatarPreviewFromUpload: UploadProps['onChange'] = uploadFile => {
  const rawFile = uploadFile.raw
  if (!rawFile) {
    Message.warning('未获取到上传文件，请重试')
    uploadRef.value?.clearFiles()
    return
  }

  const isImageFile = rawFile.type.startsWith('image/')
  if (!isImageFile) {
    Message.warning('请上传图片格式文件')
    uploadRef.value?.clearFiles()
    return
  }

  const isWithinLimit = rawFile.size / 1024 / 1024 < 2
  if (!isWithinLimit) {
    Message.warning('图片大小不能超过 2MB')
    uploadRef.value?.clearFiles()
    return
  }

  const fileReader = new FileReader()
  fileReader.onload = event => {
    localFormModel.value.avatarUrl = String(event.target?.result || '')
    uploadRef.value?.clearFiles()
  }
  fileReader.onerror = () => {
    Message.warning('图片读取失败，请重新选择')
    uploadRef.value?.clearFiles()
  }
  fileReader.readAsDataURL(rawFile)
}

const clearAvatar = (): void => {
  localFormModel.value.avatarUrl = ''
  uploadRef.value?.clearFiles()
}

const closeDialog = (): void => {
  localVisible.value = false
}

const submitDialog = async (): Promise<void> => {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) {
    return
  }

  emit('submit', {
    ...localFormModel.value,
    username: localFormModel.value.username.trim(),
    email: localFormModel.value.email.trim(),
    nickname: localFormModel.value.nickname.trim(),
    avatarUrl: localFormModel.value.avatarUrl.trim()
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
    class="user-form-dialog"
    destroy-on-close
  >
    <el-form ref="formRef" :model="localFormModel" :rules="formRules" label-position="top">
      <div class="dialog-grid">
        <section class="form-fields-panel">
          <el-row :gutter="16">
            <el-col :xs="24" :sm="12">
              <el-form-item v-if="mode === 'add'" label="用户名" prop="username">
                <el-input v-model="localFormModel.username" placeholder="请输入用户名" />
              </el-form-item>

              <el-form-item v-else label="用户名">
                <el-input :model-value="localFormModel.username" disabled />
              </el-form-item>
            </el-col>

            <el-col :xs="24" :sm="12">
              <el-form-item label="邮箱" prop="email">
                <el-input v-model="localFormModel.email" placeholder="请输入邮箱" />
              </el-form-item>
            </el-col>

            <el-col :xs="24" :sm="12">
              <el-form-item label="密码" prop="password">
                <el-input
                  v-model="localFormModel.password"
                  type="password"
                  show-password
                  :placeholder="dialogPasswordPlaceholder"
                />
              </el-form-item>
            </el-col>

            <el-col :xs="24" :sm="12">
              <el-form-item label="昵称" prop="nickname">
                <el-input v-model="localFormModel.nickname" placeholder="请输入昵称" />
              </el-form-item>
            </el-col>

            <el-col :xs="24" :sm="12">
              <el-form-item label="角色" prop="role">
                <el-select v-model="localFormModel.role" placeholder="请选择角色">
                  <el-option
                    v-for="option in roleOptions"
                    :key="option.value"
                    :label="option.label"
                    :value="option.value"
                  />
                </el-select>
              </el-form-item>
            </el-col>

            <el-col :xs="24" :sm="12">
              <el-form-item label="状态" prop="status">
                <el-segmented
                  v-model="localFormModel.status"
                  :options="
                    statusOptions.map(option => ({ label: option.label, value: option.value }))
                  "
                />
              </el-form-item>
            </el-col>
          </el-row>
        </section>

        <section class="avatar-panel">
          <h4 class="avatar-panel__title">头像</h4>
          <p class="avatar-panel__hint">支持 jpg/png/webp，大小不超过 2MB</p>

          <el-upload
            ref="uploadRef"
            class="avatar-uploader"
            drag
            :show-file-list="false"
            :auto-upload="false"
            accept="image/png,image/jpeg,image/webp"
            :on-change="syncAvatarPreviewFromUpload"
          >
            <el-image
              v-if="localFormModel.avatarUrl"
              :src="localFormModel.avatarUrl"
              :preview-src-list="[localFormModel.avatarUrl]"
              fit="cover"
              class="avatar-uploader__preview"
              preview-teleported
              @click.stop
              @mousedown.stop
            />
            <div v-else class="avatar-uploader__placeholder">
              <el-icon><i-ep-plus /></el-icon>
              <span>点击或拖拽上传</span>
            </div>
          </el-upload>

          <el-space class="avatar-panel__actions">
            <el-button
              text
              type="primary"
              :disabled="!localFormModel.avatarUrl"
              @click="clearAvatar"
            >
              移除头像
            </el-button>
            <span v-if="localFormModel.avatarUrl" class="avatar-panel__preview-text"
              >点击可预览</span
            >
          </el-space>
        </section>
      </div>
    </el-form>

    <template #footer>
      <el-button @click="closeDialog">取消</el-button>
      <el-button
        v-permission="submitPermission"
        type="primary"
        :loading="submitting"
        @click="submitDialog"
      >
        {{ mode === 'add' ? '创建用户' : '保存修改' }}
      </el-button>
    </template>
  </el-dialog>
</template>

<style scoped lang="scss">
:deep(.user-form-dialog) {
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

.dialog-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 220px;
  gap: var(--space-5);
}

.form-fields-panel {
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-light);
  background: var(--bg-page-light);
  padding: var(--card-padding-md);
  box-shadow: var(--shadow-sm);
}

.avatar-panel {
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-light);
  background: var(--bg-page-light);
  padding: var(--card-padding-md);
  display: flex;
  flex-direction: column;
  gap: var(--card-gap-sm);
  box-shadow: var(--shadow-sm);
}

.avatar-panel__title {
  margin: 0;
  font-size: var(--font-size-base);
  color: var(--t-primary);
}

.avatar-panel__hint {
  margin: 0;
  color: var(--t-secondary);
  font-size: var(--font-size-base);
  line-height: 1.4;
}

.avatar-uploader {
  width: 100%;
}

.avatar-uploader :deep(.el-upload-dragger) {
  width: 100%;
  border-radius: var(--radius-lg);
  min-height: 182px;
  border-color: var(--c-primary-border);
  background: var(--bg-white);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-2);
  transition: border-color 0.2s ease;
}

.avatar-uploader :deep(.el-upload-dragger:hover) {
  border-color: var(--c-primary-border-hover);
}

.avatar-uploader__placeholder {
  color: var(--t-secondary);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-2);

  .el-icon {
    color: var(--c-primary);
    font-size: var(--font-size-lg);
  }
}

.avatar-uploader__preview {
  width: 100%;
  height: 182px;
  border-radius: var(--radius-lg);
  object-fit: cover;
}

.avatar-panel__actions {
  width: 100%;
  justify-content: space-between;
}

.avatar-panel__preview-text {
  font-size: var(--font-size-base);
  color: var(--t-secondary);
}

@include respond-to(tablet-down) {
  .dialog-grid {
    grid-template-columns: minmax(0, 1fr);
  }

  .avatar-uploader :deep(.el-upload-dragger) {
    min-height: 148px;
  }

  .avatar-uploader__preview {
    height: 148px;
  }
}
</style>
