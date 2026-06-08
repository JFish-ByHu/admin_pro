import { watch } from 'vue'
import { useAppStore } from '@/stores/app'

/**
 * 订阅头部“局部刷新”事件，触发当前页面的数据重拉
 */
export const useContentRefresh = (onRefresh: () => void | Promise<void>) => {
  const appStore = useAppStore()

  return watch(
    () => appStore.contentRefreshSignal,
    () => {
      void onRefresh()
    }
  )
}
