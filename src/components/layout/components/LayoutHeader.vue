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
const defaultAvatar = 'https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png'

const handleCommand = (command: string) => {
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
      <el-dropdown trigger="click" @command="handleCommand">
        <div class="user-profile">
          <el-avatar :size="32" :src="userInfo?.avatarUrl || defaultAvatar" />
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
  padding: 0 var(--layout-padding);
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
    gap: 8px;

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
    }

    .user-profile {
      display: flex;
      align-items: center;
      gap: 12px;
      cursor: pointer;
      outline: none;
      padding: 4px 8px;
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
</style>
