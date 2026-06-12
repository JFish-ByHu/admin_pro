<script setup lang="ts">
import { computed } from 'vue'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import type { UserMenuTreeNode } from '@/types/auth'

defineOptions({
  name: 'SidebarMenuNode'
})

const props = defineProps<{
  node: UserMenuTreeNode
}>()

const childNodes = computed(() => {
  return (props.node.children || []).filter(
    item => item.type === 'directory' || Boolean(item.routePath)
  )
})

const hasChildren = computed(() => childNodes.value.length > 0)
const menuIndex = computed(() => props.node.routePath || `menu-group-${props.node.id}`)
const isDirectory = computed(() => props.node.type === 'directory')
const directoryIcon = computed(() => {
  const iconName = props.node.icon || 'FolderOpened'
  return ElementPlusIconsVue[iconName as keyof typeof ElementPlusIconsVue]
    ? (ElementPlusIconsVue[iconName as keyof typeof ElementPlusIconsVue] as object)
    : ElementPlusIconsVue.FolderOpened
})
</script>

<template>
  <el-sub-menu v-if="hasChildren" :index="menuIndex">
    <template #title>
      <el-icon v-if="isDirectory">
        <component :is="directoryIcon" />
      </el-icon>
      <span>{{ node.name }}</span>
    </template>

    <SidebarMenuNode v-for="child in childNodes" :key="child.id" :node="child" />
  </el-sub-menu>

  <el-menu-item
    v-else-if="isDirectory || node.routePath"
    :index="node.routePath || `menu-group-${node.id}`"
    :disabled="!node.routePath"
  >
    <el-icon v-if="isDirectory">
      <component :is="directoryIcon" />
    </el-icon>
    <template #title>{{ node.name }}</template>
  </el-menu-item>
</template>
