<script setup lang="ts">
import { computed, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { UseSortable } from '@vueuse/integrations/useSortable/component'
import { useRoute, useRouter } from 'vue-router'
import type { Options as SortableOptions } from 'sortablejs'
import { useAppStore } from '@/stores/app'

const route = useRoute()
const router = useRouter()
const appStore = useAppStore()
const { visitedViews } = storeToRefs(appStore)

const activePath = computed(() => route.path)
const canCloseTags = computed(() => visitedViews.value.length > 1)

const sortableOptions: SortableOptions = {
  animation: 180,
  ghostClass: 'is-ghost',
  chosenClass: 'is-chosen',
  dragClass: 'is-dragging',
  filter: '.tags-view-item__close',
  preventOnFilter: false
}

const getNextPathAfterClose = (path: string) => {
  const currentIndex = visitedViews.value.findIndex(item => item.path === path)
  const nextView = visitedViews.value[currentIndex + 1]
  const prevView = visitedViews.value[currentIndex - 1]

  return nextView?.path || prevView?.path || '/dashboard'
}

const openTag = (path: string) => {
  if (path !== route.path) {
    router.push(path)
  }
}

const closeTag = (path: string) => {
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
      <UseSortable
        v-model="visitedViews"
        as="div"
        class="tags-view-list"
        :options="sortableOptions"
      >
        <button
          v-for="item in visitedViews"
          :key="item.path"
          type="button"
          class="tags-view-item"
          :class="{ 'is-active': activePath === item.path }"
          @click="openTag(item.path)"
        >
          <span class="tags-view-item__dot" />
          <span class="tags-view-item__label">{{ item.title }}</span>
          <span v-if="canCloseTags" class="tags-view-item__close" @click.stop="closeTag(item.path)">
            <el-icon :size="12"><i-ep-close /></el-icon>
          </span>
        </button>
      </UseSortable>
    </el-scrollbar>
  </div>
</template>

<style scoped lang="scss">
.tags-view-container {
  display: flex;
  align-items: center;
  padding: var(--space-2) var(--layout-page-padding-inline);
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
    gap: var(--space-2);
    min-width: max-content;
  }

  .tags-view-item {
    display: inline-flex;
    align-items: center;
    gap: var(--space-2);
    cursor: pointer;
    user-select: none;
    height: 28px;
    padding: 0 var(--space-3);
    border-radius: var(--radius-md);
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

    &:active {
      cursor: grabbing;
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
      cursor: pointer;
      transition: background-color 0.2s ease;

      &:hover {
        background-color: color-mix(in srgb, currentColor 12%, transparent);
      }
    }

    &.is-chosen {
      box-shadow: 0 0 0 1px color-mix(in srgb, var(--c-primary) 24%, transparent);
    }

    &.is-ghost {
      opacity: 0.45;
    }

    &.is-dragging {
      background-color: var(--bg-white);
      color: var(--c-primary);
      box-shadow: var(--shadow-sm);
    }
  }
}
</style>
