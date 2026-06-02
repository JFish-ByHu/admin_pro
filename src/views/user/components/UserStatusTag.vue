<script setup lang="ts">
import type { UserStatus } from '@/types/user'

defineProps<{
  status: UserStatus
}>()
</script>

<template>
  <el-tag :type="status === 'enabled' ? 'success' : 'info'" effect="light">
    {{ status === 'enabled' ? 'enabled' : 'banned' }}
  </el-tag>
</template>
