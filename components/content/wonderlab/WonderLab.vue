<template>
  <div class="p-6 bg-base-200 min-h-screen flex flex-col items-center">
    <!-- Component Count -->
    <component-count />

    <!-- Toggle between fetching from the store (API) or components.json -->
    <div class="mb-4">
      <label class="mr-2">Source:</label>
      <input id="store" v-model="dataSource" type="radio" value="store" />
      <label for="store">Database (Store)</label>
      <input id="json" v-model="dataSource" type="radio" value="json" />
      <label for="json">Components JSON</label>
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

    <!-- Add new components button -->
    <button class="btn btn-primary mt-6" @click="addNewComponents">
      Add New Components
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useComponentStore } from '@/stores/componentStore'
import type { Component } from '@prisma/client'

// State
const loadingStatus = ref<string | null>(null)
const errorMessage = ref<string | null>(null)
const dataSource = ref<'store' | 'json'>('store') // Toggle between database and JSON

const componentStore = useComponentStore()
const components = ref<Component[]>([]) // Initialize components as an array

// Filters
const filters = ref({
  isWorking: true,
  underConstruction: true,
  isBroken: true,
})

// Fetch components from the store or JSON file
const fetchComponents = async () => {
  try {
    loadingStatus.value = 'Loading components...'

    if (dataSource.value === 'store') {
      await componentStore.fetchAllComponents()
      components.value = componentStore.allComponents
    } else {
      const response = await fetch('/components.json')
      if (!response.ok) throw new Error('Failed to fetch components from JSON.')
      const jsonFolders = await response.json()

      if (!Array.isArray(jsonFolders))
        throw new Error('Invalid JSON structure.')

      components.value = jsonFolders.flatMap(
        (folder: { components: string[]; folderName: string }) =>
          folder.components.map((name: string) => ({
            id: 0, // Placeholder ID
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
      ) as Component[]
    }

    loadingStatus.value = null
  } catch (error) {
    errorMessage.value = `Error loading components: ${(error as Error).message}`
    loadingStatus.value = null
  }
}

// Handle component addition to the store
const addNewComponents = async () => {
  try {
    const newComponents = components.value.filter((component) => {
      return !componentStore.allComponents.find(
        (storedComp) => storedComp.componentName === component.componentName,
      )
    })

    for (const component of newComponents) {
      await componentStore.createOrUpdateComponent(component, 'create')
    }

    console.log('New components added successfully!')
  } catch (error) {
    console.error('Error adding new components:', error)
  }
}

// Fetch components whenever the data source is changed
watch(dataSource, fetchComponents)

// Computed filtered components
const filteredComponents = computed(() => {
  if (Array.isArray(components.value)) {
    return components.value.filter((component: Component) => {
      return (
        (filters.value.isWorking && component.isWorking) ||
        (filters.value.underConstruction && component.underConstruction) ||
        (filters.value.isBroken && component.isBroken)
      )
    })
  }
  return [] // Return an empty array if components.value is not an array
})

// On mounted, fetch the initial set of components
onMounted(fetchComponents)
</script>

<style scoped>
input[type='radio'],
input[type='checkbox'] {
  margin-right: 4px;
  margin-left: 8px;
}
</style>
