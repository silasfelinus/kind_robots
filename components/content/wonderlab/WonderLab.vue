<template>
  <div>
    <div v-if="isLoading" class="flex justify-center items-center h-full">
      <Icon name="mdi:loading" class="animate-spin text-4xl" />
      Loading...
    </div>

    <!-- Show content when not loading and no errors -->
    <transition name="flip">
      <div v-if="!isLoading && !errorMessages.length">
        <!-- Intro Section with random image and component count -->
        <div
          v-if="
            !selectedComponents.length && !selectedFolder && !selectedComponent
          "
          class="intro-section text-center"
        >
          <random-image class="mb-4" />
          <p class="text-lg px-4">
            Welcome to the WonderLab! Select a folder to view components.
          </p>
          <component-count />
        </div>

        <!-- LabGallery component -->
        <lab-gallery
          v-if="selectedFolder || selectedComponents.length"
          @select-component="selectComponent"
        />

        <!-- Component Screen -->
        <component-screen
          v-if="selectedComponent"
          :component="selectedComponent"
          @close="clearSelectedComponent"
        />
      </div>
    </transition>

    <!-- Error Reporting -->
    <div v-if="errorMessages.length" class="col-span-3 text-red-500 mt-4">
      🚨 Error loading data: {{ errorMessages.join(', ') }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useComponentStore } from '@/stores/componentStore'
import LabGallery from './LabGallery.vue' // Assuming this is the correct path for LabGallery component
import ComponentScreen from './ComponentScreen.vue' // Assuming this is the correct path for component-screen

// Define the structure of a Folder in the components.json file
interface Folder {
  folderName: string
  components: string[] // List of component names as strings
}

// State variables
const isLoading = ref(false)
const errorMessages = ref<string[]>([]) // Array for storing error messages
const selectedFolder = ref<string | null>(null) // Selected folder for context
const selectedComponents = ref([]) // Components of the selected folder from the store (empty at start)
const selectedComponent = ref<Component | null>(null) // The selected component for the detail view
const debugInfo = ref<string[]>([]) // Array for storing debug information

// Access the component store
const componentStore = useComponentStore()

// Fetch components.json and sync with the store
const fetchComponentsJSON = async () => {
  isLoading.value = true
  try {
    const response = await fetch('/components.json')
    if (!response.ok) throw new Error('Failed to fetch components.json')

    const jsonData = await response.json() // Expecting array of Folder
    await syncComponentsWithStore(jsonData)
  } catch (error: unknown) {
    const err = error as Error
    errorMessages.value.push(`Failed to load components.json: ${err.message}`)
  } finally {
    isLoading.value = false
  }
}

// Sync the components from components.json with the store
const syncComponentsWithStore = async (folders: Folder[]) => {
  try {
    await componentStore.syncComponents(folders)
    debugInfo.value.push('Sync with store successful!')
  } catch (error: unknown) {
    const err = error as Error
    errorMessages.value.push(`Failed to sync components: ${err.message}`)
  }
}

// Function to handle selecting a component for detail view
const selectComponent = (component: Component) => {
  selectedComponent.value = component
}

// Function to clear the selected component and return to the folder view
const clearSelectedComponent = () => {
  selectedComponent.value = null
}

// Initial fetch on component mount
onMounted(() => {
  fetchComponentsJSON()
})
</script>

<style scoped>
/* Flip animation for switching between splash and main content */
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
</style>
