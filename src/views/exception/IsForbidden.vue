<script setup lang="ts">
import { useRouter } from 'vue-router'
import ExceptionBase from './components/ExceptionBase.vue'
import { errorLottieUrls } from '@/constants/errorLottieUrl'

const router = useRouter()

const handleGoBack = () => {
  router.push('/')
}
</script>

<template>
  <ExceptionBase
    :lottie-src="errorLottieUrls[403] || ''"
    title="403 Forbidden"
    subtitle="Sorry, your current account does not have the necessary permissions to view this content."
    btn-text="Back to Home"
    @action="handleGoBack"
  />
</template>
