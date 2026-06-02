<script setup lang="ts">
import { useAppStore } from '@/stores/app'

defineProps<{
  size?: number
  color?: string
}>()

const appStore = useAppStore()
</script>

<template>
  <div class="auth-header">
    <div class="application-logo">
      <el-icon :size="size || 32" :color="color || '#409EFF'">
        <i-ep-platform />
      </el-icon>
      <span class="logo-text" :style="{ fontSize: `${(size || 32) * 0.6}px` }">Admin Pro</span>
    </div>

    <div class="actions">
      <!-- 亮暗色切换按钮 -->
      <el-tooltip :content="appStore.isDark ? 'light' : 'dark'" placement="bottom">
        <el-button
          circle
          text
          class="action-btn"
          @click="(e: MouseEvent) => appStore.toggleDarkWithTransition(e)"
        >
          <el-icon :size="20">
            <i-ep-moon v-if="appStore.isDark" />
            <i-ep-sunny v-else />
          </el-icon>
        </el-button>
      </el-tooltip>

      <!-- 全屏切换按钮 -->
      <el-tooltip
        :content="appStore.isFullscreen ? 'exit fullscreen' : 'fullscreen'"
        placement="bottom"
      >
        <el-button circle text class="action-btn" @click="appStore.toggleFullscreen()">
          <el-icon :size="20">
            <i-ep-full-screen v-if="!appStore.isFullscreen" />
            <i-ep-bottom-left v-else />
          </el-icon>
        </el-button>
      </el-tooltip>
    </div>
  </div>
</template>

<style scoped lang="scss">
.auth-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;

  .application-logo {
    display: inline-flex;
    align-items: center;
    gap: 8px;

    .logo-text {
      font-weight: 800;
      color: var(--t-primary);
      letter-spacing: -0.5px;

      @include respond-to(mobile) {
        font-size: 16px !important;
      }
    }
  }

  .actions {
    display: flex;
    align-items: center;
    gap: 4px;

    .action-btn {
      color: var(--t-regular);
      width: 36px;
      height: 36px;
      transition: all 0.2s ease;

      &:hover {
        background-color: var(--bg-page);
        color: var(--c-primary);
      }
    }
  }
}
</style>
