<script setup lang="ts">
import type { UserStatus } from '@/types/user'

defineProps<{
  status: UserStatus
}>()
</script>

<template>
  <el-tag :type="status === 'enabled' ? 'success' : 'info'" effect="light">
    {{ status === 'enabled' ? '启用' : '禁用' }}
  </el-tag>
</template>
