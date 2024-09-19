<template>
  <div class="p-6 bg-base-200 min-h-screen grid grid-rows-2 gap-4">
    <!-- Top Section: Folder or Component List -->
    <div class="h-full">
      <!-- Loading State: Displays a loading icon while data is being fetched -->
      <div v-if="isLoading" class="flex justify-center items-center h-full">
        <Icon name="mdi:loading" class="animate-spin text-4xl" />
        Loading...
      </div>

      <!-- Folder View: Displays the folder names for selection -->
      <div
        v-if="!showComponentScreen && !isLoading && !selectedComponents.length"
        class="grid grid-cols-3 gap-4" <!-- Updated to 3 columns -->
      >
        <div
          v-for="folder in folderNames"
          :key="folder.folderName"
          class="p-4 rounded-lg hover:bg-primary hover:text-default cursor-pointer transition duration-300 ease-in-out"
          @click="fetchComponents(folder.folderName)"
        >
          <div class="text-center">
            <Icon name="bi:folder-fill" class="text-4xl" />
            <p class="mt-2">{{ folder.folderName }}</p>
          </div>
        </div>
      </div>

      <!-- Component List View: Displays components of the selected folder -->
      <div
        v-if="selectedComponents.length && !showComponentScreen"
        class="grid grid-cols-3 gap-4 relative" <!-- Updated to 3 columns -->
      >
        <!-- Back Button: Floating at the top -->
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
          :key="component"
          class="p-4 rounded-lg hover:bg-secondary hover:text-default cursor-pointer transition duration-300 ease-in-out"
          @click="selectComponent(selectedFolder, component)"
        >
          <div class="text-center">
            <Icon name="game-Icons:companion-cube" class="text-4xl mb-2" />
            <p>{{ component }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Bottom Section: Splash Image or Component Screen -->
    <div class="relative h-full">
      <transition name="flip">
        <div
          v-if="!showComponentScreen"
          class="flex flex-col items-center justify-center h-full"
        >
          <!-- Splash Image and Instructions -->
          <random-image class="mb-4" />
          <p class="text-lg text-center px-4">
            Welcome to Wonderforge! Select a folder above to view available
            components. After selecting a component, the component details will
            be displayed here. Have fun exploring!
          </p>
        </div>

        <!-- Component Detail View: Displays detailed view of the selected component -->
        <component-screen
          v-else
          :folder-name="selectedFolder"
          :component-name="selectedComponent"
          @close="showPreviousComponents" <!-- Updated back behavior -->
        />
      </transition>
    </div>

    <!-- Error Reporting: Displays any errors encountered during the component loading -->
    <div v-if="errorMessages.length" class="col-span-3 text-red-500 mt-4"> <!-- Updated to col-span-3 -->
      🚨 Error loading data: {{ errorMessages.join(', ') }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

// Define the structure of a Folder in the components.json file
interface Folder {
  folderName: string
  components: string[] // List of component names as strings
}

// State variables
const folderNames = ref<Folder[]>([]) // Array of Folder objects
const selectedComponents = ref<string[]>([]) // Components of the selected folder (list of strings)
const selectedComponent = ref<string | null>(null) // Selected component for detailed view
const selectedFolder = ref<string | null>(null) // Selected folder for context
const showComponentScreen = ref(false) // Boolean flag to toggle the component screen
const isLoading = ref(false) // Loading state flag
const errorMessages = ref<string[]>([]) // Array for storing error messages

// Fetches the components.json data
const fetchComponentsJSON = async () => {
  isLoading.value = true
  try {
    const response = await fetch('/components.json')
    if (!response.ok) throw new Error('Failed to fetch components.json')

    const jsonData: Folder[] = await response.json() // Typed response to ensure we get an array of Folder
    folderNames.value = jsonData // Populate folder names based on the JSON response
  } catch (error) {
    console.error('Error fetching components.json:', error)
    errorMessages.value.push('Failed to load components.json')
  } finally {
    isLoading.value = false
  }
}

// Fetch components for a selected folder
const fetchComponents = (folderName: string) => {
  const selectedFolderData = folderNames.value.find(
    (folder) => folder.folderName === folderName,
  )
  if (selectedFolderData) {
    selectedComponents.value = selectedFolderData.components
    selectedFolder.value = folderName // Set selected folder name
  } else {
    errorMessages.value.push(`Folder "${folderName}" not found.`)
  }
}

// Select a specific component and show its detail view
const selectComponent = (folderName: string, componentName: string) => {
  selectedComponent.value = componentName
  selectedFolder.value = folderName
  showComponentScreen.value = true // Toggle to show component screen
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
  fetchComponentsJSON() // Fetches components.json when the page is loaded
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
