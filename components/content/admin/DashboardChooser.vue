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
        :class="[
          'px-2 md:px-4 lg:px-6 text-lg font-semibold border-accent rounded-lg',
          tab.name === choice
            ? 'bg-info text-white'
            : 'bg-accent hover:bg-secondary text-white',
        ]"
        @click="choice = tab.name"
      >
        {{ tab.label }}
      </button>
    </div>

    <!-- Components section with scrollable content -->
    <div
      class="components-section flex-grow w-full max-w-4xl overflow-y-auto p-2 md:p-4 lg:p-6"
    >
      <lazy-intro-page v-if="choice === 'intro-page'" />
      <lazy-navigation-trimmed v-if="choice === 'navigation-trimmed'" />
      <lazy-user-dashboard v-if="choice === 'user-dashboard'" />
      <lazy-user-gallery v-if="choice === 'user-gallery'" />
      <lazy-jellybean-counter v-if="choice === 'jellybean-counter'" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

// Tabs setup for Dashboard Chooser
const tabs = [
  { name: 'intro-page', label: 'Welcome!' },
  { name: 'navigation-trimmed', label: 'Site Navigation' },
  { name: 'user-dashboard', label: 'User Dashboard' },
  { name: 'user-gallery', label: 'User Gallery' },

  { name: 'jellybean-counter', label: 'Jellybean Counter' },
]

const choice = ref('user-dashboard') // Default to the first tab
</script>
