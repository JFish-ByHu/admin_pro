<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router'
import ExceptionBase from './components/ExceptionBase.vue'
import { errorLottieUrls } from '@/constants/errorLottieUrl'

const route = useRoute()
const router = useRouter()

const goToLogin = () => {
  const redirect = route.query.redirect as string
  router.push({ path: '/auth', query: redirect ? { redirect } : undefined })
}
</script>

<template>
  <ExceptionBase
    :lottie-src="errorLottieUrls[401] || ''"
    title="401 Unauthorized"
    subtitle="Sorry, you don't have permission to access this page. Please log in with appropriate credentials or contact the administrator."
    btn-text="Go to Login"
    @action="goToLogin"
  />
</template>
