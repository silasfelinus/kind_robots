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
            ? 'bg-primary text-white'
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
      <lazy-user-dashboard v-if="choice === 'user-dashboard'" />
      <lazy-rebel-button />
      <lazy-jellybean-counter v-if="choice === 'jellybean-counter'" />
      <lazy-about-page v-if="choice === 'about-page'" />
      <lazy-sponsor-page v-if="choice === 'sponsor-page'" />
      <lazy-userstore-manager v-if="choice === 'userstore-manager'" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

// Tabs setup for Dashboard Chooser
const tabs = [
  { name: 'user-dashboard', label: 'User Dashboard' },
  { name: 'rebel-button', label: 'Rebel Button' },
  { name: 'jellybean-counter', label: 'Jellybean Counter' },
  { name: 'about-page', label: 'About Page' },
  { name: 'sponsor-page', label: 'Sponsor Page' },
  { name: 'userstore-manager', label: 'User Manager' },
]

const choice = ref('user-dashboard') // Default to the first tab
</script>
