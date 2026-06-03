<script setup lang="ts">
import { ref, onMounted } from 'vue'
import type { FormInstance, FormRules } from 'element-plus'
import { register, getCaptcha, getEncryptKey } from '@/api/auth'
import { Message } from '@/utils/message'
import { encryptAES } from '@/utils/crypto'

const formRef = ref<FormInstance | null>(null)

const emit = defineEmits<{
  (e: 'password-focus'): void
  (e: 'password-blur'): void
  (e: 'switch-mode', mode: 'login'): void
}>()

const model = ref({
  username: '',
  email: '',
  password: '',
  otp: '',
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
    model.value.otp = '' // 刷新时清空输入框
  } catch (error) {
    console.error('Get Captcha Error:', error)
  }
}

onMounted(() => {
  refreshCaptcha()
})

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

        await register({
          username: model.value.username,
          email: model.value.email,
          password: encryptedPassword,
          otp: model.value.otp,
          captchaId: captchaId.value,
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
        refreshCaptcha() // 注册失败自动刷新验证码
      } finally {
        loading.value = false
      }
    } else {
      Message.error('请检查您的输入格式')
    }
  })
}

const socialRegister = () => {
  ElNotification({
    title: 'Feature Coming Soon',
    message: '社交账号注册功能正在接入中，敬请期待！',
    type: 'info'
  })
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
      <el-form-item prop="otp" label="Verification Code">
        <div class="otp-wrapper">
          <el-input-otp v-model="model.otp" :length="6" size="large" class="otp-input" />
          <div class="otp-display" title="点击刷新验证码" @click="refreshCaptcha">
            <span class="capatcha-content">{{ captchaCode }}</span>
          </div>
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

  .form-actions {
    display: flex;
    justify-content: flex-start;
    align-items: center;
    margin-bottom: 24px;
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
