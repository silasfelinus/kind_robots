<template>
  <div class="p-6 bg-base-200 min-h-screen flex flex-col items-center relative">
    <!-- Back button as overlay at the top of the screen -->
    <button
      class="absolute top-4 left-4 bg-blue-500 text-white px-4 py-2 rounded"
      @click="handleBackButton"
    >
      Back
    </button>

    <!-- Display status message while loading -->
    <div v-if="loadingStatus" class="text-xl text-center text-blue-500 mb-4">
      {{ loadingStatus }}
    </div>

    <!-- Display error message if any -->
    <div v-if="errorMessage" class="text-red-500 mb-4">
      {{ errorMessage }}
    </div>

    <!-- Display the dynamically loaded component -->
    <component
      :is="dynamicComponent"
      v-if="selectedComponent && dynamicComponent"
      class="mb-6"
    />

    <!-- Display a message if no component is selected -->
    <div
      v-if="!selectedComponent && !loadingStatus"
      class="text-center text-lg text-gray-500"
    >
      No component selected.
    </div>

    <!-- Display the component-reaction for the selected component -->
    <component-reaction
      v-if="selectedComponent"
      :component-id="selectedComponent.id"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useComponentStore } from '@/stores/componentStore'
import type { Component } from '@prisma/client'

// State
const loadingStatus = ref<string | null>(null)
const errorMessage = ref<string | null>(null)
const dynamicComponent = ref<Component | null>(null) // To hold the dynamically imported component

// Access the componentStore
const componentStore = useComponentStore()

// Computed property to get the selected component from the store
const selectedComponent = computed(() => componentStore.selectedComponent)

// Function to dynamically load the component based on folder and component name
const loadComponent = async (folderName: string, componentName: string) => {
  try {
    loadingStatus.value = 'Loading component...'
    const componentPath = `../../components/content/${folderName}/${componentName}.vue`
    dynamicComponent.value = (
      await import(/* @vite-ignore */ componentPath)
    ).default
    loadingStatus.value = null
  } catch (error) {
    errorMessage.value = `Failed to load component: ${componentName} in folder: ${folderName}`
    console.error(error)
    loadingStatus.value = null
  }
}

// Watch the selectedComponent and dynamically load the corresponding component when it changes
watch(selectedComponent, (newComponent) => {
  if (newComponent) {
    loadComponent(newComponent.folderName, newComponent.componentName)
  }
})

// On mount, ensure the component is loaded if already selected
onMounted(() => {
  if (selectedComponent.value) {
    loadComponent(
      selectedComponent.value.folderName,
      selectedComponent.value.componentName,
    )
  }
})

// Function to handle the "Back" button
const handleBackButton = () => {
  componentStore.clearSelectedComponent() // Deselect the component
}
</script>
