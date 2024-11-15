<template>
  <div>
    <!-- Loading State -->
    <div v-if="isLoading" class="flex justify-center items-center h-screen">
      <Icon name="kind-icon:bubble-loading" class="animate-spin text-4xl" />
      Loading...
    </div>

    <!-- Main WonderLab Layout -->
    <div v-if="!isLoading && !errorMessages.length" class="flex h-screen">
      <!-- Left Section for Component Screen (full height) -->
      <div class="w-2/3 h-full p-4 flex justify-center items-center">
        <div v-if="!componentStore.selectedComponent" class="welcome-screen">
          <h1 class="text-4xl font-bold">Welcome to the WonderLab</h1>
          <p class="text-lg mt-4">
            Select a folder to view or interact with components!
          </p>
        </div>

        <div v-else class="w-full h-full overflow-auto">
          <component-screen
            :component="componentStore.selectedComponent"
            class="component-screen w-full h-full"
            @close="handleComponentClose"
          />
        </div>
      </div>

      <!-- Right Section: Folder View on top, Reactions at the bottom -->
      <div class="w-1/3 h-full flex flex-col">
        <!-- Folder View (expands as needed) -->
        <div class="folder-view flex-grow bg-gray-100 overflow-y-auto">
          <div v-if="componentStore.selectedFolder" class="text-lg">
            Viewing components in folder: {{ componentStore.selectedFolder }}
          </div>

          <div v-if="!componentStore.selectedFolder" class="lab-gallery">
            <lab-gallery @select-folder="handleFolderSelect" />
          </div>

          <div
            v-if="componentStore.selectedFolder"
            class="grid grid-cols-1 sm:grid-cols-2 gap-4 h-full overflow-auto"
          >
            <component-card
              v-for="component in folderComponents"
              :key="component.id"
              :component="component"
              class="component-card bg-white shadow rounded-lg"
              @select="handleComponentSelect"
            />
          </div>
        </div>

        <!-- Reactions or Component Counter (fixed height at bottom) -->
        <div class="bg-gray-200 h-1/3">
          <div
            v-if="!componentStore.selectedComponent"
            class="component-counter flex justify-center items-center h-full"
          >
            <component-count />
          </div>

          <div v-else class="reactions-screen h-full overflow-auto">
     
            <component-reactions
              :component="componentStore.selectedComponent"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Error Reporting -->
    <div v-if="errorMessages.length" class="col-span-3 text-red-500 mt-4">
      🚨 Error loading data: {{ errorMessages.join(', ') }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useComponentStore } from './../../../stores/componentStore'
import LabGallery from './LabGallery.vue'
import ComponentScreen from './ComponentScreen.vue'
import type { KindComponent as Component } from './../../../stores/componentStore'

// State variables
const isLoading = ref(true)
const errorMessages = ref<string[]>([])

// Access the component store
const componentStore = useComponentStore()

// Computed value for folder-specific components
const folderComponents = computed(() => {
  if (!componentStore.selectedFolder) return []
  return componentStore.components.filter(
    (component) => component.folderName === componentStore.selectedFolder,
  )
})

// Initialize components on mount
onMounted(async () => {
  isLoading.value = true
  try {
    await componentStore.initializeComponents()
  } catch (error) {
    errorMessages.value.push('Failed to initialize components')
    console.error('Error during initialization:', error)
  } finally {
    isLoading.value = false
  }
})

// Handle folder select action
const handleFolderSelect = (folderName: string) => {
  componentStore.setSelectedFolder(folderName)
}

// Handle component selection
const handleComponentSelect = (component: Component) => {
  componentStore.selectedComponent = component
}

// Handle closing a selected component
const handleComponentClose = () => {
  componentStore.clearSelectedComponent()
  componentStore.clearSelectedFolder()
}
</script>

<style scoped>
/* Folder components with hover effects */
.folder-components .component-card {
  transition:
    transform 0.2s,
    box-shadow 0.2s;
}

.folder-components .component-card:hover {
  transform: scale(1.05);
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
}

/* Welcome Screen Styling */
.welcome-screen {
  text-align: center;
  max-width: 100%;
}

/* Reactions Section */
.reactions-screen {
  background-color: #f3f4f6;
}

/* Transition for title and reactions */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s ease;
}
.fade-enter,
.fade-leave-to {
  opacity: 0;
}

/* Transition for flipping between count and reactions */
.flip-enter-active,
.flip-leave-active {
  transition: transform 0.6s;
  transform-style: preserve-3d;
}
.flip-enter,
.flip-leave-to {
  transform: rotateY(180deg);
}

/* Lab gallery view styling */
.lab-gallery {
  max-height: 75vh;
  overflow-y: auto;
}
</style>
