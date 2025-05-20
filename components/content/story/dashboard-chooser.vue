<!-- /components/content/story/dashboard-chooser.vue -->
<template>
  <div
    class="button-container flex flex-col items-center overflow-hidden"
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
            ? 'bg-primary text-black'
            : 'bg-secondary hover:bg-accent text-black',
        ]"
        @click="selectTab(tab.name)"
      >
        {{ tab.label }}
      </button>
    </div>

    <!-- Components Section -->
    <div class="flex-grow w-full overflow-y-auto h-full">
      <lazy-user-dashboard v-if="choice === 'user-dashboard'" />
      <lazy-navigation-trimmed v-if="choice === 'navigation-trimmed'" />
      <lazy-user-chat v-if="choice === 'user-chat'" />
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

// Tabs setup for Dashboard Chooser
const tabs = [
  { name: 'user-dashboard', label: 'User Dashboard' },
  { name: 'navigation-trimmed', label: 'Site Navigation' },
  { name: 'user-gallery', label: 'User Gallery' },
  { name: 'jellybean-counter', label: 'Jellybean Counter' },
  { name: 'user-chat', label: 'User Chat' },
]

const choice = ref<string | null>(null)

// Dynamically compute the main content area size
const mainContentStyle = computed(() => ({
  height: displayStore.mainContentHeight,
  width: displayStore.mainContentWidth,
}))

// Set active tab
const selectTab = (tabName: string) => {
  choice.value = tabName
}

onMounted(() => {
  // Default to 'user-dashboard' if no choice is made
  if (!choice.value) {
    choice.value = 'user-dashboard'
  }
})
</script>

<style></style>
