<template>
  <header
    class="flex justify-between items-center bg-primary rounded-2xl border p-2 relative"
  >
    <home-link />
    <layout-selector class="relative" />

    <!-- Title and Subtitle -->
    <h1 class="text-4xl text-default font-bold">Kind Robots</h1>
    <div class="flex flex-col items-center justify-center p-2 m-2 relative">
      <!-- Conditional rendering for title -->
      <h1 class="text-4xl text-default font-bold">
        {{ page?.subtitle || 'Location: 🌀 Loading...' }}
      </h1>
    </div>

    <!-- Theme Selector -->
    <div class="flex items-center justify-center relative">
      <theme-toggle />
    </div>

    <!-- Butterfly Toggle -->
    <div class="flex items-center justify-center relative">
      <butterfly-toggle />
    </div>
  </header>
</template>

<script setup lang="ts">
import { useRoute } from 'vue-router'
import { useAsyncData } from '#app'

// Get the route params
const route = useRoute()
const name = route.params.name as string

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

// Fetch the page data using Nuxt Content v3
const { data: page } = await useAsyncData<PageData>(`${name}`, async () => {
  const result = await queryCollection('content').path(`${name}`).first()
  return result || {} // Ensure result is always an object to avoid null errors
})
</script>
