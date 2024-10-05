<template>
  <div
    class="wonderlab-container flex flex-col items-center min-h-screen p-4 w-full overflow-hidden"
  >
    <!-- Wonderlab Banner -->
    <kind-banner />

    <!-- Tabs for toggling components -->
    <div
      class="flex justify-center space-x-1 md:space-x-3 lg:space-x-5 w-full mb-3"
    >
      <button
        v-for="tab in tabs"
        :key="tab.name"
        :class="[
          'px-2 md:px-4 lg:px-6 text-lg font-semibold border-accent rounded-lg',
          tab.name === activeTab
            ? 'bg-primary text-white'
            : 'bg-accent hover:bg-secondary text-white',
        ]"
        @click="activeTab = tab.name"
      >
        {{ tab.label }}
      </button>
    </div>

    <!-- Components section with scrollable content -->
    <div
      class="flex-grow w-full max-w-4xl overflow-y-auto p-2 md:p-4 lg:p-6 h-full"
    >
      <LazyStoreTester v-if="activeTab === 'store-tester'" />
      <LazyAnimationTester v-if="activeTab === 'animation-tester'" />
      <LazyWonderLab v-if="activeTab === 'wonder-lab'" />
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

// Tabs setup for Wonderlab
const tabs = [
  { name: 'store-tester', label: 'Store Tester' },
  { name: 'animation-tester', label: 'Animation Tester' },
  { name: 'wonder-lab', label: 'Wonder Lab' },
]

const activeTab = ref('store-tester') // Default to the first tab
</script>
