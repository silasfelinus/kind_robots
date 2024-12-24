<template>
  <main>
    <NuxtLayout :name="page?.layout || 'default'">
      <ContentDoc />
    </NuxtLayout>
  </main>
</template>

<script setup lang="ts">
import { useHead } from '@vueuse/head';
import { useRoute, useRouter } from 'vue-router';
import { useUserStore } from '@/stores/userStore';


const { page } = useContent();
const userStore = useUserStore();
const router = useRouter();
const route = useRoute();

// Handle token in the query
onMounted(async () => {
  const token = route.query.token;

  if (token) {
    console.log('Token found in query:', token);
    try {
      // Save the token to the store
      userStore.token = token;

      // Validate the token and fetch user data
      const isValid = await userStore.validateAndFetchUserData();
      if (isValid) {
        console.log('Token validated. Redirecting to dashboard...');
        await router.push('/dashboard');
      } else {
        console.warn('Token validation failed. Redirecting to login...');
        await router.push('/login');
      }
    } catch (error) {
      console.error('Error during token processing:', error);
      await router.push('/login'); // Redirect on error
    }
  } else {
    console.log('No token found. Proceeding with normal content rendering.');
  }
});

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
});
</script>
