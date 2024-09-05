<template>
  <div class="bg-base-200 p-4">
    <!-- Dynamic Component Container -->
    <div v-if="!isLoading && selectedComponent">
      <div v-if="errorLoadingComponent">
        🚨 Error loading component: {{ errorLoadingComponent }}
      </div>
      <div v-else>
        <div>
          <!-- Editable Title and Notes for Admins -->
          <div>
            <label>Title:</label>
            <input
              v-if="isAdmin"
              v-model="selectedComponent.title"
              type="text"
              class="input input-bordered w-full"
            />
            <p v-else>{{ selectedComponent.title }}</p>
          </div>

          <div class="mt-4">
            <label>Notes:</label>
            <textarea
              v-if="isAdmin"
              v-model="selectedComponent.notes"
              class="textarea textarea-bordered w-full"
            ></textarea>
            <p v-else>{{ selectedComponent.notes }}</p>
          </div>
        </div>

        <!-- Include the component reaction bar -->
        <ComponentReaction :component-id="selectedComponent.id" />
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
import ComponentReaction from './ComponentReactions.vue'
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
