<template>
  <div class="flex flex-col items-center justify-center min-h-screen bg-base-200 p-8">
    <h1 class="text-5xl font-bold mb-10 text-primary">Your Friendly Launcher</h1>

    <!-- Tabs for toggling components -->
    <div class="flex justify-center space-x-4 mb-8 w-full max-w-4xl">
      <button
        v-for="tab in tabs"
        :key="tab.name"
        @click="activeTab = tab.name"
        :class="[
          'px-6 py-3 text-xl font-semibold rounded-lg',
          tab.name === activeTab ? 'bg-primary text-white' : 'bg-accent hover:bg-secondary text-white'
        ]"
      >
        {{ tab.label }}
      </button>
    </div>

    <!-- Components with v-show -->
    <div class="w-full h-full">
      <LazyStoreTester v-show="activeTab === 'store-tester'" />
      <LazyAnimationTester v-show="activeTab === 'animation-tester'" />
      <LazyWonderLab v-show="activeTab === 'wonder-lab'" />
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

// Tabs setup
const tabs = [
  { name: 'store-tester', label: 'Store Tester' },
  { name: 'animation-tester', label: 'Animation Tester' },
  { name: 'wonder-lab', label: 'Wonder Lab' }
]

const activeTab = ref('store-tester')
</script>

<style scoped>
/* Optional custom styling for buttons and components */
</style>
