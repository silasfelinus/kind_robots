<template>
  <div class="p-6 bg-base-200 min-h-screen">
    <!-- Loading State: Displays a loading icon while data is being fetched -->
    <div v-if="isLoading">
      <Icon name="mdi:loading" class="animate-spin text-4xl" />
      Loading...
    </div>

    <!-- Folder View: Displays the folder names for selection -->
    <div
      v-if="!selectedComponent && !isLoading && !selectedComponents.length"
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
          <!-- Display folder name -->
        </div>
      </div>
    </div>

    <!-- Component List View: Displays components of the selected folder -->
    <div
      v-if="selectedComponents.length && !selectedComponent"
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
        @click="openComponent(component)"
      >
        <div class="text-center">
          <Icon name="game-Icons:companion-cube" class="text-4xl mb-2" />
          <p>{{ component }}</p>
          <!-- Component name -->
        </div>
      </div>
    </div>

    <!-- Component Detail View: Displays detailed view of the selected component -->
    <ComponentScreen v-if="selectedComponent" :component="selectedComponent" />

    <!-- Error Reporting: Displays any errors encountered during the component loading -->
    <div v-if="errorMessages.length" class="text-red-500 mt-4">
      🚨 Error loading data: {{ errorMessages.join(', ') }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

// Define the structure of a Folder and a Component in the components.json file
interface Folder {
  folderName: string
  components: string[] // List of component names as strings
}

// State variables
const folderNames = ref<Folder[]>([]) // Array of Folder objects
const selectedComponents = ref<string[]>([]) // Components of the selected folder (list of strings)
const selectedComponent = ref<string | null>(null) // Selected component for detailed view
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
    // Error handling
    console.error('Error fetching components.json:', error)
    errorMessages.value.push('Failed to load components.json')
  } finally {
    isLoading.value = false
  }
}

// Fetch components for a selected folder
const fetchComponents = (folderName: string) => {
  // Find the folder in the list and set its components for display
  const selectedFolder = folderNames.value.find(
    (folder) => folder.folderName === folderName,
  )
  if (selectedFolder) {
    selectedComponents.value = selectedFolder.components
  } else {
    errorMessages.value.push(`Folder "${folderName}" not found.`)
  }
}

// Open a specific component's detailed view
const openComponent = (componentName: string) => {
  // Set the selected component for detailed view
  selectedComponent.value = componentName
}

// Clear selected components to return to folder view
const clearSelectedComponents = () => {
  selectedComponents.value = [] // Clears component list
  selectedComponent.value = null // Clears selected component
}

// Initial fetch on component mount
onMounted(() => {
  fetchComponentsJSON() // Fetches components.json when the page is loaded
})
</script>
