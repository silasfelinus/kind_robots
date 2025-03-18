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
        class="flex-1 min-w-[45%] max-w-[30%] md:min-w-[25%] lg:min-w-[15%] px-3 py-2 text-sm md:text-md lg:text-lg font-semibold border border-accent rounded-lg transition-all duration-300 text-center"
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
      <lazy-add-bot v-if="choice === 'add-bot'" />
      <lazy-use-bot v-if="choice === 'use-bot'" />
      <lazy-stream-tester v-if="choice === 'stream-tester'" />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useDisplayStore } from '~/stores/displayStore'

// Access the display store
const displayStore = useDisplayStore()

// Tabs setup for Bot Factory
const tabs = [
  { name: 'add-bot', label: 'Add Bot' },
  { name: 'use-bot', label: 'Use Bot' },
  { name: 'stream-tester', label: 'Stream Tester' },
]

// State to manage the active tab
const choice = ref(tabs[0]?.name || 'add-bot')

// Dynamically compute the main content area size
const mainContentStyle = computed(() => ({
  height: `calc(${displayStore.mainVh}vh)`,
  width: `calc(${displayStore.mainVw}vw)`,
}))

// Set active tab
const selectTab = (tabName) => {
  choice.value = tabName
}

// Ensure displayStore initializes and stays updated
onMounted(() => {
  displayStore.initialize()
})
</script>

<style></style>
