<template>
  <div
    class="prompt-factory-container flex flex-col items-center min-h-screen w-full overflow-hidden p-4"
  >
    

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
            : 'bg-info hover:bg-secondary text-white',
        ]"
        @click="activeTab = tab.name"
      >
        {{ tab.label }}
      </button>
    </div>

    <!-- Components section with scrollable content -->
    <div
      class="components-section flex-grow w-full max-w-4xl overflow-y-auto p-2 md:p-4 lg:p-6"
    >
      <LazyPitchGallery v-if="activeTab === 'pitch-gallery'" />
      <LazyAddPitch v-if="activeTab === 'add-pitch'" />
      <LazyBrainstormGame v-if="activeTab === 'brainstorm-game'" />
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

// Tabs setup for Prompt Factory
const tabs = [
  { name: 'pitch-gallery', label: 'Pitch Gallery' },
  { name: 'add-pitch', label: 'Add Pitch' },
  { name: 'brainstorm-game', label: 'Brainstorm!' },
]

const activeTab = ref('pitch-gallery') // Default to the first tab
</script>
