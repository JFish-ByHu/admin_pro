<script setup lang="ts">
import { computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAppStore } from '@/stores/app'

const route = useRoute()
const router = useRouter()
const appStore = useAppStore()

const visitedViews = computed(() => appStore.visitedViews)
const activePath = computed(() => route.path)
const canCloseTags = computed(() => visitedViews.value.length > 1)

const getNextPathAfterClose = (path: string) => {
  const currentIndex = visitedViews.value.findIndex(item => item.path === path)
  const nextView = visitedViews.value[currentIndex + 1]
  const prevView = visitedViews.value[currentIndex - 1]

  return nextView?.path || prevView?.path || '/dashboard'
}

const handleTagClick = (path: string) => {
  if (path !== route.path) {
    router.push(path)
  }
}

const handleTagClose = (path: string) => {
  const nextPath = getNextPathAfterClose(path)
  const isCurrentView = path === route.path

  appStore.removeVisitedView(path)

  if (isCurrentView) {
    router.push(nextPath)
  }
}

watch(
  () => route.path,
  () => {
    appStore.addVisitedView(route)
  },
  {
    immediate: true
  }
)
</script>

<template>
  <div class="tags-view-container">
    <el-scrollbar>
      <div class="tags-view-list">
        <button
          v-for="item in visitedViews"
          :key="item.path"
          type="button"
          class="tags-view-item"
          :class="{ 'is-active': activePath === item.path }"
          @click="handleTagClick(item.path)"
        >
          <span class="tags-view-item__dot" />
          <span class="tags-view-item__label">{{ item.title }}</span>
          <span
            v-if="canCloseTags"
            class="tags-view-item__close"
            @click.stop="handleTagClose(item.path)"
          >
            <el-icon :size="12"><i-ep-close /></el-icon>
          </span>
        </button>
      </div>
    </el-scrollbar>
  </div>
</template>

<style scoped lang="scss">
.tags-view-container {
  display: flex;
  align-items: center;
  padding: 6px var(--layout-padding);
  background-color: var(--bg-white);
  border-top: 1px solid var(--border-light);

  @include respond-to(mobile) {
    display: none;
  }

  :deep(.el-scrollbar) {
    width: 100%;
  }

  :deep(.el-scrollbar__view) {
    width: 100%;
  }

  .tags-view-list {
    display: flex;
    align-items: center;
    gap: 6px;
    min-width: max-content;
  }

  .tags-view-item {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    cursor: pointer;
    user-select: none;
    height: 28px;
    padding: 0 10px;
    border-radius: 6px;
    border: 1px solid transparent;
    background-color: var(--bg-page);
    color: var(--t-regular);
    font-size: 12px;
    line-height: 1;
    transition: all 0.2s ease;

    &:hover {
      background-color: var(--c-primary-border);
      color: var(--t-primary);
    }

    &.is-active {
      background-color: var(--c-primary-bg);
      border-color: color-mix(in srgb, var(--c-primary) 18%, transparent);
      color: var(--c-primary);
    }

    &__dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background-color: currentColor;
      opacity: 0.7;
      flex-shrink: 0;
    }

    &__label {
      white-space: nowrap;
    }

    &__close {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 16px;
      height: 16px;
      border-radius: 50%;
      color: inherit;
      flex-shrink: 0;
      transition: background-color 0.2s ease;

      &:hover {
        background-color: color-mix(in srgb, currentColor 12%, transparent);
      }
    }
  }
}
</style>
