<template>
  <header
    class="flex flex-col items-center p-2 bg-base-400 rounded-2xl border-8 border-accent m-2 relative"
  >
    <div class="flex justify-between items-center w-full">
      <home-link />
      <layout-selector class="relative" />
      <h1 class="text-4xl text-default font-bold">Welcome to Kind Robots</h1>
      <theme-toggle />
      <butterfly-toggle class="mr-2" />
    </div>

    <div
      class="flex flex-col items-center justify-center bg-secondary p-2 rounded-2xl border-8 border-accent m-2 relative w-full"
    >
      <h1 v-if="safePage.title" class="text-4xl text-default font-bold">
        Location: {{ safePage.title }}
      </h1>
      <h1 v-else class="text-4xl text-default font-bold">
        Location: 🌀 Loading...
      </h1>
      <h2 v-if="safePage.subtitle" class="text-2xl text-default">
        {{ safePage.subtitle }}
      </h2>
      <h2 v-else class="text-2xl text-accent">🌈 Fetching details...</h2>
    </div>

    <div class="flex justify-center items-center m-2 relative w-full">
      <screen-fx />
    </div>
  </header>
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

// ✅ Create a computed ref that safely accesses page properties
const safePage = computed(() => page.value ?? {})
</script>

<style scoped>
/* Flip card transition */
.flip-card-enter-active,
.flip-card-leave-active {
  transition: transform 1s;
}
.flip-card-enter,
.flip-card-leave-to {
  transform: rotateY(180deg);
}
</style>
