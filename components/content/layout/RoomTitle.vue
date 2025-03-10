<template>
  <div class="text-center">
    <h1
      v-if="page && page.title"
      class="text-xl inline-block rounded-2xl p-1 border m-1 bg-secondary shadow-lg"
    >
      The {{ page.title }} Room
    </h1>
    <h1 v-else class="text-xl inline-block rounded-2xl border m-1 shadow-lg">
      🌈 Fetching details...
    </h1>
    <pre>{{ page }}</pre>
    <!-- Debugging output -->
  </div>
</template>

<script setup lang="ts">
import { useRoute } from 'vue-router'
import { useAsyncData } from '#app'

// Get the route params
const route = useRoute()
const name = computed(() => (route.params.name as string) || 'default-name')

// Define expected content structure
interface PageData {
  title?: string
  description?: string
  subtitle?: string
  image?: string
  icon?: string
  underConstruction?: boolean
  dottitip?: string
  amitip?: string
  tooltip?: string
  message?: string
}

// Fetch the page data using Nuxt Content
const { data: page } = useAsyncData<PageData>(`${name.value}`, async () => {
  console.log('Fetching Page Data for:', name.value) // Debugging
  const result = await queryCollection('content').path(name.value).first()
  console.log('Fetched Page Data:', result) // Debugging
  return result || {} // Ensure result is always an object to avoid null errors
})
</script>
