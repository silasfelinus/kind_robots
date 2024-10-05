<template>
  <div
    class="prompt-factory-container flex flex-col items-center min-h-screen bg-base-200 p-4"
  >
    <!-- Prompt Factory Header -->
    <h1 class="text-5xl font-bold mb-4 text-primary">Prompt Factory</h1>

    <!-- Tabs for toggling components -->
    <div
      class="flex justify-center space-x-2 sm:space-x-1 md:space-x-4 lg:space-x-6 w-full max-w-4xl mb-6"
    >
      <button
        v-for="tab in tabs"
        :key="tab.name"
        :class="[
          'px-4 py-2 sm:px-2 md:px-4 lg:px-6 text-lg font-semibold rounded-lg',
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
      class="components-section flex-grow w-full max-w-4xl overflow-y-auto p-4 sm:p-2"
    >
      <!-- Pitch Gallery Screen -->
      <div v-show="activeTab === 'pitch-gallery'">
        <LazyPitchGallery />
      </div>

      <!-- Add Pitch Screen -->
      <div v-show="activeTab === 'add-pitch'">
        <LazyAddPitch />
      </div>

      <!-- Art Challenge Screen -->
      <div v-show="activeTab === 'art-challenge'">
        <LazyArtChallenge />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

// Tabs setup for Prompt Factory
const tabs = [
  { name: 'pitch-gallery', label: 'Pitch Gallery' },
  { name: 'add-pitch', label: 'Add Pitch' },
  { name: 'art-challenge', label: 'Art Challenge' },
]

const activeTab = ref('pitch-gallery') // Default to the first tab
</script>

<style scoped>
.prompt-factory-container {
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
