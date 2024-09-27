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
        <!-- Intro Section with random image and component count -->
        <div
          v-if="!componentStore.selectedComponent"
          class="intro-section text-center"
        >
          <p class="text-lg px-4">
            Welcome to the WonderLab! Select a folder to view components.
          </p>
          <component-count></component-count>

          <!-- Sync Components Button, shown only if the user is ADMIN -->
          <button
            v-if="userStore.role === 'ADMIN'"
            class="btn btn-primary mt-4"
            :disabled="isSyncing"
            @click="syncComponents"
          >
            <span v-if="isSyncing">Syncing...</span>
            <span v-else>Sync Components</span>
          </button>

          <!-- Display real-time log output -->
          <div class="log-output bg-gray-200 p-4 mt-4 rounded">
            <p
              v-for="(log, index) in logOutput"
              :key="index"
              class="text-sm text-left"
            >
              {{ log }}
            </p>
          </div>
        </div>

        <!-- LabGallery component, scrollable for smaller screens -->
        <lab-gallery
          v-if="!componentStore.selectedComponent"
          class="lab-gallery"
        />

        <!-- Component Screen -->
        <component-screen
          v-if="componentStore.selectedComponent"
          :component="componentStore.selectedComponent"
          @close="handleComponentClose"
        ></component-screen>
      </div>
    </transition>

    <!-- Error Reporting -->
    <div v-if="errorMessages.length" class="col-span-3 text-red-500 mt-4">
      🚨 Error loading data: {{ errorMessages.join(', ') }}
    </div>

    <!-- Debug Message -->
    <div v-if="debugMessage" class="text-blue-500 mt-4">
      {{ debugMessage }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useComponentStore } from './../../../stores/componentStore'
import { useDisplayStore } from './../../../stores/displayStore'
import { useErrorStore, ErrorType } from './../../../stores/errorStore'
import { useUserStore } from './../../../stores/userStore' // Import user store
import LabGallery from './LabGallery.vue'
import ComponentScreen from './ComponentScreen.vue'

// State variables
const isLoading = ref(true)
const errorMessages = ref<string[]>([])
const debugMessage = ref<string | null>(null) // For debugging the initialization process
const isSyncing = ref(false) // For handling sync button loading
const logOutput = ref<string[]>([]) // Capture real-time logs

// Access the component store, display store, error store, and user store
const componentStore = useComponentStore()
const displayStore = useDisplayStore()
const errorStore = useErrorStore()
const userStore = useUserStore()

// Watch for when a component is selected to hide the sidebars
watch(
  () => componentStore.selectedComponent,
  (selectedComponent) => {
    if (selectedComponent) {
      displayStore.changeState('sidebarLeftState', 'hidden')
      displayStore.changeState('sidebarRightState', 'hidden')
      debugMessage.value = 'Component selected, sidebars hidden.'
    } else {
      displayStore.changeState('sidebarLeftState', 'open')
      displayStore.changeState('sidebarRightState', 'open')
      debugMessage.value = 'No component selected, sidebars opened.'
    }
  },
)

// Initialize components on mount
onMounted(async () => {
  isLoading.value = true
  try {
    debugMessage.value = 'Initializing components...'
    await errorStore.handleError(
      async () => {
        await componentStore.initializeComponents()
        debugMessage.value = 'Components initialized successfully!'
      },
      ErrorType.GENERAL_ERROR,
      'Error during component initialization',
    )
  } catch (error) {
    errorMessages.value.push('Failed to initialize components')
    console.error('Error during initialization:', error)
  } finally {
    isLoading.value = false
  }
})

// Handle when the component is closed
const handleComponentClose = () => {
  componentStore.clearSelectedComponent()
}

// Sync components from components.json to the database
const syncComponents = async () => {
  isSyncing.value = true
  logOutput.value = [] // Clear previous logs
  debugMessage.value = 'Syncing components...'

  // Override console.log temporarily
  const originalLog = console.log
  console.log = (message: unknown) => {
    logOutput.value.push(String(message))
    originalLog(message) // Still output to browser console
  }

  try {
    await errorStore.handleError(
      async () => {
        await componentStore.syncComponents()
        debugMessage.value = 'Components synced successfully!'
      },
      ErrorType.GENERAL_ERROR,
      'Error syncing components from components.json',
    )
  } catch (error) {
    errorMessages.value.push('Failed to sync components')
    console.error('Error during component sync:', error)
  } finally {
    // Restore original console.log
    console.log = originalLog
    isSyncing.value = false
  }
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

/* Mobile-first design for LabGallery */
.lab-gallery {
  max-height: 80vh; /* Ensure space for scroll */
  overflow-y: auto;
  padding: 1rem;
}

/* Adjust padding for smaller screens */
@media (max-width: 600px) {
  .lab-gallery {
    padding: 0.5rem;
  }
}
</style>
