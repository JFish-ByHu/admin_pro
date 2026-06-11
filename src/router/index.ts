import { createRouter, createWebHistory } from 'vue-router'
import NProgress from 'nprogress'
import { useUserStore } from '@/stores/user'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      component: () => import('@/components/layout/LayoutIndex.vue'),
      redirect: '/dashboard',
      children: [
        {
          path: 'dashboard',
          name: 'Dashboard',
          component: () => import('@/views/dashboard/DashboardIndex.vue'),
          meta: {
            title: '控制台'
          }
        },
        {
          path: 'user/info',
          name: 'UserInfo',
          component: () => import('@/views/user/UserInfoIndex.vue'),
          meta: {
            title: '用户信息'
          }
        },
        {
          path: 'system/menu',
          name: 'SystemMenu',
          component: () => import('@/views/system/menu/MenuManagementIndex.vue'),
          meta: {
            title: '菜单管理'
          }
        },
        {
          path: 'system/permission',
          name: 'SystemPermission',
          component: () => import('@/views/system/permission/PermissionManagementIndex.vue'),
          meta: {
            title: '权限管理'
          }
        }
      ]
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
router.beforeEach(to => {
  NProgress.start()

  const userStore = useUserStore()
  const hasToken = !!userStore.accessToken

  // 定义免登录白名单路由
  const whiteList = ['/auth', '/401', '/403', '/404']
  const isWhiteList = whiteList.includes(to.path) || to.path.startsWith('/legal/')

  if (hasToken) {
    if (to.path === '/auth') {
      return { path: '/' }
    }

    return true
  } else {
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
