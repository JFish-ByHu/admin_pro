<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useAppStore } from '@/stores/app'
import { useUserStore } from '@/stores/user'
import type { UserMenuTreeNode } from '@/types/auth'
import SidebarMenuNode from './SidebarMenuNode.vue'

defineProps<{
  isCollapse: boolean
}>()

const route = useRoute()
const appStore = useAppStore()
const userStore = useUserStore()
const activeMenu = computed(() => route.path)
const sortMenuTree = (nodes: UserMenuTreeNode[]): UserMenuTreeNode[] => {
  return [...nodes]
    .sort((a, b) => a.sort - b.sort)
    .map(node => ({
      ...node,
      children: sortMenuTree(node.children || [])
    }))
}

const sidebarMenuTree = computed(() => {
  return sortMenuTree(userStore.menuTree).filter(
    item => item.type === 'directory' || item.routePath
  )
})

// 移动端点击菜单后关闭抽屉
const selectMenu = () => {
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
        @select="selectMenu"
      >
        <SidebarMenuNode v-for="menuNode in sidebarMenuTree" :key="menuNode.id" :node="menuNode" />
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
    padding: var(--space-3) var(--space-2);

    .layout-menu {
      border-right: none;
      background-color: transparent;

      :deep(.el-menu-item),
      :deep(.el-sub-menu__title) {
        height: 44px;
        line-height: 44px;
        border-radius: var(--radius-md);
        margin-bottom: var(--space-1);
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
      padding: var(--space-3) var(--space-2);

      .layout-menu {
        width: 100%;

        :deep(.el-menu-item),
        :deep(.el-sub-menu__title) {
          border-radius: var(--radius-md);
          padding: 0 !important;
          width: 48px !important;
          height: 44px;
          margin: 0 auto var(--space-2) auto;
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
