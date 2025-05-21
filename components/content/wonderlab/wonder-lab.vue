<!-- /components/content/wonderlab/wonder-lab.vue -->
<template>
  <div
    class="relative flex flex-col min-h-[100dvh] bg-base-100 text-base-content"
  >
    <!-- Sticky Header: Title and Count -->
    <div
      class="sticky top-0 z-10 bg-base-200 border-b border-base-300 p-4 flex flex-col gap-2"
    >
      <div class="flex items-center justify-between">
        <h1 class="text-2xl font-bold">Welcome to the WonderLab</h1>
        <component-count v-if="!componentStore.selectedComponent" />
        <button
          v-if="componentStore.selectedComponent"
          class="btn btn-sm btn-circle btn-accent"
          @click="showReactions = !showReactions"
        >
          <Icon name="kind-icon:emoji" class="text-xl" />
        </button>
      </div>

      <!-- Lab Gallery -->
      <div v-if="!componentStore.selectedFolder" class="w-full">
        <lab-gallery @select-folder="handleFolderSelect" />
      </div>
      <div v-else class="text-sm italic text-base-content/60">
        Viewing components in folder:
        <strong>{{ componentStore.selectedFolder }}</strong>
      </div>
    </div>

    <!-- Scrollable Main Area -->
    <div class="flex-1 overflow-y-auto px-4 py-6 space-y-4">
      <!-- Loading State -->
      <div v-if="isLoading" class="flex justify-center items-center h-full">
        <Icon name="kind-icon:bubble-loading" class="animate-spin text-4xl" />
        <span class="ml-2">Loading...</span>
      </div>

      <!-- Error Message -->
      <div v-if="errorMessages.length" class="text-error text-center">
        🚨 {{ errorMessages.join(', ') }}
      </div>

      <!-- DEBUG OUTPUT -->
      <div class="bg-warning text-black p-4 rounded-xl shadow-xl space-y-2">
        <h2 class="text-lg font-bold">🪵 Debug: WonderLab State</h2>
        <p>
          <strong>Selected Folder:</strong> {{ componentStore.selectedFolder }}
        </p>
        <p>
          <strong>Total Components:</strong>
          {{ componentStore.components.length }}
        </p>
        <p>
          <strong>Filtered Components:</strong> {{ folderComponents.length }}
        </p>

        <div
          class="bg-white text-xs p-2 rounded shadow max-h-48 overflow-y-auto"
        >
          <strong>All Components:</strong>
          <pre>{{ JSON.stringify(componentStore.components, null, 2) }}</pre>
        </div>

        <div
          class="bg-white text-xs p-2 rounded shadow max-h-48 overflow-y-auto"
        >
          <strong>folderComponents:</strong>
          <pre>{{ JSON.stringify(folderComponents, null, 2) }}</pre>
        </div>
      </div>

      <!-- Component List or Selected Component -->
      <div
        v-if="!componentStore.selectedComponent"
        class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6"
      >
        <component-card
          v-for="component in folderComponents"
          :key="component.id"
          :component="component"
          class="component-card p-4 bg-white shadow rounded-2xl hover:scale-105 transition-transform"
          @select="handleComponentSelect"
        />
      </div>

      <div v-else class="w-full">
        <main-component
          :component="componentStore.selectedComponent"
          class="component-screen w-full"
          @close="handleComponentClose"
        />
      </div>
    </div>

    <!-- Floating Reactions Panel -->
    <transition name="fade">
      <div
        v-if="showReactions && componentStore.selectedComponent"
        class="fixed bottom-0 left-0 right-0 z-20 bg-base-200 border-t border-base-300 p-4 shadow-xl"
      >
        <div class="flex justify-between items-center mb-2">
          <h2 class="text-lg font-semibold">
            Reactions: {{ componentStore.selectedComponent.title }}
          </h2>
          <button class="btn btn-xs btn-outline" @click="showReactions = false">
            Close
          </button>
        </div>
        <component-reactions :component="componentStore.selectedComponent" />
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useComponentStore } from './../../../stores/componentStore'
import type { KindComponent as Component } from './../../../stores/componentStore'

// State variables
const isLoading = ref(true)
const showReactions = ref(false)
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
