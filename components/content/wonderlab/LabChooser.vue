<template>
  <div class="flex flex-col items-center min-h-screen bg-base-200 p-2">
    <h1 class="text-5xl font-bold mb-3 text-primary">Wonderlab</h1>

    <!-- Tabs for toggling components (Always at the top) -->
    <div
      class="flex justify-center space-x-4 w-full max-w-4xl mb-4"
      :style="{ height: headerHeight }"
    >
      <button
        v-for="tab in tabs"
        :key="tab.name"
        :class="[
          'px-6 py-3 text-xl font-semibold rounded-lg',
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
      class="flex-grow w-full max-w-4xl overflow-y-auto"
      :style="{ height: mainHeight }"
    >
      <div v-show="activeTab === 'store-tester'">
        <LazyStoreTester />
      </div>
      <div v-show="activeTab === 'animation-tester'">
        <LazyAnimationTester />
      </div>
      <div v-show="activeTab === 'wonder-lab'">
        <LazyWonderLab />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useDisplayStore } from '@/stores/displayStore'

// Access the display store for dynamic header height
const displayStore = useDisplayStore()

// Tabs setup
const tabs = [
  { name: 'store-tester', label: 'Store Tester' },
  { name: 'animation-tester', label: 'Animation Tester' },
  { name: 'wonder-lab', label: 'Wonder Lab' },
]

const activeTab = ref('store-tester')

// Compute the header and main content heights from the display store
const headerHeight = computed(() => displayStore.headerHeight)
const mainHeight = computed(() => displayStore.mainHeight)
</script>

<style scoped>
/* Add any optional styling here */
</style>
