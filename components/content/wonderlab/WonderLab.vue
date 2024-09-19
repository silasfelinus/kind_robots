<template>
  <div class="p-6 bg-base-200 min-h-screen flex flex-col items-center">
    <!-- Toggle between fetching from the store or the database -->
    <div class="mb-4">
      <label class="mr-2">Source:</label>
      <input id="store" v-model="dataSource" type="radio" value="store" />
      <label for="store">Store</label>
      <input id="database" v-model="dataSource" type="radio" value="database" />
      <label for="database">Database</label>
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
const dataSource = ref<'store' | 'database'>('store') // Toggle between store and database
const filters = ref({
  isWorking: true,
  underConstruction: true,
  isBroken: true,
})

// Access the componentStore
const componentStore = useComponentStore()
const components = ref<Component[]>([]) // Define the type for components

// Function to fetch components from the store or database
const fetchComponents = async () => {
  try {
    loadingStatus.value = 'Loading components...'

    if (dataSource.value === 'store') {
      components.value = componentStore.allComponents // Make sure this returns the correct type
    } else {
      // Fetch components from the database
      const response = await fetch('/api/components')
      if (!response.ok) {
        throw new Error('Failed to fetch components from the database.')
      }
      const dbComponents: Component[] = await response.json() // Ensure correct type
      components.value = dbComponents
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
