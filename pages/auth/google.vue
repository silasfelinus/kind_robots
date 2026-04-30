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

  if (!token) {
    console.error('[auth/google] ❌ No token in query — redirecting to login')
    await router.push('/login')
    return
  }

  try {
    await userStore.initialize({ token, force: true })

    if (userStore.isLoggedIn) {
      userStore.setGoogleToken(true) // sets boolean flag + forces stayLoggedIn=true

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
