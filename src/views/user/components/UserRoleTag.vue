<script setup lang="ts">
const props = defineProps<{
  role: string
  roleLabelMap: Record<string, string>
}>()

const roleTagType = (role: string): 'danger' | 'warning' | 'success' | 'info' => {
  const map: Record<string, 'danger' | 'warning' | 'success' | 'info'> = {
    super: 'danger',
    admin: 'warning',
    operator: 'success',
    user: 'info'
  }
  return map[role] || 'info'
}
</script>

<template>
  <el-tag :type="roleTagType(props.role)" effect="light">
    {{ props.roleLabelMap[props.role] || props.role }}
  </el-tag>
</template>
