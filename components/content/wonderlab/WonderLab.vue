<template>
  <div class="p-6 bg-base-200 min-h-screen">
    <!-- Loading State: Displays a loading icon while data is being fetched -->
    <div v-if="isLoading">
      <Icon name="mdi:loading" class="animate-spin text-4xl" />
      Loading...
    </div>

    <!-- Folder View: Displays the folder names for selection -->
    <div
      v-if="!showComponentScreen && !isLoading && !selectedComponents.length"
      class="grid grid-cols-3 gap-4"
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
      class="grid grid-cols-3 gap-4"
    >
      <!-- Back Button: Allows returning to folder view -->
      <div class="col-span-full text-right mb-4">
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
        @click="selectedFolder && selectComponent(selectedFolder, component)"
      >
        <div class="text-center">
          <Icon name="game-Icons:companion-cube" class="text-4xl mb-2" />
          <p>{{ component }}</p>
        </div>
      </div>
    </div>

    <!-- Component Detail View: Displays detailed view of the selected component -->
    <ComponentScreen
      v-if="showComponentScreen"
      :folder-name="selectedFolder"
      :component-name="selectedComponent"
      @close="clearSelectedComponents"
    />

    <!-- Error Reporting: Displays any errors encountered during the component loading -->
    <div v-if="errorMessages.length" class="text-red-500 mt-4">
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

// Initial fetch on component mount
onMounted(() => {
  fetchComponentsJSON() // Fetches components.json when the page is loaded
})
</script>
