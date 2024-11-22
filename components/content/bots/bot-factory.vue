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
        class="flex-1 min-w-[45%] max-w-[30%] md:min-w-[25%] lg:min-w-[15%] px-3 py-2 text-sm md:text-md lg:text-lg font-semibold border border-accent rounded-lg transition-all duration-300 text-center"
        :class="[
          tab.name === activeTab
            ? 'bg-primary text-white'
            : 'bg-secondary hover:bg-accent text-white',
        ]"
        @click="activeTab = tab.name"
      >
        {{ tab.label }}
      </button>
    </div>

    <!-- Bot Sections -->
    <div class="flex-grow w-full overflow-y-auto h-full">
      <lazy-add-bot v-if="activeTab === 'add-bot'" />
      <lazy-use-bot v-if="activeTab === 'use-bot'" />
      <lazy-chat-test v-if="activeTab === 'chat-test'" />
      <lazy-stream-tester v-if="activeTab === 'stream-tester'" />
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

// Tabs setup for Bot Factory
const tabs = [
  { name: 'add-bot', label: 'Add Bot' },
  { name: 'use-bot', label: 'Use Bot' },
  { name: 'chat-test', label: 'Chat Test' },
  { name: 'stream-tester', label: 'Stream Tester' },
]

// Default to the first tab
const activeTab = ref(tabs[0]?.name || 'add-bot')

// Dynamically compute the main content area size
const mainContentStyle = computed(() => ({
  height: `calc(${displayStore.mainVh}vh)`,
  width: `calc(${displayStore.mainVw}vw)`,
}))
</script>
