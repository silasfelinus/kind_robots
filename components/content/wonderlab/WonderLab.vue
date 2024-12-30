<template>
  <div>
    <!-- Loading State -->
    <div v-if="isLoading" class="flex justify-center items-center h-full">
      <Icon name="kind-icon:bubble-loading" class="animate-spin text-4xl" />
      Loading...
    </div>

    <!-- Main WonderLab Layout -->
    <div v-if="!isLoading && !errorMessages.length" class="flex h-full">
      <!-- Left Section for Component Screen -->
      <div class="w-2/3 h-full flex justify-center items-center">
        <div
          v-if="!componentStore.selectedComponent"
          class="text-center max-w-full"
        >
          <h1 class="text-4xl font-bold">Welcome to the WonderLab</h1>
          <p class="text-lg mt-4">
            Select a folder to view or interact with components!
          </p>
          <component-count class="mb-4" />
        </div>

        <div v-else class="w-full h-full overflow-auto">
          <component-screen
            :component="componentStore.selectedComponent"
            class="w-full h-full"
            @close="handleComponentClose"
          />
        </div>
      </div>

      <!-- Right Section: Folder View & Reactions -->
      <div class="w-1/3 h-full flex flex-col rounded-2xl">
        <!-- Folder View -->
        <div
          class="bg-gray-100 overflow-y-auto rounded-2xl transition-all duration-300"
          :style="{ height: galleryHeight }"
        >
          <div
            v-if="componentStore.selectedFolder"
            class="text-sm md:text-md lg:text-lg xl:text-xl mb-2"
          >
            Viewing components in folder: {{ componentStore.selectedFolder }}
          </div>
          <div v-if="!componentStore.selectedFolder">
            <lab-gallery class="h-full" @select-folder="handleFolderSelect" />
          </div>
          <div
            v-if="componentStore.selectedFolder"
            class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2"
          >
            <component-card
              v-for="component in folderComponents"
              :key="component.id"
              :component="component"
              class="bg-white shadow rounded-lg transform transition-transform duration-200 hover:scale-105 hover:shadow-lg"
              @select="handleComponentSelect"
            />
          </div>
        </div>

        <!-- Reactions -->
        <div
          class="bg-gray-200 flex justify-center items-center transition-all duration-300"
          :style="{ height: reactionsHeight }"
        >
          <div class="h-full w-full overflow-auto bg-gray-50 p-4">
            <component-reactions
              :component="componentStore.selectedComponent"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Error Reporting -->
    <div
      v-if="errorMessages.length"
      class="fixed bottom-4 left-1/2 transform -translate-x-1/2 text-red-500 bg-red-100 p-4 rounded-lg shadow-lg"
    >
      🚨 Error loading data: {{ errorMessages.join(', ') }}
    </div>
  </div>
</template>
<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useComponentStore } from './../../../stores/componentStore'
import { useDisplayStore } from '~/stores/displayStore'
import LabGallery from './LabGallery.vue'
import ComponentScreen from './ComponentScreen.vue'
import type { KindComponent as Component } from './../../../stores/componentStore'

// State variables
const isLoading = ref(true)
const errorMessages = ref<string[]>([])

// Access the stores
const componentStore = useComponentStore()
const displayStore = useDisplayStore()

// Computed value for folder-specific components
const folderComponents = computed(() => {
  if (!componentStore.selectedFolder) return []
  return componentStore.components.filter(
    (component) => component.folderName === componentStore.selectedFolder,
  )
})

// Heights based on displayStore values
const galleryHeight = computed(() =>
  componentStore.selectedComponent
    ? `calc(${displayStore.mainVh}vh * 0.3)`
    : `calc(${displayStore.mainVh}vh)`,
)

const reactionsHeight = computed(() =>
  componentStore.selectedComponent
    ? `calc(${displayStore.mainVh}vh * 0.7)`
    : '0px',
)

// Initialize components on mount
onMounted(async () => {
  isLoading.value = true
  try {
    await componentStore.initializeComponents()
    displayStore.initialize()
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
