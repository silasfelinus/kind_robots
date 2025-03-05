<template>
  <div class="fixed bottom-4 right-4" @click="toggleTooltip">
    <!-- Pulsing Butterfly Icon -->
    <div v-if="!tooltipOpen && safePage.tooltip" class="cursor-pointer">
      <Icon name="ph:butterfly-duotone" class="text-3xl animate-pulse" />
    </div>

    <!-- Tooltip Popup -->
    <div
      v-else-if="tooltipOpen && safePage.tooltip"
      class="tooltip-popup bg-base-300 p-4 rounded-2xl border"
    >
      <div>
        <span class="font-semibold">
          <butterfly-loader />
          <Icon name="kind-icon:chat" class="text-default mr-2 text-2xl" />AMI
          Says:
          <!-- Display tooltip text -->
          <span class="text-default text-xl">{{ safePage.tooltip }}</span>
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
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

// Reactive tooltip state
const tooltipOpen = ref(false)

// Toggle tooltip visibility
const toggleTooltip = () => {
  tooltipOpen.value = !tooltipOpen.value
}
</script>

<style scoped>
.tooltip-popup {
  max-width: 300px;
}
</style>
