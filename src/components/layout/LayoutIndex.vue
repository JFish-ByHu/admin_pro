<script setup lang="ts">
import { useAppStore } from '@/stores/app'
import LayoutSidebar from './components/LayoutSidebar.vue'
import LayoutHeader from './components/LayoutHeader.vue'
import LayoutTagsView from './components/LayoutTagsView.vue'
import AppMain from './components/AppMain.vue'

const appStore = useAppStore()
</script>

<template>
  <el-container class="layout-wrapper">
    <!-- 移动端抽屉式侧边栏 -->
    <el-drawer
      v-if="appStore.isMobile"
      v-model="appStore.sidebarDrawerVisible"
      direction="ltr"
      :size="240"
      :show-close="false"
      :with-header="false"
      class="sidebar-drawer"
    >
      <LayoutSidebar :is-collapse="false" />
    </el-drawer>

    <!-- 桌面/平板侧边栏 -->
    <LayoutSidebar v-else :is-collapse="appStore.sidebarCollapse" />

    <el-container class="main-wrapper">
      <!-- 顶部导航 -->
      <el-header height="60px" class="layout-header">
        <LayoutHeader />
      </el-header>

      <!-- 标签视图 -->
      <LayoutTagsView />

      <!-- 主内容区 -->
      <AppMain />
    </el-container>
  </el-container>
</template>

<style scoped lang="scss">
.layout-wrapper {
  height: 100vh;
  width: 100vw;
  overflow: hidden;

  .main-wrapper {
    display: flex;
    flex-direction: column;
    overflow: hidden;
    min-width: 0;

    .layout-header {
      padding: 0;
    }
  }
}

// 移动端抽屉样式
:deep(.sidebar-drawer) {
  .el-drawer__body {
    padding: 0;
    overflow: hidden;
  }
}
</style>
