<template>
  <div class="relative flex flex-col h-screen bg-primary">
    <!-- Header -->
    <header-upgrade
      v-if="toggleSidebar"
      ref="headerRef"
      class="flex flex-col items-center bg-base-200 rounded-2xl p-2 m-2 border"
    ></header-upgrade>
    <!-- Header -->

    <!-- Toggle Button always visible -->
    <div class="absolute right-4 top-4 z-50">
      <button
        class="bg-accent text-white p-2 rounded-full shadow-md"
        @click="toggleSidebarFunction"
      >
        <span class="text-lg">
          <Icon :name="toggleSidebar ? 'kind-icon:eye' : 'kind-icon:eye-off'" />
        </span>
      </button>
    </div>

    <!-- Main Content -->
    <main
      ref="mainContentRef"
      class="flex flex-col items-center bg-base-200 rounded-2xl p-2 m-2 border"
    >
      <NuxtPage />
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useHead } from '@vueuse/head'

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

const headerRef = ref<HTMLElement | null>(null)
const mainContentRef = ref<HTMLElement | null>(null)
const toggleSidebar = ref(true)

const toggleSidebarFunction = () => {
  toggleSidebar.value = !toggleSidebar.value
  console.log('Toggle Sidebar:', toggleSidebar.value) // Debug: Check the state change
}
</script>

<style scoped>
button {
  font-size: 1.5rem;
  width: 3rem;
  height: 3rem;
}
</style>
