<template>
  <div class="bg-base-100 p-4">
    <!-- Dynamic Component Container -->
    <div v-if="!isLoading && selectedComponent">
      <div v-if="errorLoadingComponent">
        🚨 Error loading component: {{ errorLoadingComponent }}
      </div>
      <div v-else>
        <component :is="selectedComponent" @hook:error-captured="handleComponentError" />
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading">
      <icon name="mdi:loading" class="animate-spin text-4xl" />
      Loading...
    </div>

    <!--  Folder View -->
    <div v-else-if="selectedComponents.length === 0" class="grid grid-cols-3 gap-4">
      <div
        v-for="folder in folderNames"
        :key="folder"
        class="p-4 rounded-lg hover:bg-primary hover:text-white cursor-pointer transition duration-300 ease-in-out"
        @click="fetchComponents(folder)"
      >
        <div class="text-center">
          <icon name="bi:folder-fill" class="text-4xl" />
          <p class="mt-2">{{ folder }}</p>
        </div>
      </div>
    </div>

    <!-- Component View -->
    <div v-else class="grid grid-cols-3 gap-4">
      <!-- Back Button -->
      <div class="col-span-full text-right mb-4">
        <icon
          name="game-icons:fast-backward-button"
          class="text-4xl cursor-pointer"
          @click="clearSelectedComponents"
        />
      </div>
      <!-- Components -->
      <!-- Cube Icon to End Component -->
      <div v-if="selectedComponent" class="absolute top-0 left-0 mt-4 ml-4">
        <icon
          name="game-icons:companion-cube"
          class="text-4xl cursor-pointer"
          @click="endComponent"
        />
      </div>
      <div
        v-for="component in selectedComponents"
        :key="component"
        class="p-4 rounded-lg hover:bg-secondary hover:text-white cursor-pointer transition duration-300 ease-in-out"
        @click="openModal(component)"
      >
        <div class="text-center">
          <icon name="game-icons:companion-cube" class="text-4xl mb-2" />
          <p>{{ component }}</p>
        </div>
      </div>
    </div>

    <!-- Error Reporting -->
    <div v-if="errorComponents.length > 0" class="text-red-500 mt-4">
      🚨 Error loading these components: {{ errorComponents.join(', ') }}
    </div>
  </div>
</template>

<script setup lang="ts">
// Importing required modules and Pinia store
import { ref, computed, onErrorCaptured } from 'vue'
import { useComponentStore } from '@/stores/componentStore'

// Initialize Pinia store
const componentStore = useComponentStore()

// State variables
const isLoading = ref(false)
const selectedFolder = ref('')
const selectedComponent = ref('')
const errorComponents = ref<string[]>([])
const errorLoadingComponent = ref<string | null>(null)

// Function to end the component and go back to the component view
const endComponent = () => {
  selectedComponent.value = ''
}

// Function to clear selected components and go back to folder selection
const clearSelectedComponents = () => {
  selectedComponents.value = []
}

// Fetch folder names when the component is mounted
componentStore.fetchFolderNames()

// Local state for selected components
const selectedComponents = ref<string[]>([])

// Function to fetch components based on the selected folder
const fetchComponents = async (folder: string) => {
  isLoading.value = true
  selectedFolder.value = folder
  await componentStore.fetchComponentList(folder)
  selectedComponents.value =
    componentStore.folders.find((f) => f.folderName === folder)?.components || []
  isLoading.value = false
}

// Computed property to get folder names from the store
const folderNames = computed(() => componentStore.folderNames)

// Function to open the component modal
const openModal = (component: string) => {
  selectedComponent.value = component
}

// Function to handle component errors
const handleComponentError = (error: Error) => {
  errorLoadingComponent.value = error.message
}

// Global error handler
onErrorCaptured((error) => {
  console.error('An error occurred:', error)
  return false
})
</script>

<style>
@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}
</style>

<style>
.loader {
  border: 4px solid rgba(0, 0, 0, 0.1);
  border-radius: 50%;
  border-top: 4px solid #000;
  width: 24px;
  height: 24px;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}
</style>
