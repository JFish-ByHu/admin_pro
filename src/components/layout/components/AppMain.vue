<script setup lang="ts">
import { useAppStore } from '@/stores/app'

// AppMain 负责主内容区域的路由渲染与过渡动画
const appStore = useAppStore()
</script>

<template>
  <section class="app-main-container">
    <router-view v-slot="{ Component, route }">
      <transition name="fade-transform" mode="out-in">
        <keep-alive>
          <component :is="Component" v-if="appStore.appMainVisible" :key="route.path" />
        </keep-alive>
      </transition>
    </router-view>
  </section>
</template>

<style scoped lang="scss">
.app-main-container {
  flex: 1;
  width: 100%;
  position: relative;
  overflow-y: auto;
  overflow-x: hidden;
  padding: var(--layout-padding);
  background-color: var(--bg-page);
  box-sizing: border-box;
}

/* 路由切换过渡动画 */
.fade-transform-leave-active,
.fade-transform-enter-active {
  transition: all 0.3s cubic-bezier(0.55, 0, 0.1, 1);
}

.fade-transform-enter-from {
  opacity: 0;
  transform: translateX(-30px);
}

.fade-transform-leave-to {
  opacity: 0;
  transform: translateX(30px);
}
</style>
