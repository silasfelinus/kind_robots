<template>
  <div
    class="art-lab-container flex flex-col items-center min-h-screen w-full overflow-hidden p-4"
  >
    <!-- Art Section Buttons (Fixed at the top) -->
    <div
      class="flex justify-center space-x-1 md:space-x-3 lg:space-x-5 w-full mb-3"
    >
      <button
        class="px-2 md:px-4 lg:px-6 text-lg font-semibold border-accent rounded-lg"
        @click="selectArtSection('art-maker')"
      >
        Art Maker
      </button>

      <button
        class="px-2 md:px-4 lg:px-6 text-lg font-semibold border-accent rounded-lg"
        @click="selectArtSection('art-collection')"
      >
        Art Collection
      </button>

      <button
        class="px-2 md:px-4 lg:px-6 text-lg font-semibold border-accent rounded-lg"
        @click="selectArtSection('art-gallery')"
      >
        Art Gallery
      </button>

      <button
        class="px-2 md:px-4 lg:px-6 text-lg font-semibold border-accent rounded-lg"
        @click="selectArtSection('hot-or-not')"
      >
        Hot or Not
      </button>
    </div>

    <!-- Art Sections -->
    <div
      class="art-sections flex-grow w-full max-w-4xl overflow-y-auto p-2 md:p-4 lg:p-6"
    >
      <!-- Art Maker Screen -->
      <lazy-art-maker
        v-if="selectedArtSection === 'art-maker'"
        @close="handleSectionClose"
      />

      <!-- Art Collection Screen -->
      <lazy-art-collection
        v-if="selectedArtSection === 'art-collection'"
        @close="handleSectionClose"
      />

      <!-- Art Gallery Screen -->
      <lazy-art-gallery
        v-if="selectedArtSection === 'art-gallery'"
        @close="handleSectionClose"
      />

      <!-- Hot or Not Screen -->
      <lazy-hot-or-not
        v-if="selectedArtSection === 'hot-or-not'"
        @close="handleSectionClose"
      />
    </div>

    <!-- Debug Message -->
    <div v-if="debugMessage" class="text-blue-500 mt-4">
      {{ debugMessage }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'

// State variables
const debugMessage = ref<string | null>(null) // For debugging the section selection
const selectedArtSection = ref<string | null>(null) // Track selected section (art-maker, art-collection, art-gallery, hot-or-not)

// Watch for selected section and update the debug message
watch(
  () => selectedArtSection.value,
  (section) => {
    debugMessage.value = section ? `${section} selected` : 'No section selected'
  },
)

// Handle when a section is closed
const handleSectionClose = () => {
  selectedArtSection.value = null
}

// Select the section (art-maker, art-collection, art-gallery, hot-or-not)
const selectArtSection = (section: string) => {
  selectedArtSection.value = section
}
</script>
