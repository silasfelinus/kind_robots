<template>
  <!-- Parent Container for Tutorial Toggle -->
  <div
    class="flex justify-center items-center bg-primary hover:bg-accent transition duration-300 cursor-pointer rounded-lg shadow-md p-3"
    @click="toggleTutorial"
  >
    <!-- Toggle Icon -->
    <Icon
      v-if="showTutorial"
      name="mdi-information-outline"
      class="text-base-200 w-8 h-8"
    />
    <Icon v-else :name="pageIcon" class="text-base-200 w-8 h-8" />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useDisplayStore } from '@/stores/displayStore'
import { useAsyncData } from '#app'

// Access the display store
const displayStore = useDisplayStore()

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
  return result || {}
})
// Compute the tutorial and icon state
const showTutorial = computed(() => displayStore.showTutorial)

// Toggle the tutorial state
const toggleTutorial = () => {
  displayStore.toggleTutorial()
}

const pageIcon = computed(() => {
  const content = page as { icon?: string }
  return content.icon ? content.icon : 'mdi-page-layout-sidebar-right'
})
</script>

<style scoped>
/* No positioning needed for the toggle since it's now in a natural flow */
</style>
