<script setup lang="ts">
import { ref, computed, onBeforeUnmount } from 'vue'
import type { FormInstance, FormRules, FormItemRule } from 'element-plus'
import {
  checkResetEmail,
  getEncryptKey,
  resetPassword,
  sendEmailCode,
  verifyEmailCode
} from '@/api/auth'
import { encryptAES } from '@/utils/crypto'
import { Message } from '@/utils/message'

type StepStatus = 'wait' | 'process' | 'finish' | 'error' | 'success'

const emit = defineEmits<{
  (
    e: 'switch-mode',
    mode: 'register' | 'login' | 'email-login' | 'email-register' | 'forgot-password'
  ): void
}>()

const activeStep = ref(0)
const errorStep = ref<number | null>(null)

const emailFormRef = ref<FormInstance | null>(null)
const codeFormRef = ref<FormInstance | null>(null)
const passwordFormRef = ref<FormInstance | null>(null)

const model = ref({
  email: '',
  emailCode: '',
  password: '',
  confirmPassword: ''
})

const emailVerifyTicket = ref('')
const emailChecked = ref(false)
const loading = ref(false)
const sendingCode = ref(false)
const countdown = ref(0)
let countdownTimer: number | null = null

const stepDescriptions = computed(() => {
  return ['先确认该邮箱已绑定账号', '通过验证码校验身份', '设置并确认新密码']
})

const emailRules: FormRules = {
  email: [
    { required: true, message: '请输入邮箱', trigger: ['blur', 'change'] },
    { type: 'email', message: '请输入有效的邮箱格式', trigger: ['blur', 'change'] }
  ]
}

const codeRules: FormRules = {
  emailCode: [
    { required: true, message: '请输入6位验证码', trigger: ['blur', 'change'] },
    { len: 6, message: '验证码必须是6位', trigger: ['blur', 'change'] },
    { pattern: /^\d+$/, message: '验证码只能包含数字', trigger: ['blur', 'change'] }
  ]
}

const validateConfirmPassword = (
  rule: FormItemRule,
  value: string,
  callback: (error?: Error) => void
) => {
  void rule

  if (!value) {
    callback(new Error('请再次输入新密码'))
    return
  }

  if (value !== model.value.password) {
    callback(new Error('两次输入的密码不一致'))
    return
  }

  callback()
}

const passwordRules: FormRules = {
  password: [
    { required: true, message: '请输入新密码', trigger: ['blur', 'change'] },
    { pattern: /^[^\s]+$/, message: '密码不允许包含空格', trigger: ['blur', 'change'] },
    { min: 6, max: 20, message: '密码长度必须在6-20个字符之间', trigger: ['blur', 'change'] }
  ],
  confirmPassword: [
    { required: true, message: '请再次输入新密码', trigger: ['blur', 'change'] },
    { validator: validateConfirmPassword, trigger: ['blur', 'change'] }
  ]
}

const clearCountdownTimer = () => {
  if (countdownTimer !== null) {
    window.clearInterval(countdownTimer)
    countdownTimer = null
  }
}

const startCountdown = (seconds: number) => {
  clearCountdownTimer()
  countdown.value = seconds

  countdownTimer = window.setInterval(() => {
    if (countdown.value <= 1) {
      countdown.value = 0
      clearCountdownTimer()
      return
    }

    countdown.value -= 1
  }, 1000)
}

onBeforeUnmount(() => {
  clearCountdownTimer()
})

const getStepStatus = (step: number): StepStatus => {
  if (errorStep.value === step) {
    return 'error'
  }

  if (step < activeStep.value) {
    return 'success'
  }

  if (step === activeStep.value) {
    return 'process'
  }

  return 'wait'
}

const validateForm = async (formRef: FormInstance | null): Promise<boolean> => {
  if (!formRef) {
    return false
  }

  try {
    await formRef.validate()
    return true
  } catch {
    return false
  }
}

const goToVerifyStep = async () => {
  const valid = await validateForm(emailFormRef.value)
  if (!valid) {
    errorStep.value = 0
    Message.error('请先输入有效邮箱地址')
    return
  }

  loading.value = true
  try {
    await checkResetEmail(model.value.email.trim())
    emailChecked.value = true
    activeStep.value = 1
    errorStep.value = null
    Message.success('邮箱校验通过，请获取验证码')
  } finally {
    loading.value = false
  }
}

const sendResetEmailCode = async () => {
  if (countdown.value > 0 || sendingCode.value) {
    return
  }

  if (!emailChecked.value) {
    Message.warning('请先完成邮箱校验')
    return
  }

  sendingCode.value = true
  try {
    const res = await sendEmailCode(model.value.email.trim(), 'reset')
    startCountdown(res.cooldownSeconds)
    ElNotification({
      title: 'Verification Code Sent',
      message: `验证码已发送至 ${model.value.email.trim()}`,
      type: 'success',
      duration: 1800
    })
  } finally {
    sendingCode.value = false
  }
}

const verifyResetCode = async () => {
  const valid = await validateForm(codeFormRef.value)
  if (!valid) {
    errorStep.value = 1
    Message.error('请先输入正确的验证码')
    return
  }

  loading.value = true
  try {
    const verifyRes = await verifyEmailCode(
      model.value.email.trim(),
      model.value.emailCode,
      'reset'
    )
    emailVerifyTicket.value = verifyRes.emailVerifyTicket
    activeStep.value = 2
    errorStep.value = null
    Message.success('验证码校验成功，请设置新密码')
  } finally {
    loading.value = false
  }
}

const submitResetPassword = async () => {
  const valid = await validateForm(passwordFormRef.value)
  if (!valid) {
    errorStep.value = 2
    Message.error('请检查新密码输入')
    return
  }

  if (!emailVerifyTicket.value) {
    errorStep.value = 1
    activeStep.value = 1
    Message.error('验证码失效，请重新获取验证码')
    return
  }

  loading.value = true
  try {
    const keyRes = await getEncryptKey()
    const encryptedPassword = encryptAES(model.value.password, keyRes.aesKey)

    await resetPassword({
      email: model.value.email.trim(),
      password: encryptedPassword,
      emailVerifyTicket: emailVerifyTicket.value,
      keyId: keyRes.keyId
    })

    ElNotification({
      title: 'Password Updated',
      message: '密码重置成功，请使用新密码登录',
      type: 'success',
      duration: 2500
    })

    emit('switch-mode', 'login')
  } finally {
    loading.value = false
  }
}

const backToLogin = () => {
  emit('switch-mode', 'login')
}
</script>

<template>
  <div class="forgot-password-form-wrapper">
    <div class="header">
      <h1 class="title">Reset Password</h1>
      <p class="subtitle">通过邮箱验证快速重置账号密码</p>
    </div>

    <el-steps
      :active="activeStep"
      process-status="process"
      finish-status="success"
      align-center
      class="reset-steps"
    >
      <el-step title="确认邮箱" :description="stepDescriptions[0]" :status="getStepStatus(0)" />
      <el-step title="验证身份" :description="stepDescriptions[1]" :status="getStepStatus(1)" />
      <el-step title="重置密码" :description="stepDescriptions[2]" :status="getStepStatus(2)" />
    </el-steps>

    <div class="step-panel">
      <transition name="step-fade-slide" mode="out-in">
        <el-form
          v-if="activeStep === 0"
          key="email-step"
          ref="emailFormRef"
          :model="model"
          :rules="emailRules"
          :validate-on-rule-change="false"
          size="large"
          label-position="top"
        >
          <el-form-item prop="email" label="Email">
            <el-input v-model="model.email" placeholder="Enter your account email" clearable />
          </el-form-item>

          <el-button
            type="primary"
            color="var(--c-info)"
            class="submit-btn"
            :loading="loading"
            @click="goToVerifyStep"
          >
            下一步
          </el-button>
        </el-form>

        <el-form
          v-else-if="activeStep === 1"
          key="code-step"
          ref="codeFormRef"
          :model="model"
          :rules="codeRules"
          :validate-on-rule-change="false"
          size="large"
          label-position="top"
        >
          <el-form-item label="Email">
            <el-input :model-value="model.email" disabled />
          </el-form-item>

          <el-form-item prop="emailCode" label="Verification Code">
            <div class="otp-wrapper">
              <el-input-otp v-model="model.emailCode" :length="6" size="large" class="otp-input" />
              <el-button
                class="otp-send-btn"
                :loading="sendingCode"
                :disabled="countdown > 0"
                @click="sendResetEmailCode"
              >
                {{ countdown > 0 ? `${countdown}s 后重发` : '发送验证码' }}
              </el-button>
            </div>
          </el-form-item>

          <div class="step-actions">
            <el-button @click="activeStep = 0">上一步</el-button>
            <el-button
              type="primary"
              color="var(--c-info)"
              :loading="loading"
              @click="verifyResetCode"
            >
              下一步
            </el-button>
          </div>
        </el-form>

        <el-form
          v-else
          key="password-step"
          ref="passwordFormRef"
          :model="model"
          :rules="passwordRules"
          :validate-on-rule-change="false"
          size="large"
          label-position="top"
        >
          <el-form-item label="Email">
            <el-input :model-value="model.email" disabled />
          </el-form-item>

          <el-form-item prop="password" label="New Password">
            <el-input
              v-model="model.password"
              type="password"
              show-password
              placeholder="Enter new password"
            />
          </el-form-item>

          <el-form-item prop="confirmPassword" label="Confirm Password">
            <el-input
              v-model="model.confirmPassword"
              type="password"
              show-password
              placeholder="Re-enter new password"
            />
          </el-form-item>

          <div class="step-actions">
            <el-button @click="activeStep = 1">上一步</el-button>
            <el-button
              type="primary"
              color="var(--c-info)"
              :loading="loading"
              @click="submitResetPassword"
            >
              重置密码
            </el-button>
          </div>
        </el-form>
      </transition>
    </div>

    <div class="mode-links">
      <a href="#" class="mode-link" @click.prevent="backToLogin">返回账号登录</a>
      <span class="divider">|</span>
      <a href="#" class="mode-link" @click.prevent="emit('switch-mode', 'email-login')"
        >邮箱验证码登录</a
      >
    </div>
  </div>
</template>

<style scoped lang="scss">
.forgot-password-form-wrapper {
  width: 100%;
  max-width: 500px;
  margin: 0 auto;

  .header {
    margin-bottom: var(--auth-page-section-margin-bottom);

    .title {
      font-size: var(--font-size-xl);
      font-weight: 800;
      margin: 0 0 var(--space-2) 0;
      color: var(--t-primary-variant);
    }

    .subtitle {
      font-size: var(--font-size-base);
      color: var(--t-muted);
      margin: 0;
    }
  }

  .reset-steps {
    margin-bottom: clamp(16px, 2vw, 24px);
  }

  .step-panel {
    width: 100%;
    position: relative;
    min-height: clamp(260px, 38vh, 360px);
  }

  .step-fade-slide-enter-active,
  .step-fade-slide-leave-active {
    transition: all 0.32s ease-out;
    will-change: opacity, transform;
  }

  .step-fade-slide-enter-from {
    opacity: 0;
    transform: translateX(20px);
  }

  .step-fade-slide-leave-to {
    opacity: 0;
    transform: translateX(-20px);
  }

  .otp-wrapper {
    display: flex;
    align-items: center;
    gap: var(--auth-page-panel-gap);
    width: 100%;
    flex-wrap: wrap;

    .otp-input {
      letter-spacing: 2px;
      font-size: 16px;
      font-weight: 600;
      flex: 1;
      min-width: 0;
    }

    .otp-send-btn {
      display: flex;
      justify-content: center;
      align-items: center;
      width: 124px;
      height: 42px;
      flex-shrink: 0;
      border-radius: var(--radius-md);
      font-weight: 600;
      border-color: var(--c-primary-border);
      color: var(--c-primary);
      background-color: var(--c-primary-bg);
    }
  }

  .submit-btn {
    width: 100%;
    border-radius: var(--radius-md);
    font-weight: 600;
    font-size: var(--font-size-base);
    height: clamp(42px, 5vw, 48px);
    background-color: var(--c-info);
    border-color: var(--c-info);

    &:hover {
      background-color: var(--c-info-hover);
      border-color: var(--c-info-hover);
    }
  }

  .step-actions {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
    margin-top: 8px;
  }

  .mode-links {
    margin-top: 24px;
    text-align: center;
    font-size: 14px;

    .divider {
      margin: 0 10px;
      color: var(--t-placeholder);
    }

    .mode-link {
      color: var(--c-primary);
      text-decoration: none;
      font-weight: 600;

      &:hover {
        opacity: 0.8;
      }
    }
  }
}
</style>
