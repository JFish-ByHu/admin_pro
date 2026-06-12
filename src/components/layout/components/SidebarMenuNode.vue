<script setup lang="ts">
import { computed } from 'vue'
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
</script>

<template>
  <el-sub-menu v-if="hasChildren" :index="menuIndex">
    <template #title>
      <el-icon>
        <i-ep-folder-opened v-if="isDirectory" />
        <i-ep-menu v-else />
      </el-icon>
      <span>{{ node.name }}</span>
    </template>

    <SidebarMenuNode v-for="child in childNodes" :key="child.id" :node="child" />
  </el-sub-menu>

  <el-menu-item v-else-if="node.routePath" :index="node.routePath">
    <el-icon><i-ep-document /></el-icon>
    <template #title>{{ node.name }}</template>
  </el-menu-item>
</template>
