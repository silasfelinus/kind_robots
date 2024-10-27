<template>
  <div
    class="art-lab-container flex flex-col items-center min-h-screen w-full overflow-hidden p-4"
  >
    <!-- Adjust the button container with w-full or a max-width -->
    <div
      class="flex justify-center space-x-1 md:space-x-3 lg:space-x-5 w-full max-w-xl mb-3"
    >
      <button
        v-for="tab in tabs"
        :key="tab.name"
        class="flex-1 px-4 py-2 text-lg font-semibold border-accent rounded-lg text-center"
        :class="{
          'bg-primary text-white': tab.name === choice,
          'bg-accent hover:bg-secondary text-white': tab.name !== choice,
        }"
        @click="choice = tab.name"
      >
        {{ tab.label }}
      </button>
    </div>

    <!-- Components section with scrollable content -->
    <div
      class="components-section flex-grow w-full max-w-4xl overflow-y-auto p-2 md:p-4 lg:p-6"
    >
      <lazy-art-maker v-if="choice === 'art-maker'" />
      <lazy-art-collection v-if="choice === 'art-collection'" />
      <lazy-art-gallery v-if="choice === 'art-gallery'" />
      <lazy-hot-or-not v-if="choice === 'hot-or-not'" />
      <lazy-art-challenge v-if="choice === 'art-challenge'" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

// Tabs setup for Art Lab
const tabs = [
  { name: 'art-maker', label: 'Art Maker' },
  { name: 'art-collection', label: 'Art Collection' },
  { name: 'art-gallery', label: 'Art Gallery' },
  { name: 'hot-or-not', label: 'Hot or Not' },
  { name: 'art-challenge', label: 'Art Challenge' },
]

const choice = ref('art-maker') // Default to the first tab
</script>
