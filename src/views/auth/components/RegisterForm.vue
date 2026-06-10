<script setup lang="ts">
import { ref, onBeforeUnmount } from 'vue'
import type { FormInstance, FormRules } from 'element-plus'
import { register, sendEmailCode, verifyEmailCode, getEncryptKey } from '@/api/auth'
import { Message } from '@/utils/message'
import { encryptAES } from '@/utils/crypto'

const formRef = ref<FormInstance | null>(null)

const emit = defineEmits<{
  (e: 'password-focus'): void
  (e: 'password-blur'): void
  (e: 'switch-mode', mode: 'register' | 'login' | 'email-login' | 'email-register'): void
}>()

const model = ref({
  username: '',
  email: '',
  password: '',
  emailCode: '',
  terms: false
})

const rules = ref<FormRules>({
  username: [
    { required: true, message: '请输入用户名', trigger: ['blur', 'change'] },
    { pattern: /^[a-zA-Z0-9]+$/, message: '用户名仅允许字母和数字', trigger: ['blur', 'change'] }
  ],
  email: [
    { required: true, message: '请输入邮箱', trigger: ['blur', 'change'] },
    { type: 'email', message: '请输入有效的邮箱格式', trigger: ['blur', 'change'] }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: ['blur', 'change'] },
    { pattern: /^[^\s]+$/, message: '密码不允许包含空格', trigger: ['blur', 'change'] }
  ],
  emailCode: [
    { required: true, message: '请输入6位验证码', trigger: ['blur', 'change'] },
    { len: 6, message: '验证码必须是6位', trigger: ['blur', 'change'] },
    { pattern: /^\d+$/, message: '验证码只能包含数字', trigger: ['blur', 'change'] }
  ]
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

const sendRegisterEmailCode = async () => {
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
    const res = await sendEmailCode(email, 'register')
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

const submitRegister = () => {
  formRef.value?.validate(async valid => {
    if (valid) {
      if (!model.value.terms) {
        Message.warning('请先同意服务条款和隐私政策')
        return
      }
      loading.value = true
      try {
        // 即时获取动态密钥
        const keyRes = await getEncryptKey()

        // 使用动态密钥对密码进行 AES 加密
        const encryptedPassword = encryptAES(model.value.password, keyRes.aesKey)

        const verifyRes = await verifyEmailCode(
          model.value.email.trim(),
          model.value.emailCode,
          'register'
        )

        await register({
          username: model.value.username.trim(),
          email: model.value.email.trim(),
          password: encryptedPassword,
          emailVerifyTicket: verifyRes.emailVerifyTicket,
          keyId: keyRes.keyId
        })

        ElNotification({
          title: 'Account Created',
          message: '注册成功！欢迎使用 Admin Pro',
          type: 'success',
          duration: 2500
        })
        emit('switch-mode', 'login')
      } catch (error) {
        console.error('Register Error:', error)
      } finally {
        loading.value = false
      }
    } else {
      Message.error('请检查您的输入格式')
    }
  })
}

const socialRegister = () => {
  emit('switch-mode', 'email-register')
}
</script>

<template>
  <div class="register-form-wrapper">
    <div class="header">
      <h1 class="title">Create an account</h1>
      <p class="subtitle">Join us to get unlimited access to data & information.</p>
    </div>

    <el-form
      ref="formRef"
      :model="model"
      :rules="rules"
      size="large"
      label-position="top"
      @submit.prevent="submitRegister"
    >
      <!-- 用户名输入 -->
      <el-form-item prop="username" label="Username">
        <el-input v-model="model.username" placeholder="Enter your username" clearable />
      </el-form-item>

      <!-- 邮箱输入 -->
      <el-form-item prop="email" label="Email">
        <el-input v-model="model.email" placeholder="Enter your email address" clearable />
      </el-form-item>

      <!-- 密码输入 -->
      <el-form-item prop="password" label="Password">
        <el-input
          v-model="model.password"
          type="password"
          show-password
          placeholder="Enter password"
          @focus="emit('password-focus')"
          @blur="emit('password-blur')"
        />
      </el-form-item>

      <!-- 验证码输入 -->
      <el-form-item prop="emailCode" label="Verification Code">
        <div class="otp-wrapper">
          <el-input-otp v-model="model.emailCode" :length="6" size="large" class="otp-input" />
          <el-button
            class="otp-send-btn"
            :loading="sendingCode"
            :disabled="countdown > 0"
            @click="sendRegisterEmailCode"
          >
            {{ countdown > 0 ? `${countdown}s 后重发` : '发送验证码' }}
          </el-button>
        </div>
      </el-form-item>

      <!-- 条款同意 -->
      <div class="form-actions">
        <el-checkbox v-model="model.terms">
          I agree to the
          <router-link to="/legal/terms" target="_blank" class="terms-link"
            >Terms of Service</router-link
          >
          and
          <router-link to="/legal/privacy" target="_blank" class="terms-link"
            >Privacy Policy</router-link
          >
        </el-checkbox>
      </div>

      <!-- 注册按钮 -->
      <el-button
        type="primary"
        size="large"
        native-type="submit"
        :loading="loading"
        class="register-btn"
      >
        Sign Up
      </el-button>
    </el-form>

    <el-divider class="social-divider">Or, Register with</el-divider>

    <el-button size="large" class="social-btn" @click="socialRegister">
      <el-icon color="var(--c-primary)" size="24px" class="social-icon"><i-ep-message /></el-icon>
      Sign up with Email
    </el-button>

    <div class="login-prompt">
      Already have an account ?
      <a href="#" class="login-link" @click.prevent="emit('switch-mode', 'login')">Login here</a>
    </div>
  </div>
</template>

<style scoped lang="scss">
.register-form-wrapper {
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

  .form-actions {
    display: flex;
    justify-content: flex-start;
    align-items: center;
    margin-bottom: var(--form-item-margin-bottom);
  }

  .terms-link,
  .login-link {
    color: var(--c-primary);
    text-decoration: none;
    font-weight: 600;
    transition: opacity 0.2s;

    &:hover {
      opacity: 0.8;
    }
  }

  .register-btn {
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

  .social-divider {
    margin: 32px 0;
  }

  .social-btn {
    width: 100%;
    border-radius: var(--radius-md);
    font-weight: 500;
    color: var(--t-regular);
    background-color: var(--bg-white);
    border-color: var(--border-base);
    height: 48px;
    transition: all 0.2s ease;

    &:hover {
      background-color: var(--bg-page-light);
      border-color: var(--c-primary-focus-ring);
      color: var(--c-primary);
    }

    .social-icon {
      margin-right: 8px;
    }
  }

  .login-prompt {
    text-align: center;
    margin-top: 32px;
    font-size: 14px;
    color: var(--t-secondary);
    font-weight: 500;
  }
}
</style>
