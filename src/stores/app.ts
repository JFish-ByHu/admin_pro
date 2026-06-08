import { nextTick, ref, watch } from 'vue'
import { defineStore } from 'pinia'
import { useDark, useFullscreen, useMediaQuery } from '@vueuse/core'
import type { RouteLocationNormalizedLoaded } from 'vue-router'

// 主题持久化 key
const THEME_STORAGE_KEY = 'vueuse-color-scheme'

interface VisitedView {
  path: string
  title: string
  name?: string
}

const DEFAULT_VISITED_VIEW: VisitedView = {
  path: '/dashboard',
  title: '控制台',
  name: 'Dashboard'
}

/**
 * 判断用户是否手动设置过主题
 * localStorage 中存在明确的 light/dark 值表示用户手动设置过
 */
const hasUserThemePreference = () => {
  const stored = localStorage.getItem(THEME_STORAGE_KEY)
  return stored === 'light' || stored === 'dark'
}

/**
 * 获取首次访问时的初始主题
 * 优先跟随系统偏好，系统无偏好时跟随时间段（7:00-18:00 亮色，其余暗色）
 */
const getInitialDarkValue = (): boolean => {
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
  const prefersLight = window.matchMedia('(prefers-color-scheme: light)').matches

  if (prefersDark || prefersLight) {
    return prefersDark
  }

  const hour = new Date().getHours()
  return hour < 7 || hour >= 18
}

export const useAppStore = defineStore(
  'app',
  () => {
    // 首次访问时根据系统偏好/时间段设置初始值
    if (!hasUserThemePreference()) {
      const shouldBeDark = getInitialDarkValue()
      localStorage.setItem(THEME_STORAGE_KEY, shouldBeDark ? 'dark' : 'light')
    }

    const isDark = useDark({
      storageKey: THEME_STORAGE_KEY,
      valueDark: 'dark',
      valueLight: 'light'
    })

    /**
     * 带有 View Transitions 扩散动画的主题切换方法
     * @param event 鼠标点击事件，用于获取动画扩散的起点 (x, y)
     */
    const toggleDarkWithTransition = (event: MouseEvent) => {
      if (!document.startViewTransition) {
        isDark.value = !isDark.value
        return
      }

      const x = event.clientX
      const y = event.clientY
      const endRadius = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y))

      const transition = document.startViewTransition(async () => {
        isDark.value = !isDark.value
        await nextTick()
      })

      transition.ready.then(() => {
        const clipPath = [`circle(0px at ${x}px ${y}px)`, `circle(${endRadius}px at ${x}px ${y}px)`]

        document.documentElement.animate(
          {
            clipPath: isDark.value ? [...clipPath].reverse() : clipPath
          },
          {
            duration: 600,
            easing: 'ease-in',
            pseudoElement: isDark.value
              ? '::view-transition-old(root)'
              : '::view-transition-new(root)',
            fill: 'forwards'
          }
        )
      })
    }

    const { isFullscreen, toggle: toggleFullscreen } = useFullscreen()

    // --- 响应式布局 ---
    const isMobile = useMediaQuery('(max-width: 768px)')
    const isTablet = useMediaQuery('(max-width: 1280px)')
    const sidebarCollapse = ref(isTablet.value)
    const sidebarDrawerVisible = ref(false)
    const visitedViews = ref<VisitedView[]>([DEFAULT_VISITED_VIEW])
    const isRefreshingContent = ref(false)
    const contentRefreshSignal = ref(0)

    watch(isTablet, val => {
      if (val) {
        sidebarCollapse.value = true
      }
    })

    watch(isMobile, val => {
      if (val) {
        sidebarCollapse.value = true
      }
    })

    const toggleSidebar = () => {
      if (isMobile.value) {
        sidebarDrawerVisible.value = !sidebarDrawerVisible.value
      } else {
        sidebarCollapse.value = !sidebarCollapse.value
      }
    }

    const closeSidebarDrawer = () => {
      sidebarDrawerVisible.value = false
    }

    const addVisitedView = (route: RouteLocationNormalizedLoaded) => {
      const path = route.path
      const title = (route.meta.title as string) || '未命名页面'
      const name = typeof route.name === 'string' ? route.name : undefined
      const existingView = visitedViews.value.find(item => item.path === path)

      if (existingView) {
        existingView.title = title
        existingView.name = name
        return
      }

      visitedViews.value.push({
        path,
        title,
        name
      })
    }

    const removeVisitedView = (path: string) => {
      visitedViews.value = visitedViews.value.filter(item => item.path !== path)

      if (visitedViews.value.length === 0) {
        visitedViews.value = [DEFAULT_VISITED_VIEW]
      }
    }

    const refreshCurrentView = async () => {
      if (isRefreshingContent.value) {
        return
      }

      isRefreshingContent.value = true

      try {
        contentRefreshSignal.value += 1
        await nextTick()
      } finally {
        isRefreshingContent.value = false
      }
    }

    return {
      isDark,
      isFullscreen,
      isMobile,
      isTablet,
      sidebarCollapse,
      sidebarDrawerVisible,
      visitedViews,
      isRefreshingContent,
      contentRefreshSignal,
      toggleDarkWithTransition,
      toggleFullscreen,
      toggleSidebar,
      closeSidebarDrawer,
      addVisitedView,
      removeVisitedView,
      refreshCurrentView
    }
  },
  {
    persist: {
      key: 'admin-pro-app-config',
      pick: ['sidebarCollapse', 'visitedViews']
    }
  }
)
