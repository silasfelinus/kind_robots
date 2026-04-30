<!-- /pages/auth/google.vue -->
<template>
  <div class="text-center p-6 text-info">Logging you in via Google…</div>
</template>

<script setup lang="ts">
import { useRouter, useRoute } from '#app'
import { useUserStore } from '@/stores/userStore'
import { onMounted } from 'vue'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

onMounted(async () => {
  const token = route.query.token as string | undefined
  console.log('[auth/google] onMounted — token present:', !!token)

  if (!token) {
    console.error('[auth/google] ❌ No token in query — redirecting to login')
    await router.push('/login')
    return
  }

  try {
    console.log('[auth/google] Calling initialize() with token')
    await userStore.initialize({ token, force: true })
    console.log(
      '[auth/google] initialize() done — isLoggedIn:',
      userStore.isLoggedIn,
      '| username:',
      userStore.username,
    )
    console.log('[auth/google] localStorage state after init:', {
      token: localStorage.getItem('token')?.slice(0, 20) + '...',
      googleToken: localStorage.getItem('googleToken'),
      stayLoggedIn: localStorage.getItem('stayLoggedIn'),
    })

    if (userStore.isLoggedIn) {
      userStore.setGoogleToken(true) // sets boolean flag + forces stayLoggedIn=true
      console.log(
        '[auth/google] ✅ setGoogleToken(true) called — redirecting to dashboard',
      )
      await router.push('/dashboard')
    } else {
      console.warn(
        '[auth/google] ⚠️ Still guest after initialize — token likely invalid or DB miss',
      )
      await router.push('/login')
    }
  } catch (err) {
    console.error('[auth/google] ❌ Exception:', err)
    await router.push('/login')
  }
})
</script>
