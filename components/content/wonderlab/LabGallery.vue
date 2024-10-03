<template>
  <div class="p-2 bg-base-300 min-h-screen grid grid-rows-2 gap-2">
    <!-- Folder View -->
    <div
      v-if="folderNames.length && !selectedComponents.length"
      class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2"
    >
      <div
        v-for="folder in folderNames"
        :key="folder"
        class="p-4 rounded-lg hover:bg-primary hover:text-default cursor-pointer transition-transform transform hover:scale-105"
        @click="fetchComponentsFromFolder(folder)"
      >
        <div class="text-center">
          <Icon name="bi:folder-fill" class="text-4xl" />
          <p class="mt-2">{{ folder }}</p>
        </div>
      </div>
    </div>

    <!-- Component List View -->
    <div
      v-if="selectedComponents.length"
      class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2"
    >
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

// Initial fetch from store on component mount
onMounted(() => {
  if (!componentStore.components.length) {
    componentStore.initializeComponents()
  }
})
</script>

<style scoped>
/* Add custom styling if needed */
</style>
