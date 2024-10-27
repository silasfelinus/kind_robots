<template>
  <div class="p-2 bg-base-300 min-h-screen">
    <!-- Folder View -->
    <div
      v-if="folderNames.length && !selectedComponents.length"
      class="grid grid-cols-[repeat(auto-fit,_minmax(150px,_1fr))] gap-4"
    >
      <div
        v-for="folder in folderNames"
        :key="folder"
        class="p-4 rounded-lg hover:bg-primary hover:text-default cursor-pointer transition-transform transform hover:scale-105"
        @click="fetchComponentsFromFolder(folder)"
      >
        <div class="text-center">
          <Icon name="kind-icon:folder" class="text-4xl" />
          <p class="mt-2">{{ folder }}</p>
        </div>
      </div>
    </div>

    <!-- Component List View -->
    <div v-if="selectedComponents.length">
      <!-- Back Button -->
      <button
        @click="goBackToFolders"
        class="mb-4 bg-primary text-default px-4 py-2 rounded hover:bg-secondary transition"
      >
        Back to Folders
      </button>

      <div class="grid grid-cols-[repeat(auto-fit,_minmax(150px,_1fr))] gap-4">
        <div
          v-for="component in selectedComponents"
          :key="component.id"
          class="p-4 rounded-lg hover:bg-secondary hover:text-default cursor-pointer transition-transform transform hover:scale-105"
          @click="selectComponent(component)"
        >
          <div class="text-center">
            <Icon name="game-Icons:companion-cube" class="text-4xl mb-2" />
            <p>{{ component.componentName }}</p>
            <p v-if="component.title" class="text-xs">{{ component.title }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import {
  useComponentStore,
  type KindComponent as Component,
} from './../../../stores/componentStore'

// State variables
const selectedComponents = ref<Component[]>([])
const selectedFolder = ref<string | null>(null)

// Access the component store
const componentStore = useComponentStore()

// Get unique folder names from the componentStore
const folderNames = computed(() => {
  const folders = new Set(
    componentStore.components.map((component) => component.folderName),
  )
  return Array.from(folders)
})

// Fetch components for a selected folder from the store
const fetchComponentsFromFolder = (folderName: string) => {
  selectedComponents.value = componentStore.components.filter(
    (component) => component.folderName === folderName,
  )
  selectedFolder.value = folderName
}

// Select a component and update the store
const selectComponent = (component: Component) => {
  componentStore.selectedComponent = component
}

// Go back to the folder view by clearing the selected components
const goBackToFolders = () => {
  selectedComponents.value = []
  selectedFolder.value = null
}

// Initial fetch from store on component mount
onMounted(() => {
  if (!componentStore.components.length) {
    componentStore.initializeComponents()
  }
})
</script>

