import type { Directive, DirectiveBinding } from 'vue'
import { useUserStore } from '@/stores/user'

type PermissionValue = string | string[] | null | undefined

const PERMISSION_DENIED_TITLE = '无权限操作'

const isNativeDisableElement = (el: HTMLElement): el is HTMLButtonElement | HTMLInputElement => {
  return el instanceof HTMLButtonElement || el instanceof HTMLInputElement
}

const hasPermissionAccess = (value: PermissionValue, userPermissions: string[]): boolean => {
  if (value === undefined || value === null || value === '') {
    return true
  }

  if (Array.isArray(value)) {
    if (value.length === 0) {
      return true
    }

    return value.some(permissionCode => userPermissions.includes(permissionCode))
  }

  if (typeof value === 'string') {
    return userPermissions.includes(value)
  }

  return true
}

const hideElement = (el: HTMLElement) => {
  if (!el.dataset.permissionOriginalDisplay) {
    el.dataset.permissionOriginalDisplay = el.style.display || ''
  }
  el.style.display = 'none'
}

const restoreElementDisplay = (el: HTMLElement) => {
  if (el.dataset.permissionOriginalDisplay !== undefined) {
    el.style.display = el.dataset.permissionOriginalDisplay
    delete el.dataset.permissionOriginalDisplay
  }
}

const disableElement = (el: HTMLElement) => {
  el.dataset.permissionDisabled = '1'

  if (isNativeDisableElement(el)) {
    el.disabled = true
  } else {
    el.style.pointerEvents = 'none'
    el.style.opacity = '0.56'
    el.setAttribute('aria-disabled', 'true')
  }

  if (!el.dataset.permissionOriginalTitle) {
    el.dataset.permissionOriginalTitle = el.getAttribute('title') || ''
  }
  el.setAttribute('title', PERMISSION_DENIED_TITLE)
}

const restoreElementInteractive = (el: HTMLElement) => {
  if (!el.dataset.permissionDisabled) {
    return
  }

  if (isNativeDisableElement(el)) {
    el.disabled = false
  } else {
    el.style.pointerEvents = ''
    el.style.opacity = ''
    el.removeAttribute('aria-disabled')
  }

  const originalTitle = el.dataset.permissionOriginalTitle || ''
  if (originalTitle) {
    el.setAttribute('title', originalTitle)
  } else {
    el.removeAttribute('title')
  }

  delete el.dataset.permissionOriginalTitle
  delete el.dataset.permissionDisabled
}

const applyPermissionState = (el: HTMLElement, binding: DirectiveBinding<PermissionValue>) => {
  const userStore = useUserStore()
  const userPermissions = userStore.permissions || []
  const hasPermission = hasPermissionAccess(binding.value, userPermissions)
  const useHideMode = Boolean(binding.modifiers?.hide)

  if (hasPermission) {
    restoreElementDisplay(el)
    restoreElementInteractive(el)
    return
  }

  if (useHideMode) {
    restoreElementInteractive(el)
    hideElement(el)
    return
  }

  restoreElementDisplay(el)
  disableElement(el)
}

/**
 * 自定义指令 v-permission
 * 用于细粒度控制 DOM 的渲染，比如按钮权限
 * 用法:
 * 单个权限: v-permission="'system:user:create'"
 * 多个权限(满足其一即可): v-permission="['system:user:create', 'system:user:update']"
 */
export const permission: Directive = {
  mounted(el: HTMLElement, binding: DirectiveBinding<PermissionValue>) {
    applyPermissionState(el, binding)
  },
  updated(el: HTMLElement, binding: DirectiveBinding<PermissionValue>) {
    applyPermissionState(el, binding)
  }
}
