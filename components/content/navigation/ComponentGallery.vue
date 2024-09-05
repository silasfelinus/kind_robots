<template>
  <div class="bg-base-200 p-4">
    <!-- Dynamic Component Container -->
    <div v-if="!isLoading && selectedComponent">
      <div v-if="errorLoadingComponent">
        🚨 Error loading component: {{ errorLoadingComponent }}
      </div>
      <div v-else>
        <component
          :is="selectedComponent"
          @hook:error-captured="handleComponentError"
        />
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading">
      <Icon name="mdi:loading" class="animate-spin text-4xl" />
      Loading...
    </div>

    <!-- Folder View -->
    <div
      v-else-if="selectedComponents.length === 0"
      class="grid grid-cols-3 gap-4"
    >
      <div
        v-for="folder in folderNames"
        :key="folder"
        class="p-4 rounded-lg hover:bg-primary hover:text-default cursor-pointer transition duration-300 ease-in-out"
        @click="fetchComponents(folder)"
      >
        <div class="text-center">
          <Icon name="bi:folder-fill" class="text-4xl" />
          <p class="mt-2">{{ folder }}</p>
        </div>
      </div>
    </div>

    <!-- Component View -->
    <div v-else class="grid grid-cols-3 gap-4">
      <!-- Back Button -->
      <div class="col-span-full text-right mb-4">
        <Icon
          name="game-Icons:fast-backward-button"
          class="text-4xl cursor-pointer"
          @click="clearSelectedComponents"
        />
      </div>

      <!-- Components List -->
      <div
        v-for="component in selectedComponents"
        :key="component.id"
        class="p-4 rounded-lg hover:bg-secondary hover:text-default cursor-pointer transition duration-300 ease-in-out"
        @click="openComponent(component)"
      >
        <div class="text-center">
          <Icon name="game-Icons:companion-cube" class="text-4xl mb-2" />
          <p>{{ component.componentName }}</p>

          <!-- Show component editing options only if the user is an ADMIN -->
          <div v-if="isAdmin">
            <div class="mt-2">
              <label>
                <input v-model="component.isWorking" type="checkbox" />
                Is Working
              </label>
            </div>
            <div class="mt-2">
              <label>
                <input v-model="component.underConstruction" type="checkbox" />
                Under Construction
              </label>
            </div>
            <div class="mt-2">
              <label>
                <input v-model="component.isBroken" type="checkbox" />
                Is Broken
              </label>
            </div>
          </div>
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
import { ref, computed, onErrorCaptured } from 'vue'
import { useComponentStore } from './../../../stores/componentStore'
import { useUserStore } from './../../../stores/userStore'
import type { Component } from '@prisma/client' // Import the correct type for Component

// Initialize Pinia stores
const componentStore = useComponentStore()
const userStore = useUserStore()

// State variables
const isLoading = ref(false)
const selectedFolder = ref<string>('')
const selectedComponents = ref<Component[]>([])
const selectedComponent = ref<Component | null>(null) // Ensure it's either null or a valid Component

const errorComponents = ref<string[]>([])
const errorLoadingComponent = ref<string | null>(null)

// Computed properties
const isAdmin = computed(() => userStore.isAdmin)

const folderNames = computed(() => componentStore.folderNames)

// Function to clear selected components and go back to folder selection
const clearSelectedComponents = () => {
  selectedComponents.value = []
  selectedComponent.value = null
}

// Function to fetch components based on the selected folder
const fetchComponents = async (folder: string) => {
  isLoading.value = true
  selectedFolder.value = folder
  await componentStore.fetchComponentList(folder)
  selectedComponents.value =
    componentStore.folders.find((f) => f.folderName === folder)?.components ||
    []
  isLoading.value = false
}

// Function to open the component modal
const openComponent = (component: Component) => {
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

// Fetch folder names when the component is mounted
componentStore.initializeComponentStore()
</script>

<style scoped>
@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

.loader {
  border: 4px solid rgba(0, 0, 0, 0.1);
  border-radius: 50%;
  border-top: 4px solid #000;
  width: 24px;
  height: 24px;
  animation: spin 1s linear infinite;
}
</style>
