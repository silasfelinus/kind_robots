<template>
  <div
    class="art-lab-container flex flex-col"
    :style="{ height: displayStore.mainHeight }"
  >
    <!-- Loading State -->
    <div v-if="isLoading" class="flex justify-center items-center h-full">
      <Icon name="mdi:loading" class="animate-spin text-4xl" />
      Loading...
    </div>

    <!-- Show content when not loading and no errors -->
    <transition name="flip">
      <div v-if="!isLoading && !errorMessages.length" class="flex-grow">
        <!-- Art Section Buttons (Fixed at the top) -->
        <div class="flex justify-center space-x-4 mb-4">
          <button
            class="btn btn-primary"
            @click="selectArtSection('art-maker')"
          >
            Art Maker
          </button>

          <button
            class="btn btn-secondary"
            @click="selectArtSection('art-collection')"
          >
            Art Collection
          </button>

          <button
            class="btn btn-accent"
            @click="selectArtSection('art-gallery')"
          >
            Art Gallery
          </button>
        </div>

        <!-- Art Sections -->
        <div class="art-sections flex-grow overflow-auto">
          <!-- Art Maker Screen -->
          <lazy-art-maker
            v-show="selectedArtSection === 'art-maker'"
            @close="handleSectionClose"
          ></lazy-art-maker>

          <!-- Art Collection Screen -->
          <lazy-art-collection
            v-show="selectedArtSection === 'art-collection'"
            @close="handleSectionClose"
          ></lazy-art-collection>

          <!-- Art Gallery Screen (Ensure it's a different component or manages state differently) -->
          <lazy-art-gallery
            v-show="selectedArtSection === 'art-gallery'"
            @close="handleSectionClose"
          ></lazy-art-gallery>
        </div>
      </div>
    </transition>

    <!-- Error Reporting -->
    <div v-if="errorMessages.length" class="col-span-3 text-red-500 mt-4">
      🚨 Error: {{ errorMessages.join(', ') }}
    </div>

    <!-- Debug Message -->
    <div v-if="debugMessage" class="text-blue-500 mt-4">
      {{ debugMessage }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useDisplayStore } from './../../../stores/displayStore'
import { useErrorStore, ErrorType } from './../../../stores/errorStore'

// State variables
const isLoading = ref(true)
const errorMessages = ref<string[]>([])
const debugMessage = ref<string | null>(null) // For debugging the initialization process
const selectedArtSection = ref<string | null>(null) // Track selected section (art-maker, art-collection, art-gallery)

// Access the stores
const displayStore = useDisplayStore()
const errorStore = useErrorStore()

// Watch for selected section and adjust layout as needed
watch(
  () => selectedArtSection.value,
  (section) => {
    debugMessage.value = section ? `${section} selected` : 'No section selected'
  },
)

// Initialize components on mount
onMounted(async () => {
  isLoading.value = true
  try {
    debugMessage.value = 'Initializing Art-Lab...'
    displayStore.initialize() // Ensure displayStore is initialized
    // Simulate initialization of art-lab data
    await errorStore.handleError(
      async () => {
        debugMessage.value = 'Art-Lab initialized successfully!'
      },
      ErrorType.GENERAL_ERROR,
      'Error during Art-Lab initialization',
    )
  } catch (error) {
    errorMessages.value.push('Failed to initialize Art-Lab')
    console.error('Error during initialization:', error)
  } finally {
    isLoading.value = false
  }
})

// Handle when a section is closed
const handleSectionClose = () => {
  selectedArtSection.value = null
}

// Select the section (art-maker, art-collection, art-gallery)
const selectArtSection = (section: string) => {
  selectedArtSection.value = section
}
</script>

<style scoped>
.art-lab-container {
  width: 100%;
  overflow: hidden;
}

.flip-enter-active,
.flip-leave-active {
  transition: transform 0.6s;
  transform-style: preserve-3d;
}
.flip-enter,
.flip-leave-to {
  transform: rotateY(180deg);
}

.art-sections {
  padding: 1rem;
  max-height: 80vh; /* Adjust as needed */
}

@media (max-width: 600px) {
  .art-sections {
    padding: 0.5rem;
  }
}
</style>
