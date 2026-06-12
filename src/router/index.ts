import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import NProgress from 'nprogress'
import { useUserStore } from '@/stores/user'
import { disconnectWs, ensureWsConnected, subscribeRbacChanged } from '@/services/ws'
import type { UserMenuTreeNode } from '@/types/auth'

const ROOT_ROUTE_NAME = 'RootLayout'

const viewModules = import.meta.glob('/src/views/**/*.vue')

let dynamicRouteNames: string[] = []
let dynamicRoutePaths: string[] = []
let currentPermissionSignature = ''
let isWsSubscriptionReady = false

const setupWsSubscription = () => {
  if (isWsSubscriptionReady) {
    return
  }

  subscribeRbacChanged(async () => {
    const userStore = useUserStore()
    if (!userStore.accessToken) {
      return
    }

    try {
      await userStore.syncCurrentUserInfo({ force: true })
      await router.replace(router.currentRoute.value.fullPath)
    } catch (error) {
      console.error('[ws] RBAC 变更同步失败:', error)
    }
  })

  isWsSubscriptionReady = true
}

const normalizeRoutePath = (routePath: string) => {
  if (!routePath) {
    return ''
  }

  return routePath.startsWith('/') ? routePath.slice(1) : routePath
}

const flattenMenuTree = (nodes: UserMenuTreeNode[]): UserMenuTreeNode[] => {
  return nodes.flatMap(node => [node, ...flattenMenuTree(node.children || [])])
}

const buildMenuTreeSignature = (menuTree: UserMenuTreeNode[]) => {
  return JSON.stringify(menuTree)
}

const collectMenuRoutePaths = (menuTree: UserMenuTreeNode[]) => {
  return Array.from(
    new Set(
      flattenMenuTree(menuTree)
        .map(item => item.routePath)
        .filter(routePath => Boolean(routePath))
    )
  )
}

const resolveViewComponent = (componentPath: string): RouteRecordRaw['component'] | null => {
  const normalizedPath = componentPath.trim().replace(/^\/+/, '')
  if (!normalizedPath) {
    return null
  }

  const moduleKey = `/src/${normalizedPath}`
  const loader = viewModules[moduleKey]
  return loader || null
}

const buildDynamicChildRoutes = (menuTree: UserMenuTreeNode[]): RouteRecordRaw[] => {
  const routes: RouteRecordRaw[] = []

  flattenMenuTree(menuTree)
    .filter(item => item.routePath && item.componentPath)
    .forEach(item => {
      const routePath = item.routePath?.trim() || ''
      if (!routePath) {
        return
      }

      const component = resolveViewComponent(item.componentPath || '')
      if (!component) {
        console.warn(`[router] 未找到组件映射? ${item.componentPath} (${item.routePath})`)
        return
      }

      routes.push({
        path: normalizeRoutePath(routePath),
        name: `Menu_${item.id.replace(/-/g, '_')}`,
        component,
        meta: {
          title: item.name,
          menuPath: routePath
        }
      })
    })

  return routes
}

const resetDynamicRoutes = () => {
  dynamicRouteNames.forEach(name => {
    if (router.hasRoute(name)) {
      router.removeRoute(name)
    }
  })

  dynamicRouteNames = []
  dynamicRoutePaths = []
  currentPermissionSignature = ''
}

const ensureDynamicRoutes = (menuTree: UserMenuTreeNode[]) => {
  const nextSignature = buildMenuTreeSignature(menuTree)
  if (nextSignature === currentPermissionSignature && dynamicRouteNames.length > 0) {
    return
  }

  resetDynamicRoutes()

  const dynamicChildRoutes = buildDynamicChildRoutes(menuTree)
  dynamicRoutePaths = collectMenuRoutePaths(menuTree)

  dynamicChildRoutes.forEach(route => {
    const menuPath = (route.meta as { menuPath?: string } | undefined)?.menuPath

    router.addRoute(ROOT_ROUTE_NAME, route)

    if (typeof route.name === 'string') {
      dynamicRouteNames.push(route.name)
    }

    if (menuPath && !dynamicRoutePaths.includes(menuPath)) {
      dynamicRoutePaths.push(menuPath)
    }
  })

  currentPermissionSignature = nextSignature
}

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: ROOT_ROUTE_NAME,
      component: () => import('@/components/layout/LayoutIndex.vue'),
      redirect: '/dashboard',
      children: []
    },
    {
      path: '/auth',
      name: 'Auth',
      component: () => import('@/views/auth/AuthIndex.vue'),
      meta: {
        title: '登录与注册'
      }
    },
    {
      path: '/legal/:type',
      name: 'LegalDoc',
      component: () => import('@/views/legal/LegalDoc.vue'),
      meta: {
        title: '协议与政策'
      }
    },
    {
      path: '/401',
      name: 'NotAuthorized',
      component: () => import('@/views/exception/NotAuthorized.vue'),
      meta: {
        title: '未登录或登录失效'
      }
    },
    {
      path: '/403',
      name: 'Forbidden',
      component: () => import('@/views/exception/IsForbidden.vue'),
      meta: {
        title: '无权限访问'
      }
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'NotFound',
      component: () => import('@/views/exception/NotFound.vue'),
      meta: {
        title: '页面不存在'
      }
    }
  ]
})

// 全局前置守卫：权限拦截与进度条
router.beforeEach(async to => {
  NProgress.start()

  const userStore = useUserStore()
  const hasToken = !!userStore.accessToken

  // 定义免登录白名单路由
  const whiteList = ['/auth', '/401', '/403', '/404']
  const isWhiteList = whiteList.includes(to.path) || to.path.startsWith('/legal/')

  if (hasToken) {
    setupWsSubscription()
    ensureWsConnected(userStore.accessToken)

    try {
      await userStore.syncCurrentUserInfo({ maxAgeMs: 3000 })
    } catch (error) {
      console.error('[router] 同步当前用户信息失败:', error)
      userStore.logout()
      disconnectWs()
      return { path: '/401', query: { redirect: to.fullPath } }
    }

    ensureDynamicRoutes(userStore.menuTree)

    if (to.path === '/') {
      const defaultPath = dynamicRoutePaths[0] || '/403'
      return { path: defaultPath }
    }

    if (to.name === 'NotFound') {
      const matchedRoute = router.resolve(to.fullPath)
      if (matchedRoute.name !== 'NotFound') {
        return to.fullPath
      }
    }

    const isProtectedPath = to.path.startsWith('/') && !to.path.startsWith('/legal/')

    if (to.name === 'NotFound' && isProtectedPath) {
      return { path: '/403' }
    }

    if (to.path === '/auth') {
      return { path: '/' }
    }

    return true
  } else {
    resetDynamicRoutes()
    disconnectWs()

    if (isWhiteList) {
      return true
    }

    // 未登录访问受保护页面，先跳转 401 页面明确告知未授权，并携带原路径供后续登录跳转
    return { path: '/401', query: { redirect: to.fullPath } }
  }
})

// 全局后置守卫：结束进度条
router.afterEach(() => {
  NProgress.done()
})

// 错误拦截：结束进度条
router.onError(() => {
  NProgress.done()
})

export default router
