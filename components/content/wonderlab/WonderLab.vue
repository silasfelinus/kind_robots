<template>
  <div>
    <!-- Loading State -->
    <div v-if="isLoading" class="flex justify-center items-center h-full">
      <Icon name="mdi:loading" class="animate-spin text-4xl" />
      Loading...
    </div>

    <!-- Show content when not loading and no errors -->
    <transition name="flip">
      <div v-if="!isLoading && !errorMessages.length">
        <!-- Title Screen or Reactions Section -->
        <div class="title-or-reactions-section">
          <transition name="fade">
            <!-- Title Screen (when no component is selected) -->
            <div
              v-if="!componentStore.selectedComponent"
              class="title-screen flex justify-center items-center h-1/4 bg-gray-100"
            >
              <h1 class="text-3xl font-bold">Welcome to the WonderLab</h1>
              <p class="text-lg mt-2">
                Explore, select components, and add your reactions!
              </p>
            </div>

            <!-- Reactions (when a component is selected) -->
            <div v-else class="reactions-screen p-4 bg-base-200">
              <h2 class="text-2xl font-semibold">
                Reactions for {{ componentStore.selectedComponent.title }}
              </h2>
              <component-reactions
                :component="componentStore.selectedComponent"
              />
            </div>
          </transition>
        </div>

        <!-- Component counter and folder view section -->
        <div
          v-if="!componentStore.selectedFolder"
          class="intro-section text-center"
        >
          <div class="relative">
            <!-- Top section with component counter -->
            <div
              class="component-counter absolute top-0 left-0 w-full h-1/4 bg-gray-100"
            >
              <component-count />
            </div>
            <!-- Folders view occupies the rest of the screen -->
            <lab-gallery
              v-if="!componentStore.selectedComponent"
              class="lab-gallery pt-1/4"
              @select-folder="handleFolderSelect"
            />
          </div>
        </div>

        <!-- Folder Components Screen (inside folder) -->
        <div
          v-if="
            componentStore.selectedFolder && !componentStore.selectedComponent
          "
          class="folder-view"
        >
          <p class="text-lg px-4">
            Viewing components in folder: {{ componentStore.selectedFolder }}
          </p>

          <!-- Folder components -->
          <div
            class="folder-components grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 p-4"
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

        <!-- Component Screen (once a component is selected) -->
        <component-screen
          v-if="componentStore.selectedComponent"
          :component="componentStore.selectedComponent"
          @close="handleComponentClose"
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
/* Title or Reactions Section */
.title-or-reactions-section {
  margin-bottom: 1rem;
}

.title-screen {
  text-align: center;
  background-color: #f9fafb;
}

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

/* Top section counter styling */
.component-counter {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 25vh;
  background-color: #f9fafb;
}
</style>
