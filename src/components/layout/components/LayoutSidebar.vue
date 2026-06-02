<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useAppStore } from '@/stores/app'

defineProps<{
  isCollapse: boolean
}>()

const route = useRoute()
const appStore = useAppStore()
const activeMenu = computed(() => route.path)

// 移动端点击菜单后关闭抽屉
const handleMenuSelect = () => {
  if (appStore.isMobile) {
    appStore.closeSidebarDrawer()
  }
}
</script>

<template>
  <div class="sidebar-container" :class="{ 'is-collapse': isCollapse }">
    <!-- Logo 区域 -->
    <div class="logo-container">
      <transition name="logo-switch" mode="out-in">
        <span v-if="!isCollapse" key="full" class="logo-text">Admin Pro</span>
        <span v-else key="short" class="logo-text-short">AP</span>
      </transition>
    </div>

    <!-- 菜单区域 -->
    <el-scrollbar class="menu-scrollbar">
      <el-menu
        :default-active="activeMenu"
        :collapse="isCollapse"
        :unique-opened="true"
        :collapse-transition="false"
        text-color="var(--t-primary)"
        active-text-color="var(--c-primary)"
        router
        class="layout-menu"
        @select="handleMenuSelect"
      >
        <el-menu-item index="/dashboard">
          <el-icon><i-ep-data-analysis /></el-icon>
          <template #title>控制台</template>
        </el-menu-item>

        <el-sub-menu index="/user">
          <template #title>
            <el-icon><i-ep-user /></el-icon>
            <span>用户管理</span>
          </template>
          <el-menu-item index="/user/info">
            <el-icon><i-ep-postcard /></el-icon>
            <template #title>用户信息</template>
          </el-menu-item>
        </el-sub-menu>

        <el-sub-menu index="/system">
          <template #title>
            <el-icon><i-ep-setting /></el-icon>
            <span>系统管理</span>
          </template>
          <el-menu-item index="/system/role">
            <el-icon><i-ep-lock /></el-icon>
            <template #title>角色管理</template>
          </el-menu-item>
          <el-menu-item index="/system/permission">
            <el-icon><i-ep-menu /></el-icon>
            <template #title>权限管理</template>
          </el-menu-item>
        </el-sub-menu>
      </el-menu>
    </el-scrollbar>
  </div>
</template>

<style scoped lang="scss">
.sidebar-container {
  width: var(--layout-sidebar-width);
  height: 100%;
  background-color: var(--bg-white);
  border-right: 1px solid var(--border-light);
  transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  flex-direction: column;
  z-index: 10;
  box-shadow: var(--shadow-sm);
  will-change: width;
  flex-shrink: 0;

  &.is-collapse {
    width: var(--layout-sidebar-collapse-width);
  }

  .logo-container {
    height: 60px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--c-primary);
    font-weight: 900;
    font-size: 22px;
    letter-spacing: -0.5px;
    overflow: hidden;
    white-space: nowrap;
    border-bottom: 1px solid var(--border-light);
    background-color: transparent;

    .logo-text {
      font-size: 20px;
    }

    .logo-text-short {
      font-size: 24px;
    }

    .logo-switch-enter-active,
    .logo-switch-leave-active {
      transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .logo-switch-enter-from {
      opacity: 0;
      transform: scale(0.8);
    }

    .logo-switch-leave-to {
      opacity: 0;
      transform: scale(0.8);
    }
  }

  .menu-scrollbar {
    flex: 1;
    padding: 12px 8px;

    .layout-menu {
      border-right: none;
      background-color: transparent;

      :deep(.el-menu-item),
      :deep(.el-sub-menu__title) {
        height: 44px;
        line-height: 44px;
        border-radius: 8px; /* 胶囊圆角 */
        margin-bottom: 4px;
        color: var(--t-regular);
        background-color: transparent;
        transition: all 0.2s ease;

        &:hover {
          background-color: var(--bg-hover) !important;
          color: var(--t-primary) !important;
        }
      }

      :deep(.el-menu-item.is-active) {
        background-color: var(--c-primary-bg) !important;
        color: var(--c-primary) !important;
        font-weight: 600;
      }

      /* 子菜单展开时的背景色覆盖 */
      :deep(.el-menu) {
        background-color: transparent;
      }
    }
  }

  &.is-collapse {
    .menu-scrollbar {
      padding: 12px 8px;

      .layout-menu {
        width: 100%;

        :deep(.el-menu-item),
        :deep(.el-sub-menu__title) {
          border-radius: 8px;
          padding: 0 !important;
          width: 48px !important;
          height: 44px;
          margin: 0 auto 8px auto;
          justify-content: center;
          overflow: visible;
        }

        :deep(.el-menu-tooltip__trigger) {
          padding: 0 !important;
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
        }
      }
    }
  }
}
</style>
