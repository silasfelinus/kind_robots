<template>
  <div
    class="dashboard-chooser-container flex flex-col items-center min-h-screen bg-base-200 p-4"
  >
    <!-- Dashboard Header -->
    <h1 class="text-5xl font-bold mb-4 text-primary">Dashboard Chooser</h1>

    <!-- Tabs for toggling components -->
    <div
      class="flex justify-center space-x-2 sm:space-x-1 md:space-x-4 lg:space-x-6 w-full max-w-4xl mb-6"
    >
      <button
        v-for="tab in tabs"
        :key="tab.name"
        :class="[
          'px-4 py-2 sm:px-2 md:px-4 lg:px-6 text-lg font-semibold rounded-lg',
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
      class="components-section flex-grow w-full max-w-4xl overflow-y-auto p-4 sm:p-2"
    >
      <!-- Lazy loaded components based on choice -->
      <lazy-user-dashboard
        v-if="choice === 'user-dashboard'"
        @close="handleSectionClose"
      />
      <lazy-private-generator
        v-if="choice === 'private-generator' && role === 'ADMIN'"
        @close="handleSectionClose"
      />
      <lazy-rebel-button
        v-if="choice === 'private-generator' && role !== 'ADMIN'"
        @close="handleSectionClose"
      />
      <lazy-jellybean-counter
        v-if="choice === 'jellybean-counter'"
        @close="handleSectionClose"
      />
      <lazy-about-page
        v-if="choice === 'about-page'"
        @close="handleSectionClose"
      />
      <lazy-sponsor-page
        v-if="choice === 'sponsor-page'"
        @close="handleSectionClose"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useUserStore } from '@/stores/userStore'

// Access user information from the user store
const userStore = useUserStore()
const role = computed(() => userStore.user?.Role)

// Tabs setup for Dashboard Chooser
const tabs = [
  { name: 'user-dashboard', label: 'User Dashboard' },
  { name: 'private-generator', label: 'Private Generator' },
  { name: 'jellybean-counter', label: 'Jellybean Counter' },
  { name: 'about-page', label: 'About Page' },
  { name: 'sponsor-page', label: 'Sponsor Page' },
]

const choice = ref<string | null>('user-dashboard') // Allow both string and null

// Handle when a section is closed
const handleSectionClose = () => {
  choice.value = null
}
</script>

<style scoped>
.dashboard-chooser-container {
  width: 100%;
  overflow: hidden;
}

/* Responsive padding and scroll adjustments for the components section */
.components-section {
  height: 100%;
  overflow-y: auto;
}

/* Responsive adjustments for spacing and padding */
@media (max-width: 600px) {
  .components-section {
    padding: 0.5rem;
  }
}

@media (min-width: 768px) {
  .components-section {
    padding: 1rem;
  }
}

@media (min-width: 1024px) {
  .components-section {
    padding: 1.5rem;
  }
}
</style>
