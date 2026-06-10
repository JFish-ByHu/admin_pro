<script setup lang="ts">
import { computed, ref, onBeforeUnmount, watch, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import type { FormInstance, FormRules } from 'element-plus'
import { emailLogin, register, sendEmailCode, verifyEmailCode, getEncryptKey } from '@/api/auth'
import { Message } from '@/utils/message'
import { useUserStore } from '@/stores/user'
import { encryptAES } from '@/utils/crypto'

type EmailAuthMode = 'login' | 'register'

const props = defineProps<{
  mode: EmailAuthMode
}>()

const emit = defineEmits<{
  (e: 'password-focus'): void
  (e: 'password-blur'): void
  (e: 'switch-mode', mode: 'login' | 'register' | 'email-login' | 'email-register'): void
}>()

const formRef = ref<FormInstance | null>(null)
const router = useRouter()
const userStore = useUserStore()

const model = ref({
  email: '',
  password: '',
  emailCode: ''
})

const isRegisterMode = computed(() => props.mode === 'register')
const scene = computed(() => (isRegisterMode.value ? 'register' : 'login'))

const titleText = computed(() => (isRegisterMode.value ? 'Email Register' : 'Email Login'))
const subtitleText = computed(() => {
  return isRegisterMode.value
    ? 'Create account with email, password and verification code.'
    : 'Use your email and verification code to sign in.'
})
const submitText = computed(() => {
  return isRegisterMode.value ? 'Sign Up with Email' : 'Sign In with Email'
})

const rules = computed<FormRules>(() => {
  const baseRules: FormRules = {
    email: [
      { required: true, message: '请输入邮箱', trigger: ['blur', 'change'] },
      { type: 'email', message: '请输入有效的邮箱格式', trigger: ['blur', 'change'] }
    ],
    emailCode: [
      { required: true, message: '请输入6位验证码', trigger: ['blur', 'change'] },
      { len: 6, message: '验证码必须是6位', trigger: ['blur', 'change'] },
      { pattern: /^\d+$/, message: '验证码只能包含数字', trigger: ['blur', 'change'] }
    ]
  }

  if (isRegisterMode.value) {
    baseRules.password = [
      { required: true, message: '请输入密码', trigger: ['blur', 'change'] },
      { pattern: /^[^\s]+$/, message: '密码不允许包含空格', trigger: ['blur', 'change'] },
      { min: 6, max: 20, message: '密码长度必须在6-20个字符之间', trigger: ['blur', 'change'] }
    ]
  }

  return baseRules
})

const loading = ref(false)
const sendingCode = ref(false)
const countdown = ref(0)
let countdownTimer: number | null = null

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

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

watch(
  () => props.mode,
  () => {
    // 切换登录/注册模式时，清理遗留校验态，避免未交互先报错
    model.value.password = ''
    model.value.emailCode = ''
    nextTick(() => {
      formRef.value?.clearValidate()
    })
  }
)

const sendEmailVerificationCode = async () => {
  if (countdown.value > 0 || sendingCode.value) {
    return
  }

  const email = model.value.email.trim()
  if (!emailPattern.test(email)) {
    Message.warning('请先输入有效的邮箱地址')
    return
  }

  sendingCode.value = true
  try {
    const res = await sendEmailCode(email, scene.value)
    startCountdown(res.cooldownSeconds)
    ElNotification({
      title: 'Verification Code Sent',
      message: `验证码已发送至 ${email}`,
      type: 'success',
      duration: 1500
    })
  } finally {
    sendingCode.value = false
  }
}

const switchBottomLink = () => {
  emit('switch-mode', isRegisterMode.value ? 'email-login' : 'email-register')
}

const switchClassicLink = () => {
  emit('switch-mode', isRegisterMode.value ? 'register' : 'login')
}

const submitEmailAuth = () => {
  formRef.value?.validate(async valid => {
    if (!valid) {
      Message.error('请检查您的输入格式')
      return
    }

    loading.value = true
    try {
      const email = model.value.email.trim()
      const verifyRes = await verifyEmailCode(email, model.value.emailCode, scene.value)

      if (isRegisterMode.value) {
        const keyRes = await getEncryptKey()
        const encryptedPassword = encryptAES(model.value.password, keyRes.aesKey)

        await register({
          email,
          password: encryptedPassword,
          emailVerifyTicket: verifyRes.emailVerifyTicket,
          keyId: keyRes.keyId
        })

        ElNotification({
          title: 'Account Created',
          message: '邮箱注册成功！请使用邮箱验证码登录。',
          type: 'success',
          duration: 2500
        })

        emit('switch-mode', 'email-login')
        return
      }

      const res = await emailLogin({
        email,
        emailVerifyTicket: verifyRes.emailVerifyTicket
      })

      userStore.setTokens(res.accessToken, res.refreshToken)
      userStore.setUserInfo(res.userInfo)

      ElNotification({
        title: 'Welcome Back',
        message: '邮箱登录成功，欢迎回到 Admin Pro！',
        type: 'success',
        duration: 2000
      })

      const redirectUrl: string | undefined =
        (router.currentRoute.value.query.redirect as string | undefined) || '/dashboard'
      router.push(redirectUrl)
    } finally {
      loading.value = false
    }
  })
}
</script>

<template>
  <div class="email-auth-form-wrapper">
    <div class="header">
      <h1 class="title">{{ titleText }}</h1>
      <p class="subtitle">{{ subtitleText }}</p>
    </div>

    <el-form
      ref="formRef"
      :model="model"
      :rules="rules"
      :validate-on-rule-change="false"
      size="large"
      label-position="top"
      @submit.prevent="submitEmailAuth"
    >
      <el-form-item prop="email" label="Email">
        <el-input v-model="model.email" placeholder="Enter your email address" clearable />
      </el-form-item>

      <el-form-item v-if="isRegisterMode" prop="password" label="Password">
        <el-input
          v-model="model.password"
          type="password"
          show-password
          placeholder="Enter password"
          @focus="emit('password-focus')"
          @blur="emit('password-blur')"
        />
      </el-form-item>

      <el-form-item prop="emailCode" label="Verification Code">
        <div class="otp-wrapper">
          <el-input-otp v-model="model.emailCode" :length="6" size="large" class="otp-input" />
          <el-button
            class="otp-send-btn"
            :loading="sendingCode"
            :disabled="countdown > 0"
            @click="sendEmailVerificationCode"
          >
            {{ countdown > 0 ? `${countdown}s 后重发` : '发送验证码' }}
          </el-button>
        </div>
      </el-form-item>

      <el-button
        type="primary"
        size="large"
        native-type="submit"
        :loading="loading"
        class="submit-btn"
      >
        {{ submitText }}
      </el-button>
    </el-form>

    <div class="mode-links">
      <a href="#" class="mode-link" @click.prevent="switchBottomLink">
        {{ isRegisterMode ? 'Login with Email' : 'Register by Email' }}
      </a>
      <span class="divider">|</span>
      <a href="#" class="mode-link" @click.prevent="switchClassicLink">
        {{ isRegisterMode ? 'Register by Username' : 'Login with Username' }}
      </a>
    </div>
  </div>
</template>

<style scoped lang="scss">
.email-auth-form-wrapper {
  width: 100%;
  max-width: 440px;
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
