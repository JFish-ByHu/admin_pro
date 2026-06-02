<script setup lang="ts">
import { DotLottieVue } from '@lottiefiles/dotlottie-vue'

defineProps<{
  lottieSrc: string
  title: string
  subtitle: string
  btnText: string
}>()

const emit = defineEmits<{
  (e: 'action'): void
}>()
</script>

<template>
  <div class="exception-wrapper">
    <div class="animation-container">
      <DotLottieVue :src="lottieSrc" autoplay loop class="lottie-player" />
    </div>
    <div class="content-container">
      <h1 class="title">{{ title }}</h1>
      <p class="subtitle">{{ subtitle }}</p>
      <el-button type="primary" size="large" class="action-btn" @click="emit('action')">
        {{ btnText }}
      </el-button>
    </div>
  </div>
</template>

<style scoped lang="scss">
.exception-wrapper {
  min-height: 100vh;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background-color: var(--bg-page);
  transition: background-color 0.3s ease;
  padding: var(--layout-padding);
  box-sizing: border-box;
}

.animation-container {
  width: 100%;
  max-width: clamp(300px, 50vw, 600px);
  height: auto;
  aspect-ratio: 1 / 1;
  display: flex;
  justify-content: center;
  align-items: center;
  margin-bottom: -40px;

  .lottie-player {
    width: 100%;
    height: 100%;
  }
}

.content-container {
  text-align: center;
  max-width: 500px;
  z-index: 1;
  padding: 0 var(--layout-padding);

  .title {
    font-size: var(--font-size-xl);
    font-weight: 800;
    color: var(--t-primary);
    margin-bottom: 16px;
    letter-spacing: -0.5px;
    transition: color 0.3s ease;
  }

  .subtitle {
    font-size: var(--font-size-base);
    color: var(--t-secondary);
    line-height: 1.6;
    margin-bottom: 32px;
    transition: color 0.3s ease;
  }

  .action-btn {
    font-weight: 600;
    padding: 0 32px;
    border-radius: 8px;
    background-color: var(--c-primary);
    border-color: var(--c-primary);
    transition:
      transform 0.2s ease,
      background-color 0.3s ease,
      border-color 0.3s ease;

    &:hover {
      background-color: var(--c-primary-hover);
      border-color: var(--c-primary-hover);
      transform: translateY(-2px);
    }
  }
}
</style>
