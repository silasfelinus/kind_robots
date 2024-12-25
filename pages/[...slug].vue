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

const { page } = useContent()
const router = useRouter()
const route = useRoute()

onMounted(() => {
  const code = route.query.code

  if (typeof code === 'string') {
    console.log('Redirecting to backend for token exchange...')
    router.push(`/api/auth/google/callback?code=${code}`)
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
