<!-- /components/content/labs/wonder-lab.vue -->
<template>
  <div class="w-full h-full">
    <!-- Loading State -->
    <div v-if="isLoading" class="flex justify-center items-center h-full">
      <Icon name="kind-icon:bubble-loading" class="animate-spin text-4xl" />
      Loading...
    </div>

    <!-- Main WonderLab Layout -->
    <div v-else-if="!errorMessages.length" class="flex flex-col lg:flex-row h-full overflow-hidden space-y-4 lg:space-y-0 lg:space-x-4">
      <!-- Component Screen or Welcome Message -->
      <div class="w-full lg:w-2/3 flex flex-col h-full">
        <div v-if="!componentStore.selectedComponent" class="text-center p-4 flex-shrink-0">
          <h1 class="text-4xl font-bold">Welcome to the WonderLab</h1>
          <p class="text-lg mt-4">
            Select a folder to view or interact with components!
          </p>
          <component-count class="my-4" />
        </div>

        <div
          v-if="componentStore.selectedComponent"
          class="flex-1 min-h-0 overflow-auto rounded-2xl"
        >
          <component-screen
            :component="componentStore.selectedComponent"
            class="w-full h-full"
            @close="handleComponentClose"
          />
        </div>
      </div>

      <!-- Folder + Reaction Panel -->
      <div class="w-full lg:w-1/3 flex flex-col h-full">
        <!-- Folder View -->
        <div
          class="flex-1 min-h-0 bg-base-300 rounded-2xl p-4 flex flex-col"
          :style="{ height: galleryHeight }"
        >
          <div v-if="componentStore.selectedFolder" class="mb-2 text-lg font-semibold">
            Viewing: {{ componentStore.selectedFolder }}
          </div>

          <div v-else class="flex-1 min-h-0 overflow-y-auto">
            <lab-gallery @select-folder="handleFolderSelect" />
          </div>

          <div
            v-if="componentStore.selectedFolder"
            class="grid grid-cols-2 gap-4 overflow-y-auto flex-1 min-h-0 pr-1"
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
          v-if="componentStore.selectedComponent"
          class="bg-gray-200 mt-4 rounded-2xl overflow-hidden transition-all duration-300"
          :style="{ height: reactionsHeight }"
        >
          <div class="h-full w-full overflow-auto bg-gray-50 p-4">
            <component-reactions :component="componentStore.selectedComponent" />
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
import { useComponentStore } from '@/stores/componentStore'
import { useDisplayStore } from '@/stores/displayStore'
import LabGallery from './LabGallery.vue'
import ComponentScreen from './ComponentScreen.vue'
import type { KindComponent as Component } from '@/stores/componentStore'

// State variables
const isLoading = ref(true)
const errorMessages = ref<string[]>([])

// Access the stores
const componentStore = useComponentStore()
const displayStore = useDisplayStore()

// Computed value for folder-specific components
const folderComponents = computed(() =>
  componentStore.selectedFolder
    ? componentStore.components.filter(
        (component) => component.folderName === componentStore.selectedFolder,
      )
    : [],
)

// Heights based on displayStore values
const galleryHeight = computed(() =>
  componentStore.selectedComponent
    ? displayStore.mainContentHeight
    : displayStore.mainContentHeight,
)

const reactionsHeight = computed(() =>
  componentStore.selectedComponent ? displayStore.mainContentHeight : '0px',
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
