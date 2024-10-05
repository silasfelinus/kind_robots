<template>
  <div class="art-lab-container flex flex-col z-10" :style="{ height: displayStore.mainHeight }">
    <!-- Art Section Buttons (Fixed at the top) -->
    <div class="flex justify-center space-x-2 sm:space-x-1 md:space-x-4 lg:space-x-6 mb-4">
      <button class="btn btn-primary px-4 py-2 sm:px-2 sm:py-1 md:px-3 lg:px-6" @click="selectArtSection('art-maker')">
        Art Maker
      </button>

      <button class="btn btn-secondary px-4 py-2 sm:px-2 sm:py-1 md:px-3 lg:px-6" @click="selectArtSection('art-collection')">
        Art Collection
      </button>

      <button class="btn btn-accent px-4 py-2 sm:px-2 sm:py-1 md:px-3 lg:px-6" @click="selectArtSection('art-gallery')">
        Art Gallery
      </button>

      <button class="btn btn-warning px-4 py-2 sm:px-2 sm:py-1 md:px-3 lg:px-6" @click="selectArtSection('hot-or-not')">
        Hot or Not
      </button>
    </div>

    <!-- Art Sections -->
    <div class="art-sections flex-grow overflow-y-auto">
      <!-- Art Maker Screen -->
      <lazy-art-maker v-show="selectedArtSection === 'art-maker'" @close="handleSectionClose"></lazy-art-maker>

      <!-- Art Collection Screen -->
      <lazy-art-collection v-show="selectedArtSection === 'art-collection'" @close="handleSectionClose"></lazy-art-collection>

      <!-- Art Gallery Screen -->
      <lazy-art-gallery v-show="selectedArtSection === 'art-gallery'" @close="handleSectionClose"></lazy-art-gallery>

      <!-- Hot or Not Screen -->
      <lazy-hot-or-not v-show="selectedArtSection === 'hot-or-not'" @close="handleSectionClose"></lazy-hot-or-not>
    </div>

    <!-- Debug Message -->
    <div v-if="debugMessage" class="text-blue-500 mt-4">
      {{ debugMessage }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useDisplayStore } from './../../../stores/displayStore'

// State variables
const debugMessage = ref<string | null>(null) // For debugging the section selection
const selectedArtSection = ref<string | null>(null) // Track selected section (art-maker, art-collection, art-gallery, hot-or-not)

// Access the display store
const displayStore = useDisplayStore()

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

<style scoped>
.art-lab-container {
  width: 100%;
  overflow: hidden;
}

/* Art Sections Padding and Overflow */
.art-sections {
  height: 100%; /* Ensures it respects the parent's height */
  overflow-y: auto; /* Allow scrolling inside */
  padding: 1rem;
}

/* Responsive Adjustments for Padding */
@media (max-width: 600px) {
  .art-sections {
    padding: 0.5rem;
  }
}

@media (min-width: 768px) {
  .art-sections {
    padding: 1.5rem;
  }
}

@media (min-width: 1024px) {
  .art-sections {
    padding: 2rem;
  }
}
</style>