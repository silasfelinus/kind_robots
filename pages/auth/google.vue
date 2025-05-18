<!-- /pages/auth/google.vue -->
<script setup lang="ts">
import { useRouter, useRoute } from '#app'
import { useUserStore } from '@/stores/userStore'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

const token = route.query.token as string | undefined

if (token) {
  // Save token locally
  localStorage.setItem('googleToken', token)
  await userStore.initialize(token)
  await router.push('/dashboard')
} else {
  await router.push('/login')
}
</script>
<template>
  <div class="text-center p-6 text-info">Logging you in via Google…</div>
</template>
