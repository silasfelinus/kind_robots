<template>
  <div class="p-2 bg-base-200 min-h-screen grid grid-rows-2 gap-2">
    <!-- Top Section: Folder or Component List -->
    <div class="h-full">
      <div v-if="isLoading" class="flex justify-center items-center h-full">
        <Icon name="mdi:loading" class="animate-spin text-4xl" />
        Loading...
      </div>

      <!-- Folder View -->
      <div
        v-if="!showComponentScreen && !isLoading && !selectedComponents.length"
        class="grid grid-cols-4 gap-2"
      >
        <div
          v-for="folder in folderNames"
          :key="folder.folderName"
          class="p-4 rounded-lg hover:bg-primary hover:text-default cursor-pointer transition duration-300 ease-in-out"
          @click="
            folder.folderName && fetchComponentsFromStore(folder.folderName)
          "
        >
          <div class="text-center">
            <Icon name="bi:folder-fill" class="text-4xl" />
            <p class="mt-2">{{ folder.folderName }}</p>
          </div>
        </div>
      </div>

      <!-- Component List View -->
      <div
        v-if="selectedComponents.length && !showComponentScreen"
        class="grid grid-cols-4 gap-2 relative"
      >
        <div class="absolute top-0 right-0">
          <Icon
            name="game-Icons:fast-backward-button"
            class="text-4xl cursor-pointer"
            @click="clearSelectedComponents"
          />
        </div>

        <!-- Displays individual components -->
        <div
          v-for="component in selectedComponents"
          :key="component.id"
          @click="selectComponent(selectedFolder, component)"
        >
          <div class="text-center">
            <Icon name="game-Icons:companion-cube" class="text-4xl mb-2" />
            <p>{{ component.componentName }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Bottom Section -->
    <div class="relative h-full">
      <transition name="flip">
        <div
          v-if="!showComponentScreen"
          class="flex flex-col items-center justify-center h-full"
        >
          <random-image class="mb-4" />
          <p class="text-lg text-center px-4">
            Welcome to Wonderforge! Select a folder above to view available
            components. After selecting a component, the component details will
            be displayed here.
          </p>
        </div>

        <!-- Component Detail View -->
        <div v-if="selectedComponent && selectedComponent.componentName">
          <component-screen
            :folder-name="selectedFolder"
            :component-name="selectedComponent.componentName"
            @close="showPreviousComponents"
          />
          <component-reaction
            v-if="selectedComponent.id"
            :component-id="selectedComponent.id"
          />
        </div>
      </transition>
    </div>

    <!-- Error Reporting -->
    <div v-if="errorMessages.length" class="col-span-3 text-red-500 mt-4">
      🚨 Error loading data: {{ errorMessages.join(', ') }}
    </div>

    <!-- Debug Information -->
    <div v-if="debugInfo.length" class="col-span-3 text-blue-500 mt-4">
      🛠️ Debug Info: <br />
      <pre>{{ debugInfo.join('\n') }}</pre>
    </div>
  </div>
</template>
<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useComponentStore } from '@/stores/componentStore' // Store for handling component data
import { useDisplayStore } from '@/stores/displayStore'
import type { Component } from '@prisma/client'

// Define the structure of a Folder in the components.json file
interface Folder {
  folderName: string
  components: string[] // List of component names as strings
}

// State variables
const folderNames = ref<Folder[]>([]) // Array of Folder objects from components.json
const selectedComponents = ref<Component[]>([]) // Components of the selected folder from the store (real data)
const selectedComponent = ref<Component | null>(null) // Selected component for detailed view
const selectedFolder = ref<string | null>(null) // Selected folder for context
const showComponentScreen = ref(false) // Boolean flag to toggle the component screen
const isLoading = ref(false) // Loading state flag
const errorMessages = ref<string[]>([]) // Array for storing error messages
const debugInfo = ref<string[]>([]) // Array for storing debug information

// Access the display store and component store
const displayStore = useDisplayStore()
const componentStore = useComponentStore()

// Watch for changes to the component view state to hide/show sidebars
watch(showComponentScreen, (newVal) => {
  if (newVal) {
    displayStore.changeState('sidebarLeft', 'hidden')
    displayStore.changeState('sidebarRight', 'hidden')
  } else {
    displayStore.changeState('sidebarLeft', 'open')
    displayStore.changeState('sidebarRight', 'open')
  }
})

// Fetches the components.json data and syncs with the store
const fetchComponentsJSON = async () => {
  isLoading.value = true
  try {
    const response = await fetch('/components.json')
    if (!response.ok) throw new Error('Failed to fetch components.json')

    const jsonData: Folder[] = await response.json() // Typed response to ensure we get an array of Folder
    folderNames.value = jsonData // Populate folder names based on the JSON response

    // Log the fetched data to debug info for inspection
    debugInfo.value.push('Fetched components.json data:')
    debugInfo.value.push(JSON.stringify(jsonData, null, 2))

    // Sync components with the store (add or update)
    await syncComponentsWithStore(jsonData)
  } catch (error: unknown) {
    const err = error as Error
    console.error('Error fetching components.json:', err)
    errorMessages.value.push(`Failed to load components.json: ${err.message}`)
  } finally {
    isLoading.value = false
  }
}

// Function to sync components with the store (add or update)
const syncComponentsWithStore = async (folders: Folder[]) => {
  try {
    await componentStore.syncComponents(folders) // Call the store's sync method with the new data
    debugInfo.value.push('Sync with store successful!')
  } catch (error: unknown) {
    const err = error as Error
    console.error('Error syncing components with store:', err)
    errorMessages.value.push(
      `Failed to sync components with store: ${err.message}`,
    )
    debugInfo.value.push(`Sync with store failed: ${err.message}`)
  }
}

// Fetch components for a selected folder from the store
const fetchComponentsFromStore = async (folderName: string) => {
  try {
    const components = await componentStore.fetchComponentsByFolder(folderName) // Fetch components from the store
    selectedComponents.value = components
    selectedFolder.value = folderName
  } catch (error: unknown) {
    const err = error as Error
    console.error('Error fetching components from store:', err)
    errorMessages.value.push(
      `Failed to fetch components from store: ${err.message}`,
    )
    debugInfo.value.push(`Error fetching components from store: ${err.message}`)
  }
}

// Define `selectComponent` function
const selectComponent = (folderName: string | null, component: Component) => {
  if (folderName) {
    selectedComponent.value = component
    selectedFolder.value = folderName
    showComponentScreen.value = true // Toggle to show component screen
  }
}

// Clear selected components to return to folder view
const clearSelectedComponents = () => {
  selectedComponents.value = [] // Clears component list
  selectedComponent.value = null // Clears selected component
  selectedFolder.value = null // Clears selected folder
  showComponentScreen.value = false // Hide component screen
}

// Return to component list when closing a component
const showPreviousComponents = () => {
  selectedComponent.value = null
  showComponentScreen.value = false // Show previous component list
}

// Initial fetch on component mount
onMounted(() => {
  fetchComponentsJSON() // Fetches components.json and syncs on launch
})
</script>

<style scoped>
/* Flip animation for switching between splash and component screen */
.flip-enter-active,
.flip-leave-active {
  transition: transform 0.6s;
  transform-style: preserve-3d;
}
.flip-enter,
.flip-leave-to {
  transform: rotateY(180deg);
}
</style>
