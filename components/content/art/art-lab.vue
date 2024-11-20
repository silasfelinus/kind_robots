<template>
  <div
    class="button-container flex flex-col items-center min-h-screen w-full overflow-hidden p-4"
  >
    <!-- Section Buttons -->
    <div
      class="flex justify-center space-x-1 md:space-x-3 lg:space-x-5 w-full mb-3"
    >
      <button
        v-for="tab in tabs"
        :key="tab.name"
        class="flex-1 px-1 py-1 md:px-4 md:py-2 text-sm md:text-lg font-semibold border-accent rounded-lg text-center"
        :class="{
          'bg-info text-white': tab.name === choice,
          'bg-accent hover:bg-secondary text-white': tab.name !== choice,
        }"
        @click="choice = tab.name"
      >
        {{ tab.label }}
      </button>
    </div>

    <!-- Components section with scrollable content -->
    <div class="components-section flex-grow w-full overflow-y-auto">
      <lazy-art-maker v-if="choice === 'art-maker'" />
      <lazy-comfy-frontend v-if="choice === 'comfy-frontend'" />
      <lazy-art-collection v-if="choice === 'art-collection'" />
      <lazy-art-gallery v-if="choice === 'art-gallery'" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

// Tabs setup for Art Lab
const tabs = [
  { name: 'art-maker', label: 'Art Maker' },
  { name: 'comfy-frontend', label: 'Comfy' },
  { name: 'art-collection', label: 'Art Collection' },
  { name: 'art-gallery', label: 'Art Gallery' },
]

const choice = ref('art-maker') // Default to the first tab
</script>
