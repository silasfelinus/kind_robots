<template>
  <div>
    <h1>User Information</h1>
    {{ user }}
    <p>Username: {{ userStore.username }}</p>
    <p>Stay Logged In: {{ userStore.stayLoggedIn }}</p>
    <p>Token: {{ userStore.token }}</p>
    <ami-loader />
  </div>
</template>

<script setup lang="ts">
import { useUserStore } from './stores/userStore'
import { errorHandler } from './server/api/utils/error'
const userStore = useUserStore()
const user = computed(() => userStore.user)
const username = computed(() => userStore.username)

onMounted(() => {
  try {
    // Initialize user data
    userStore.initializeUser()
  } catch (error: any) {
    errorHandler({ success: false, message: `Initialization failed: ${error}` })
  }
})
</script>
