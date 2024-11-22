<template>
  <div
    class="button-container flex flex-col items-center overflow-hidden p-4"
    :style="mainContentStyle"
  >
    <!-- Section Buttons -->
    <div
      class="flex justify-center flex-wrap gap-2 md:gap-3 lg:gap-4 w-full mb-3"
    >
      <button
        v-for="tab in tabs"
        :key="tab.name"
        class="flex-1 min-w-[45%] max-w-[30%] md:min-w-[25%] lg:min-w-[15%] px-3 py-2 text-sm md:text-md lg:text-lg font-semibold border border-accent rounded-lg transition-all duration-300"
        :class="[
          tab.name === choice
            ? 'bg-primary text-white'
            : 'bg-secondary hover:bg-accent text-white',
        ]"
        @click="choice = tab.name"
      >
        {{ tab.label }}
      </button>
    </div>

    <!-- Components section with scrollable content -->
    <div class="flex-grow w-full overflow-y-auto h-full">
      <lazy-intro-page v-if="choice === 'intro-page'" />
      <lazy-navigation-trimmed v-if="choice === 'navigation-trimmed'" />
      <lazy-user-dashboard v-if="choice === 'user-dashboard'" />
      <lazy-user-gallery v-if="choice === 'user-gallery'" />
      <lazy-jellybean-counter v-if="choice === 'jellybean-counter'" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useDisplayStore } from '~/stores/displayStore'

// Access the display store
const displayStore = useDisplayStore()

// Ensure displayStore initializes and stays updated
onMounted(() => {
  displayStore.initialize()
})

// Tabs setup for Dashboard Chooser
const tabs = [
  { name: 'intro-page', label: 'Welcome!' },
  { name: 'navigation-trimmed', label: 'Site Navigation' },
  { name: 'user-dashboard', label: 'User Dashboard' },
  { name: 'user-gallery', label: 'User Gallery' },
  { name: 'jellybean-counter', label: 'Jellybean Counter' },
]

// Default to the first tab
const choice = ref(tabs[0]?.name || 'user-dashboard')

// Dynamically compute the main content area size
const mainContentStyle = computed(() => ({
  height: `calc(${displayStore.mainVh}vh)`,
  width: `calc(${displayStore.mainVw}vw)`,
}))
</script>
