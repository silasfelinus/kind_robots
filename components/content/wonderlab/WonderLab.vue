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
          v-if="!componentStore.selectedComponent"
          class="intro-section text-center"
        >
          <random-image class="mb-4" />
          <p class="text-lg px-4">
            Welcome to the WonderLab! Select a folder to view components.
          </p>
          <component-count />
        </div>

        <!-- LabGallery component -->
        <lab-gallery v-if="!componentStore.selectedComponent" />

        <!-- Component Screen -->
        <component-screen
          v-if="componentStore.selectedComponent"
          :component="componentStore.selectedComponent"
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
import LabGallery from './LabGallery.vue'
import ComponentScreen from './ComponentScreen.vue'

// State variables
const isLoading = ref(false)
const errorMessages = ref<string[]>([])
const debugInfo = ref<string[]>([])

// Define the structure of a Folder in the components.json file
interface Folder {
  folderName: string
  components: string[] // List of component names as strings
}

// Access the component store
const componentStore = useComponentStore()

// Fetch components.json and sync with the store
const fetchComponentsJSON = async () => {
  isLoading.value = true
  try {
    const response = await fetch('/components.json')
    if (!response.ok) throw new Error('Failed to fetch components.json')

    const jsonData = await response.json()
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

// Function to clear the selected component and return to the folder view
const clearSelectedComponent = () => {
  componentStore.selectedComponent = null
}

// Initial fetch on component mount
onMounted(() => {
  fetchComponentsJSON()
})
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
</style>
