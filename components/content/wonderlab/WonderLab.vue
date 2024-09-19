<template>
  <div class="p-2 bg-base-200 min-h-screen grid grid-rows-2 gap-2">
    <!-- Top Section: Component Detail or Folder/Component Gallery -->
    <div class="h-full">
      <!-- Component Detail View and Reaction Section -->
      <transition name="flip">
        <div v-if="showComponentScreen">
          <component-screen
            :folder-name="selectedFolder"
            :component-name="selectedComponent"
            @close="showPreviousComponents"
          />

          <!-- Component Reaction: Reaction and Comment Section -->
          <component-reaction :component-id="componentId" />
        </div>
      </transition>

      <!-- Folder or Component List (visible when no component is selected) -->
      <div v-if="!showComponentScreen">
        <!-- Loading State: Displays a loading icon while data is being fetched -->
        <div v-if="isLoading" class="flex justify-center items-center h-full">
          <Icon name="mdi:loading" class="animate-spin text-4xl" />
          Loading...
        </div>

        <!-- Folder View: Displays the folder names for selection -->
        <div
          v-if="!isLoading && !selectedComponents.length"
          class="grid grid-cols-4 gap-2"
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
          v-if="selectedComponents.length"
          class="grid grid-cols-4 gap-2 relative"
        >
          <!-- Back Button: Floating at the top with adjusted margin -->
          <div
            class="absolute"
            :style="{
              top: `calc(${displayStore.headerVh} + 10px)`,
              right: '10px',
            }"
          >
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
            @click="selectComponent(selectedFolder ?? '', component)"
          >
            <div class="text-center">
              <Icon name="game-Icons:companion-cube" class="text-4xl mb-2" />
              <p>{{ component }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
    <!-- Error Reporting: Displays any errors encountered during the component loading -->
    <div v-if="errorMessages.length" class="col-span-3 text-red-500 mt-4">
      🚨 Error loading data: {{ errorMessages.join(', ') }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useDisplayStore } from '@/stores/displayStore'

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
const componentId = ref<number | null>(null) // Component ID for reactions
const componentIdMap = ref<{ [key: string]: number }>({}) // Store the mapping of component name to its ID

// Access the display store to manage the sidebar states
const displayStore = useDisplayStore()

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

// Upsert component data into the database and store the returned ID
const upsertComponent = async (folderName: string, componentName: string) => {
  try {
    const response = await fetch(`/api/components/upsert`, {
      method: 'POST',
      body: JSON.stringify({ name: componentName, folder: folderName }),
      headers: { 'Content-Type': 'application/json' },
    })

    if (response.ok) {
      const data = await response.json()
      // Store the component ID in the map
      componentIdMap.value[`${folderName}/${componentName}`] = data.id
    } else {
      throw new Error(`Failed to upsert component: ${componentName}`)
    }
  } catch (error) {
    errorMessages.value.push(
      `Error upserting component "${componentName}": ${error}`,
    )
  }
}

// Fetches the components.json data and upserts components into the database
const fetchAndUpsertComponents = async () => {
  isLoading.value = true
  try {
    const response = await fetch('/components.json')
    if (!response.ok) throw new Error('Failed to fetch components.json')

    const jsonData: Folder[] = await response.json() // Typed response to ensure we get an array of Folder
    folderNames.value = jsonData // Populate folder names based on the JSON response

    // Iterate through each folder and component, and upsert them
    for (const folder of jsonData) {
      for (const component of folder.components) {
        await upsertComponent(folder.folderName, component)
      }
    }
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

// Select a specific component and show its detail view using the component's ID
const selectComponent = (folderName: string, componentName: string) => {
  const fullKey = `${folderName}/${componentName}`
  const id = componentIdMap.value[fullKey]

  if (id) {
    selectedComponent.value = componentName
    selectedFolder.value = folderName
    componentId.value = id // Set the component ID based on the stored map
    showComponentScreen.value = true // Toggle to show component screen
  } else {
    errorMessages.value.push(
      `Component "${componentName}" not found in the database.`,
    )
  }
}

// Clear selected components to return to folder view
const clearSelectedComponents = () => {
  selectedComponents.value = [] // Clears component list
  selectedComponent.value = null // Clears selected component
  selectedFolder.value = null // Clears selected folder
  componentId.value = null // Clear component ID
  showComponentScreen.value = false // Hide component screen
}

// Return to component list when closing a component
const showPreviousComponents = () => {
  selectedComponent.value = null
  componentId.value = null
  showComponentScreen.value = false // Show previous component list
}

// Initial fetch and upsert on component mount
onMounted(() => {
  fetchAndUpsertComponents() // Fetch and upsert components.json when the page is loaded
})
</script>
