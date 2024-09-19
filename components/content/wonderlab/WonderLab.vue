<template>
  <div class="p-6 bg-base-200 min-h-screen flex flex-col items-center">
    <!-- Toggle between fetching from the store or components.json -->
    <div class="mb-4">
      <label class="mr-2">Source:</label>
      <input id="store" v-model="dataSource" type="radio" value="store" />
      <label for="store">Database (Store)</label>
      <input id="json" v-model="dataSource" type="radio" value="json" />
      <label for="json">Components JSON</label>
    </div>

    <!-- Toggle filters for boolean values -->
    <div class="mb-4 flex gap-4">
      <label>
        <input v-model="filters.isWorking" type="checkbox" />
        Show Working Components
      </label>
      <label>
        <input v-model="filters.underConstruction" type="checkbox" />
        Show Under Construction
      </label>
      <label>
        <input v-model="filters.isBroken" type="checkbox" />
        Show Broken Components
      </label>
    </div>

    <!-- Display status message while loading components -->
    <div v-if="loadingStatus" class="text-xl text-center text-blue-500 mb-4">
      {{ loadingStatus }}
    </div>

    <!-- Display error message if any -->
    <div v-if="errorMessage" class="text-red-500 mb-4">
      {{ errorMessage }}
    </div>

    <!-- Display components based on selected filters -->
    <div v-if="filteredComponents.length">
      <h2 class="text-lg font-bold mb-4">Filtered Components</h2>
      <ul>
        <li
          v-for="component in filteredComponents"
          :key="component.id"
          class="mb-2"
        >
          {{ component.componentName }} ({{ component.folderName }}) -
          <span v-if="component.isWorking">Working</span>
          <span v-else-if="component.underConstruction"
            >Under Construction</span
          >
          <span v-else-if="component.isBroken">Broken</span>
        </li>
      </ul>
    </div>

    <!-- No matching components -->
    <div
      v-if="!filteredComponents.length && !loadingStatus"
      class="text-center text-lg text-gray-500"
    >
      No matching components found.
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useComponentStore } from '@/stores/componentStore'
import type { Component } from '@prisma/client' // Import the Component type

// State
const loadingStatus = ref<string | null>(null)
const errorMessage = ref<string | null>(null)
const dataSource = ref<'store' | 'json'>('store') // Toggle between database and JSON
const filters = ref({
  isWorking: true,
  underConstruction: true,
  isBroken: true,
})

// Access the componentStore
const componentStore = useComponentStore()
const components = ref<Component[]>([]) // Define the type for components

// Function to fetch components from the store or components.json
const fetchComponents = async () => {
  try {
    loadingStatus.value = 'Loading components...'

    if (dataSource.value === 'store') {
      components.value = componentStore.allComponents // Fetch from the store (database retrieval)
    } else {
      // Fetch components from components.json
      const response = await fetch('/components.json')
      if (!response.ok) {
        throw new Error('Failed to fetch components from JSON.')
      }
      const jsonFolders = await response.json()

      // Ensure jsonFolders is an array
      if (!Array.isArray(jsonFolders)) {
        throw new Error('Invalid JSON structure.')
      }

      // Map JSON data to Component type with defaults
      components.value = jsonFolders.flatMap(
        (folder: { components: string[]; folderName: string }) =>
          folder.components.map((name: string) => ({
            id: 0, // Placeholder ID; will be updated if fetched from the database
            createdAt: new Date(),
            updatedAt: null,
            folderName: folder.folderName,
            componentName: name,
            isWorking: true,
            underConstruction: false,
            isBroken: false,
            title: null,
            notes: null,
            Channels: [],
            Tags: [],
            Reactions: [],
          })),
      ) as Component[] // Cast to Component[]
    }

    loadingStatus.value = null
  } catch (error) {
    errorMessage.value = `Error loading components: ${(error as Error).message}`
    loadingStatus.value = null
  }
}

// Filtered components based on toggles
const filteredComponents = computed(() => {
  return components.value.filter((component: Component) => {
    return (
      (filters.value.isWorking && component.isWorking) ||
      (filters.value.underConstruction && component.underConstruction) ||
      (filters.value.isBroken && component.isBroken)
    )
  })
})

// Fetch components whenever the data source is changed
watch(dataSource, fetchComponents)

// On mounted, fetch the initial set of components
onMounted(fetchComponents)
</script>

<style scoped>
input[type='checkbox'] {
  margin-right: 8px;
}

input[type='radio'] {
  margin-right: 4px;
  margin-left: 8px;
}
</style>
