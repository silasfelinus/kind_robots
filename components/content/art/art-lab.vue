<template>
  <div>
    <!-- Loading State -->
    <div v-if="isLoading" class="flex justify-center items-center h-full">
      <Icon name="mdi:loading" class="animate-spin text-4xl" />
      Loading...
    </div>

    <!-- Show content when not loading and no errors -->
    <transition name="flip">
      <div v-if="!isLoading && !errorMessages.length">
        <!-- Intro Section with art options -->
        <div v-if="!selectedArtSection" class="intro-section text-center">
          <p class="text-lg px-4">
            Welcome to the Art-Lab! Select an option below to start:
          </p>

          <!-- Art-Maker Button -->
          <button
            class="btn btn-primary mt-4"
            @click="selectArtSection('art-maker')"
          >
            Art Maker
          </button>

          <!-- Art-Collection Button -->
          <button
            class="btn btn-secondary mt-4"
            @click="selectArtSection('art-collection')"
          >
            Art Collection
          </button>

          <!-- Art-Gallery Button -->
          <button
            class="btn btn-accent mt-4"
            @click="selectArtSection('art-gallery')"
          >
            Art Gallery
          </button>
        </div>

        <!-- Art Maker Screen -->
        <art-maker
          v-if="selectedArtSection === 'art-maker'"
          @close="handleSectionClose"
        ></art-maker>

        <!-- Art Collection Screen -->
        <art-collection
          v-if="selectedArtSection === 'art-collection'"
          @close="handleSectionClose"
        ></art-collection>

        <!-- Art Gallery Screen -->
        <art-gallery
          v-if="selectedArtSection === 'art-gallery'"
          @close="handleSectionClose"
        ></art-gallery>
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
import { useErrorStore, ErrorType } from './../../../stores/errorStore'

// State variables
const isLoading = ref(true)
const errorMessages = ref<string[]>([])
const debugMessage = ref<string | null>(null) // For debugging the initialization process
const selectedArtSection = ref<string | null>(null) // Track selected section (art-maker, art-collection, art-gallery)

// Access the error store
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
    // Simulate initialization of art-lab data
    await errorStore.handleError(
      async () => {
        // Initialize logic for the art sections (if needed)
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
.flip-enter-active,
.flip-leave-active {
  transition: transform 0.6s;
  transform-style: preserve-3d;
}
.flip-enter,
.flip-leave-to {
  transform: rotateY(180deg);
}

.intro-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.log-output {
  max-height: 200px;
  overflow-y: auto;
  white-space: pre-wrap;
}

/* Mobile-first design for gallery */
.art-gallery,
.art-collection,
.art-maker {
  max-height: 80vh; /* Ensure space for scroll */
  overflow-y: auto;
  padding: 1rem;
}

/* Adjust padding for smaller screens */
@media (max-width: 600px) {
  .art-gallery,
  .art-collection,
  .art-maker {
    padding: 0.5rem;
  }
}
</style>
