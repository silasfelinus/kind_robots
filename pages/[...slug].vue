<template>
  <main>
    <NuxtLayout :name="page?.layout || 'default'">
      <ContentDoc />
    </NuxtLayout>
  </main>
</template>

<script setup lang="ts">
import { useHead } from '@vueuse/head'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '@/stores/userStore'

const { page } = useContent()
const userStore = useUserStore()
const router = useRouter()
const route = useRoute()

interface GoogleTokenResponse {
  access_token: string
  expires_in: number
  refresh_token?: string
  scope: string
  token_type: string
  id_token?: string
}

onMounted(async () => {
  const code = route.query.code

  if (Array.isArray(code)) {
    console.warn('Multiple codes found in query. Using the first one.')
  }

  const singleCode = Array.isArray(code) ? code[0] : code

  if (typeof singleCode === 'string') {
    console.log('Authorization code found in query:', singleCode)
    try {
      // Exchange the code for a token with Google's API
      const tokenResponse = await $fetch<GoogleTokenResponse>(
        'https://oauth2.googleapis.com/token',
        {
          method: 'POST',
          body: {
            code: singleCode,
            client_id: process.env.GOOGLE_ID,
            client_secret: process.env.GOOGLE_SECRET,
            redirect_uri:
              'https://kind-robots.vercel.app/api/auth/google/callback', // Match your redirect URI
            grant_type: 'authorization_code',
          },
        },
      )

      const token = tokenResponse?.access_token

      if (token) {
        console.log('Token received:', token)
        // Save the token to the store
        userStore.token = token

        // Validate the token and fetch user data
        const isValid = await userStore.validateAndFetchUserData()
        if (isValid) {
          console.log('Token validated. Redirecting to dashboard...')
          await router.push('/dashboard')
        } else {
          console.warn('Token validation failed. Redirecting to login...')
          await router.push('/login')
        }
      } else {
        console.warn(
          'Failed to exchange code for token. Redirecting to login...',
        )
        await router.push('/login')
      }
    } catch (error) {
      console.error('Error during code exchange:', error)
      await router.push('/login') // Redirect on error
    }
  } else {
    console.log(
      'No valid authorization code found. Proceeding with normal content rendering.',
    )
  }
})

// Set head metadata
useHead({
  title: 'Kind Robots',
  meta: [
    { name: 'og:title', content: 'Welcome to the Kind Robots' },
    {
      name: 'description',
      content: 'OpenAI-supported Promptbots here to assist humanity.',
    },
    {
      name: 'og:description',
      content:
        'Make and Share OpenAI prompts, AI-assisted art, and find the secret jellybeans',
    },
    { name: 'og:image', content: '/images/kindtitle.webp' },
    { name: 'twitter:card', content: 'summary_large_image' },
  ],
})
</script>
