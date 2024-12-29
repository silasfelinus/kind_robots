<template>
  <main>
    <NuxtLayout :name="page?.layout || 'default'">
      <ContentDoc />
    </NuxtLayout>
  </main>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '@/stores/userStore'
import { useBotStore } from '@/stores/botStore'

const userStore = useUserStore()
const botStore = useBotStore()
const { page } = useContent()
const route = useRoute()
const router = useRouter()

onMounted(async () => {
  // If user already exists in the store, no need to validate
  if (userStore.user !== null) {
    console.log('User already logged in. Skipping auth flow.')
    return
  }

  // Check for a localStorage token
  const token = userStore.getFromLocalStorage('token')
  if (token) {
    try {
      console.log('Validating token from localStorage...')
      const isValid = await userStore.validateAndFetchUserData()
      if (isValid) {
        console.log('Token validated. User session set.')
        // Stay on the current page; no need to redirect
      } else {
        console.warn('Invalid token. Clearing storage.')
        userStore.clearLocalStorage()
      }
    } catch (error) {
      console.error('Error during token validation:', error)
      userStore.clearLocalStorage()
    }
  }

  // Handle query parameters
  const queryToken = route.query.token as string
  const code = route.query.code as string
  const botId = route.query.botId as string // New query parameter

  // Handle bot selection
  if (botId) {
    try {
      console.log(`Selecting bot with ID: ${botId}`)
      botStore.selectBot(botId)
    } catch (error) {
      console.error(`Failed to select bot with ID ${botId}:`, error)
    }
  }

  // Handle query token for mandatory login
  if (queryToken) {
    console.log('Processing query token...')
    try {
      userStore.token = queryToken
      const isValid = await userStore.validateAndFetchUserData()
      if (isValid) {
        console.log('Query token validated. User session set.')
        // No redirect; allow the user to stay on the current page
      } else {
        console.warn('Query token validation failed.')
        await router.push('/login') // Redirect to login on failure
      }
    } catch (error) {
      console.error('Error processing query token:', error)
      await router.push('/login')
    }
  } else if (code) {
    console.log('Code found. Redirecting for token exchange...')
    await router.push(`/api/auth/google/callback?code=${code}`)
  } else {
    console.log('No auth data found. Proceeding with content rendering.')
  }
})
</script>
