<template>
  <div
    class="banner-container flex flex-col lg:flex-row items-center justify-center border-accent border bg-primary text-white px-4 py-3 rounded-lg shadow-lg w-full mb-6"
  >
    <!-- Display the image if it exists, otherwise use default -->
    <div class="flex-shrink-0 h-auto">
      <img
        v-if="safePage.image"
        :src="'/images/' + safePage.image"
        alt="Page banner image"
        class="object-contain rounded-lg max-h-24 lg:max-h-32"
      />
    </div>

    <!-- Title and Subtitle -->
    <div
      class="flex flex-col justify-center text-center lg:text-left lg:w-3/4 mt-3 lg:mt-0 lg:ml-4"
    >
      <h1 class="text-2xl md:text-4xl font-extrabold">
        {{ safePage.title || 'Kind Robots' }}
      </h1>
      <p class="text-md md:text-lg font-medium mt-1">
        {{ safePage.subtitle || 'Craft your universe.' }}
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
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

// ✅ Ensure `page` is always an object
const safePage = computed(() => page.value ?? {})
</script>
