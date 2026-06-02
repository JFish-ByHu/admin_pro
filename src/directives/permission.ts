import type { Directive, DirectiveBinding } from 'vue'
import { useUserStore } from '@/stores/user'

/**
 * 自定义指令 v-permission
 * 用于细粒度控制 DOM 的渲染，比如按钮权限
 * 用法:
 * 单个权限: v-permission="'system:user:add'"
 * 多个权限(满足其一即可): v-permission="['system:user:add', 'system:user:edit']"
 */
export const permission: Directive = {
  mounted(el: HTMLElement, binding: DirectiveBinding) {
    const { value } = binding
    const userStore = useUserStore()
    const userPermissions = userStore.permissions

    if (value && value instanceof Array && value.length > 0) {
      // 传入的是数组
      const hasPermission = userPermissions.some(permission => value.includes(permission))

      if (!hasPermission && el.parentNode) {
        // 没有权限则直接移除 DOM 节点
        el.parentNode.removeChild(el)
      }
    } else if (typeof value === 'string' && value) {
      // 传入的是字符串
      if (!userPermissions.includes(value) && el.parentNode) {
        el.parentNode.removeChild(el)
      }
    } else {
      throw new Error(
        `需要指定权限标识！例如 v-permission="['system:user:add']" 或 v-permission="'system:user:add'"`
      )
    }
  }
}
