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
    :lottie-src="errorLottieUrls[404] || ''"
    title="404 Page Not Found"
    subtitle="The page you are looking for might have been removed, had its name changed, or is temporarily unavailable."
    btn-text="Back to Home"
    @action="handleGoBack"
  />
</template>
