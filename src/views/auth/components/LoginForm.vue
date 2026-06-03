<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import type { FormInstance, FormRules, FormItemRule } from 'element-plus'
import { login, getCaptcha, getEncryptKey } from '@/api/auth'
import { Message } from '@/utils/message'
import { useUserStore } from '@/stores/user'
import { encryptAES } from '@/utils/crypto'

const formRef = ref<FormInstance | null>(null)
const router = useRouter()
const userStore = useUserStore()

const emit = defineEmits<{
  (e: 'password-focus'): void
  (e: 'password-blur'): void
  (e: 'switch-mode', mode: 'register'): void
}>()

const model = ref({
  username: '',
  password: '',
  otp: '',
  terms: false
})

const validateUsernameOrEmail = (
  rule: FormItemRule,
  value: string,
  callback: (error?: Error) => void
) => {
  if (!value) {
    callback(new Error('请输入用户名或邮箱'))
    return
  }
  const isUsername = /^[a-zA-Z0-9]+$/.test(value)
  const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)

  if (!isUsername && !isEmail) {
    callback(new Error('格式错误，请输入有效的用户名（字母/数字）或邮箱'))
  } else {
    callback()
  }
}

const rules = ref<FormRules>({
  username: [
    { required: true, message: '请输入用户名或邮箱', trigger: ['blur', 'change'] },
    { validator: validateUsernameOrEmail, trigger: ['blur', 'change'] }
  ],
  password: [{ required: true, message: '请输入密码', trigger: ['blur', 'change'] }],
  otp: [
    { required: true, message: '请输入6位验证码', trigger: ['blur', 'change'] },
    { len: 6, message: '验证码必须是6位', trigger: ['blur', 'change'] },
    { pattern: /^\d+$/, message: '验证码只能包含数字', trigger: ['blur', 'change'] }
  ]
})

const loading = ref(false)
const captchaId = ref('')
const captchaCode = ref('------')

const refreshCaptcha = async () => {
  try {
    const res = await getCaptcha()
    captchaId.value = res.captchaId
    captchaCode.value = res.code
  } catch (error) {
    console.error('Get Captcha Error:', error)
  }
}

onMounted(() => {
  refreshCaptcha()
})

const handleLogin = () => {
  formRef.value?.validate(async valid => {
    if (valid) {
      if (!model.value.terms) {
        ElMessage({
          message: '请先同意服务条款和隐私政策',
          showClose: true,
          type: 'warning',
          plain: true
        })
        return
      }
      loading.value = true
      try {
        const keyRes = await getEncryptKey()
        const encryptedPassword = encryptAES(model.value.password, keyRes.aesKey)

        const res = await login({
          username: model.value.username,
          password: encryptedPassword,
          otp: model.value.otp,
          captchaId: captchaId.value,
          keyId: keyRes.keyId
        })

        // 将双 Token 和 用户信息存入 Pinia (会自动持久化到 LocalStorage)
        userStore.setTokens(res.accessToken, res.refreshToken)
        userStore.setUserInfo(res.userInfo)

        ElNotification({
          title: 'Welcome Back',
          message: '登录成功，欢迎回到Admin Pro！',
          type: 'success',
          duration: 2000
        })
        const redirectUrl: string | undefined =
          (router.currentRoute.value.query.redirect as string | undefined) || '/dashboard'
        router.push(redirectUrl)
      } catch (error) {
        console.error('Login Error:', error)
        refreshCaptcha()
      } finally {
        loading.value = false
      }
    } else {
      Message.error('请检查您的输入格式')
    }
  })
}

const socialLogin = () => {
  ElNotification({
    title: 'Feature Coming Soon',
    message: '社交账号登录功能正在接入中，敬请期待！',
    type: 'info'
  })
}

const forgetPassword = () => {
  ElNotification({
    title: 'Reset Password',
    message: '重置密码模块开发中...',
    type: 'info'
  })
}
</script>

<template>
  <div class="login-form-wrapper">
    <div class="header">
      <h1 class="title">Welcome!</h1>
      <p class="subtitle">Enter to get unlimited access to data & information.</p>
    </div>

    <el-form
      ref="formRef"
      :model="model"
      :rules="rules"
      size="large"
      label-position="top"
      @submit.prevent="handleLogin"
    >
      <!-- 账号输入 -->
      <el-form-item prop="username" label="Username">
        <el-input v-model="model.username" placeholder="Enter your username" clearable />
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
      <el-form-item prop="otp" label="Verification Code">
        <div class="otp-wrapper">
          <el-input-otp v-model="model.otp" :length="6" size="large" class="otp-input" />
          <div class="otp-display" title="点击刷新验证码" @click="refreshCaptcha">
            <span class="capatcha-content">{{ captchaCode }}</span>
          </div>
        </div>
      </el-form-item>

      <!-- 条款同意 -->
      <div class="form-terms">
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

      <!-- 登录按钮 -->
      <el-button
        type="primary"
        size="large"
        native-type="submit"
        :loading="loading"
        class="login-btn"
      >
        Log In
      </el-button>

      <!-- 忘记密码 -->
      <div class="form-actions">
        <a href="#" class="forgot-link" @click.prevent="forgetPassword"> Forgot your password ? </a>
      </div>
    </el-form>

    <el-divider class="social-divider">Or, Login with</el-divider>

    <el-button size="large" class="social-btn" @click="socialLogin">
      <el-icon color="var(--c-primary)" size="24px" class="social-icon"><i-ep-message /></el-icon>
      Sign in with Email
    </el-button>

    <div class="register-prompt">
      Don't have an account ?
      <a href="#" class="register-link" @click.prevent="emit('switch-mode', 'register')"
        >Register here</a
      >
    </div>
  </div>
</template>

<style scoped lang="scss">
.login-form-wrapper {
  width: 100%;
  max-width: 440px;
  margin: 0 auto;

  .header {
    margin-bottom: clamp(20px, 3vw, 32px);

    .title {
      font-size: var(--font-size-xl);
      font-weight: 800;
      margin: 0 0 8px 0;
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
    gap: 12px;
    width: 100%;
    flex-wrap: wrap;

    .otp-input {
      letter-spacing: 2px;
      font-size: 16px;
      font-weight: 600;
      flex: 1;
      min-width: 0;
    }

    .otp-display {
      display: flex;
      justify-content: center;
      align-items: center;
      width: 120px;
      height: 40px;
      flex-shrink: 0;
      background-color: var(--c-primary-bg);
      border-radius: var(--radius-md);
      border: 1px solid var(--c-primary-border);
      cursor: pointer;
      transition: all 0.2s ease;

      &:hover {
        background-color: var(--c-primary-border);
        border-color: var(--c-primary-border-hover);
      }

      .capatcha-content {
        font-family: monospace;
        font-size: 20px;
        font-weight: bold;
        letter-spacing: 4px;
        color: var(--c-primary-dark);
        user-select: none;
      }
    }
  }

  .form-terms {
    margin-bottom: 24px;
  }

  .form-actions {
    display: flex;
    justify-content: center;
    align-items: center;
    margin-top: 10px;
  }

  .forgot-link,
  .terms-link,
  .register-link {
    color: var(--c-primary);
    text-decoration: none;
    font-weight: 600;
    font-size: 14px;
    transition: opacity 0.2s;

    &:hover {
      opacity: 0.8;
    }
  }

  .login-btn {
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
    display: flex;
    align-items: center;
    justify-content: center;

    .social-icon {
      margin-right: 8px;
    }

    &:hover {
      background-color: var(--bg-page-light);
      border-color: var(--c-primary-focus-ring);
      color: var(--c-primary);
    }
  }

  .register-prompt {
    text-align: center;
    margin-top: 32px;
    font-size: 14px;
    color: var(--t-secondary);
    font-weight: 500;
  }
}
</style>
