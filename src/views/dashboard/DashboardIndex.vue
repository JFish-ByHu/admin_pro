<script setup lang="ts"></script>

<template>
  <div class="dashboard-container">
    <el-card class="welcome-card" shadow="hover">
      <template #header>
        <div class="card-header">
          <el-icon class="header-icon"><i-ep-data-analysis /></el-icon>
          <span>控制台</span>
        </div>
      </template>
      <div class="welcome-content">
        <h2>Admin Site management system</h2>
        <p>基于 Vue 3 + Element Plus + NestJS 企业级中后台脚手架。</p>
      </div>
    </el-card>
  </div>
</template>

<style scoped lang="scss">
.dashboard-container {
  .welcome-card {
    border: 1px solid var(--border-light);
    background-color: var(--bg-white);
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-base);
    overflow: hidden;

    /* 覆盖 Element Plus 默认卡片头部样式 */
    :deep(.el-card__header) {
      border-bottom: 1px solid var(--border-light);
      background-color: rgba(0, 0, 0, 0.015);
      padding: var(--card-padding-md) var(--card-padding-xl);
    }

    /* 覆盖 Element Plus 默认卡片内容样式 */
    :deep(.el-card__body) {
      padding: var(--space-8) var(--card-padding-xl);
    }

    /* 适配暗黑模式的卡片头部 */
    html.dark & :deep(.el-card__header) {
      background-color: rgba(255, 255, 255, 0.02);
    }

    .card-header {
      display: flex;
      align-items: center;
      gap: var(--card-header-gap);
      font-weight: 600;
      font-size: 16px;
      color: var(--t-primary);

      .header-icon {
        color: var(--c-primary);
        font-size: 20px;
      }
    }

    .welcome-content {
      h2 {
        margin-top: 0;
        margin-bottom: var(--space-4);
        color: var(--t-primary);
        font-size: var(--font-size-xl);
        font-weight: 800;
        letter-spacing: -0.5px;
      }

      p {
        color: var(--t-secondary);
        line-height: 1.6;
        margin-bottom: var(--space-8);
        font-size: var(--font-size-base);
      }

      .quick-links {
        display: flex;
        gap: var(--card-gap-lg);
        flex-wrap: wrap;
      }
    }
  }
}
</style>
