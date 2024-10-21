<template>
  <div>
    <!-- Loading State -->
    <div v-if="isLoading" class="flex justify-center items-center h-full">
      <Icon name="kind-icon:bubble-loading" class="animate-spin text-4xl" />
      Loading...
    </div>

    <!-- Show content when not loading and no errors -->
    <transition name="flip">
      <div v-if="!isLoading && !errorMessages.length" class="flex h-screen">
        <!-- Left 2/3 for the welcome message or component screen -->
        <div class="w-2/3 p-4 flex justify-center items-center">
          <!-- Welcome message when no component is selected -->
          <div
            v-if="!componentStore.selectedComponent"
            class="welcome-screen text-center"
          >
            <h1 class="text-4xl font-bold">Welcome to the WonderLab</h1>
            <p class="text-lg mt-4">
              Select a folder to view components or interact with them!
            </p>
          </div>

          <!-- Component Screen when a component is selected -->
          <div v-else class="w-full h-full overflow-auto">
            <component-screen
              :component="componentStore.selectedComponent"
              class="component-screen w-full h-full"
              @close="handleComponentClose"
            />
          </div>
        </div>

        <!-- Right 1/3, split into top 1/2 for folder view and bottom 1/2 for count/reactions -->
        <div class="w-1/3 flex flex-col">
          <!-- Folder view in the top half -->
          <div class="folder-view h-1/2 p-4 bg-gray-100 overflow-y-auto">
            <div v-if="componentStore.selectedFolder" class="text-lg px-4">
              Viewing components in folder: {{ componentStore.selectedFolder }}
            </div>

            <!-- Folder gallery when no folder is selected -->
            <div
              v-if="!componentStore.selectedFolder"
              class="lab-gallery h-full"
            >
              <lab-gallery @select-folder="handleFolderSelect" />
            </div>

            <!-- Folder components -->
            <div
              v-if="componentStore.selectedFolder"
              class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 p-4 h-full overflow-auto"
            >
              <component-card
                v-for="component in folderComponents"
                :key="component.id"
                :component="component"
                class="component-card p-4 bg-white shadow rounded-lg transition-transform transform hover:scale-105 hover:shadow-lg"
                @select="handleComponentSelect"
              />
            </div>
          </div>

          <!-- Component count or reactions in the bottom half -->
          <div class="h-1/2 p-4 bg-gray-200">
            <transition name="flip">
              <!-- Component Count (when no component is selected) -->
              <div
                v-if="!componentStore.selectedComponent"
                class="component-counter flex justify-center items-center h-full"
              >
                <component-count />
              </div>

              <!-- Reactions (when a component is selected) -->
              <div
                v-else
                class="reactions-screen p-4 bg-base-200 h-full overflow-auto"
              >
                <h2 class="text-2xl font-semibold">
                  Reactions for {{ componentStore.selectedComponent.title }}
                </h2>
                <component-reactions
                  :component="componentStore.selectedComponent"
                />
              </div>
            </transition>
          </div>
        </div>
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
  padding: 1rem;
  border-radius: 0.5rem;
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
  padding: 1rem;
}
</style>
