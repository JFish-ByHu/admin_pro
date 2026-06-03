<script setup lang="ts">
import { ref, computed } from 'vue'
import { AuthBg, AuthHeader, LoginForm, RegisterForm } from './CompsExport'

// 控制当前显示的是登录还是注册表单
const currentMode = ref<'login' | 'register'>('login')

// 动态渲染登录 / 注册表单组件
const currentFormComponent = computed(() => {
  return currentMode.value === 'login' ? LoginForm : RegisterForm
})

// 控制背景眼睛是否闭合的状态
const isBlind = ref(false)

const activateBlindMode = () => {
  isBlind.value = true
}

const deactivateBlindMode = () => {
  isBlind.value = false
}

const switchAuthMode = (mode: 'login' | 'register') => {
  currentMode.value = mode
  isBlind.value = false
}
</script>

<template>
  <div class="auth-layout">
    <div class="left-panel">
      <div class="header-wrapper">
        <AuthHeader :size="40" color="var(--c-primary)" />
      </div>
      <div class="form-wrapper">
        <transition name="fade-slide" mode="out-in">
          <component
            :is="currentFormComponent"
            @password-focus="activateBlindMode"
            @password-blur="deactivateBlindMode"
            @switch-mode="switchAuthMode"
          />
        </transition>
      </div>
    </div>
    <div class="right-panel">
      <AuthBg :is-blind="isBlind" />
    </div>
  </div>
</template>

<style scoped lang="scss">
.auth-layout {
  display: flex;
  min-height: 100vh;
  width: 100%;
  background-color: var(--bg-page);

  .left-panel {
    flex: 1;
    display: flex;
    flex-direction: column;
    background-color: var(--bg-white);
    position: relative;
    z-index: 1;
    box-shadow: 10px 0 25px rgba(0, 0, 0, 0.05);

    .header-wrapper {
      padding: clamp(20px, 4vw, 40px) clamp(24px, 5vw, 48px);
      width: 100%;
      box-sizing: border-box;
    }

    .form-wrapper {
      flex: 1;
      display: flex;
      flex-direction: column;
      justify-content: center;
      padding: 0 clamp(24px, 5vw, 48px) 64px;
    }
  }

  .right-panel {
    flex: 1;
    display: none;
    background-color: var(--bg-dark);
    position: relative;
    overflow: hidden;

    @include respond-to(desktop) {
      display: block;
    }
  }
}

/* 切换动画 */
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: all 0.3s ease-out;
}

.fade-slide-enter-from {
  opacity: 0;
  transform: translateX(20px);
}

.fade-slide-leave-to {
  opacity: 0;
  transform: translateX(-20px);
}
</style>
