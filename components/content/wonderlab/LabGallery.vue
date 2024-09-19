<template>
  <div class="p-2 bg-base-200 min-h-screen grid grid-rows-2 gap-2">
    <!-- Folder View -->
    <div
      v-if="folderNames.length && !selectedComponents.length"
      class="grid grid-cols-4 gap-2"
    >
      <div
        v-for="folder in folderNames"
        :key="folder"
        class="p-4 rounded-lg hover:bg-primary hover:text-default cursor-pointer transition"
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
      v-if="selectedComponents.length && !showComponentScreen"
      class="grid grid-cols-4 gap-2"
    >
      <div
        v-for="component in selectedComponents"
        :key="component.id"
        @click="selectComponent(component)"
      >
        <div class="text-center">
          <Icon name="game-Icons:companion-cube" class="text-4xl mb-2" />
          <p>{{ component.componentName }}</p>
          <p v-if="component.title" class="text-xs">{{ component.title }}</p>
        </div>
      </div>
    </div>

    <!-- Component Detail View -->
    <component-screen
      v-if="showComponentScreen"
      :component="selectedComponent"
      @close="showPreviousComponents"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useComponentStore } from '@/stores/componentStore'
import type { Component } from '@prisma/client' // Import the Component interface

// State variables
const selectedComponents = ref<Component[]>([]) // Typed explicitly as an array of Component
const selectedComponent = ref<Component | null>(null) // Currently selected component, or null if none
const showComponentScreen = ref(false) // Boolean flag to toggle the component screen

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
}

// Select a component for detailed view
const selectComponent = (component: Component) => {
  selectedComponent.value = component
  showComponentScreen.value = true
}

// Show the previous list of components
const showPreviousComponents = () => {
  selectedComponent.value = null
  showComponentScreen.value = false
}

// Initial fetch from store on component mount
onMounted(() => {
  if (!componentStore.components.length) {
    componentStore.fetchAllComponents() // Ensure we load components if not already loaded
  }
})
</script>

<style scoped>
/* Basic styling */
</style>
