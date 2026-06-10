<script setup lang="ts">
import { computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { useAppStore } from '@/stores/app'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()
const appStore = useAppStore()

const userInfo = computed(() => userStore.userInfo)
const currentRouteTitle = computed(() => (route.meta.title as string) || '控制台')

const avatarSrc = computed(() => {
  const avatarUrl = userInfo.value?.avatarUrl

  if (!avatarUrl) {
    return ''
  }

  const normalized = avatarUrl.trim()

  if (!normalized) {
    return ''
  }

  if (normalized.startsWith('//')) {
    return `${window.location.protocol}${normalized}`
  }

  if (normalized.startsWith('http://') || normalized.startsWith('https://')) {
    return normalized
  }

  if (normalized.startsWith('/')) {
    return normalized
  }

  return `/${normalized}`
})

const avatarFallbackText = computed(() => {
  const candidate =
    userInfo.value?.username?.trim() || userInfo.value?.nickname?.trim() || 'A'

  return candidate.slice(0, 1).toUpperCase()
})

const refreshContent = async (event: MouseEvent) => {
  if (event.ctrlKey) {
    window.location.reload()
    return
  }

  await appStore.refreshCurrentView()
}

const runUserMenuCommand = (command: string) => {
  if (command === 'logout') {
    ElMessageBox.confirm('确定要退出登录吗？', 'Tip', {
      confirmButtonText: 'Logout',
      cancelButtonText: 'Cancel',
      type: 'warning'
    })
      .then(() => {
        userStore.logout()
        router.push('/auth')
        ElNotification({
          title: 'Logout Success！',
          message: '已退出登录',
          type: 'success',
          position: 'top-right'
        })
      })
      .catch(() => {})
  } else if (command === 'profile') {
    ElNotification({
      title: 'Tip',
      message: '个人中心功能开发中...',
      type: 'info',
      position: 'top-right'
    })
  }
}
</script>

<template>
  <div class="header-container">
    <div class="left-section">
      <!-- 菜单折叠控制 -->
      <el-icon class="collapse-icon" @click="appStore.toggleSidebar()">
        <i-ep-expand v-if="appStore.sidebarCollapse || appStore.isMobile" />
        <i-ep-fold v-else />
      </el-icon>

      <!-- 面包屑导航（移动端隐藏） -->
      <el-breadcrumb separator="/" class="header-breadcrumb">
        <el-breadcrumb-item :to="{ path: '/dashboard' }">首页</el-breadcrumb-item>
        <el-breadcrumb-item v-if="currentRouteTitle !== '首页'">{{
          currentRouteTitle
        }}</el-breadcrumb-item>
      </el-breadcrumb>
    </div>

    <div class="right-section">
      <!-- 局部刷新按钮 -->
      <el-tooltip content="点击局部刷新，Ctrl + 点击整页刷新" placement="bottom">
        <el-button
          circle
          text
          class="action-btn"
          :disabled="appStore.isRefreshingContent"
          @click="refreshContent"
        >
          <el-icon :size="20" :class="{ 'is-spinning': appStore.isRefreshingContent }">
            <i-ep-refresh />
          </el-icon>
        </el-button>
      </el-tooltip>
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

      <!-- 用户信息下拉菜单 -->
      <el-dropdown trigger="click" @command="runUserMenuCommand">
        <div class="user-profile">
          <el-avatar
            :style="{ backgroundColor: avatarSrc ? 'var(--bg-page-light)' : 'var(--c-info)' }"
            :size="32"
            :src="avatarSrc"
          >
            {{ avatarFallbackText }}
          </el-avatar>
          <span class="username">{{ userInfo?.nickname || userInfo?.username || 'Admin' }}</span>
          <el-icon><i-ep-arrow-down /></el-icon>
        </div>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item command="profile">
              <el-icon><i-ep-user /></el-icon>个人中心
            </el-dropdown-item>
            <el-dropdown-item divided command="logout">
              <el-icon><i-ep-switch-button /></el-icon>退出登录
            </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>
  </div>
</template>

<style scoped lang="scss">
.header-container {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 var(--layout-page-padding-inline);
  background-color: var(--bg-white);
  border-bottom: 1px solid var(--border-light);
  box-shadow: var(--shadow-sm);

  .left-section {
    display: flex;
    align-items: center;
    gap: var(--layout-gap);

    .collapse-icon {
      font-size: 20px;
      cursor: pointer;
      color: var(--t-regular);
      transition: color 0.3s;

      &:hover {
        color: var(--c-primary);
      }
    }

    .header-breadcrumb {
      @include respond-to(mobile) {
        display: none;
      }
    }
  }

  .right-section {
    display: flex;
    align-items: center;
    gap: var(--space-2);

    .action-btn {
      color: var(--t-regular);
      width: 40px;
      height: 40px;
      border: none;
      transition: all 0.2s ease;

      &:hover {
        background-color: var(--bg-page);
        color: var(--c-primary);
      }

      .is-spinning {
        animation: refresh-rotate 0.8s linear infinite;
      }
    }

    .user-profile {
      display: flex;
      align-items: center;
      gap: var(--space-3);
      cursor: pointer;
      outline: none;
      padding: var(--space-1) var(--space-2);
      border-radius: var(--radius-sm);
      transition: background-color 0.2s;

      &:hover {
        background-color: var(--bg-hover);
      }

      .username {
        font-size: 14px;
        font-weight: 500;
        color: var(--t-primary);

        @include respond-to(mobile) {
          display: none;
        }
      }
    }

    :deep(.el-button + .el-button) {
      margin-left: 0 !important;
    }
  }
}

@keyframes refresh-rotate {
  from {
    transform: rotate(0deg);
  }

  to {
    transform: rotate(360deg);
  }
}
</style>
