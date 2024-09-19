<template>
  <div class="p-6 bg-base-200 min-h-screen flex flex-col items-center">
    <!-- Component Count -->
    <component-count />

    <!-- Toggle between fetching from the store (API) or components.json -->
    <div class="mb-4 flex">
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

    <!-- Gallery for Folders -->
    <div v-if="folders.length" class="w-full grid grid-cols-2 gap-4">
      <div
        v-for="(folder, index) in folders"
        :key="index"
        class="bg-white p-4 rounded-lg shadow-md cursor-pointer hover:shadow-xl transition"
        @click="selectFolder(folder)"
      >
        <h3 class="text-xl font-bold mb-2">{{ folder.folderName }}</h3>
        <p class="text-sm text-gray-500">
          {{ folder.components.length }} components
        </p>
      </div>
    </div>

    <!-- No folders message -->
    <div
      v-if="!folders.length && !loadingStatus"
      class="text-center text-lg text-gray-500"
    >
      No folders found.
    </div>

    <!-- Component List within selected folder -->
    <div v-if="selectedFolder" class="mt-6 w-full">
      <h2 class="text-lg font-bold mb-4">
        Components in {{ selectedFolder.folderName }}
      </h2>
      <ul>
        <li
          v-for="component in selectedFolder.components"
          :key="component.componentName"
          class="cursor-pointer p-2 hover:bg-gray-200 transition"
          @click="openComponentScreen(component)"
        >
          {{ component.componentName }} -
          <span v-if="component.isWorking" class="text-green-500">Working</span>
          <span v-else-if="component.underConstruction" class="text-yellow-500"
            >Under Construction</span
          >
          <span v-else-if="component.isBroken" class="text-red-500"
            >Broken</span
          >
        </li>
      </ul>
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
const selectedFolder = ref<{
  folderName: string
  components: Component[]
} | null>(null)

// Filters (you can add more filters if needed)
const filters = ref({
  isWorking: true,
  underConstruction: true,
  isBroken: true,
})

const _filteredComponents = computed(() => {
  return components.value.filter((component: Component) => {
    return (
      (filters.value.isWorking && component.isWorking) ||
      (filters.value.underConstruction && component.underConstruction) ||
      (filters.value.isBroken && component.isBroken)
    )
  })
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

// Handle folder selection and filter components
const selectFolder = (
  folder: {
    folderName: string
    components: {
      id: number
      createdAt: Date
      updatedAt: Date | null
      folderName: string
      componentName: string
      isWorking: boolean
      underConstruction: boolean
      isBroken: boolean
      title: string | null
      notes: string | null
    }[]
  } | null,
) => {
  selectedFolder.value = folder
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

// Open a component screen (You can implement actual routing logic here)
const openComponentScreen = (component: Component) => {
  console.log(`Opening component: ${component.componentName}`)
  // Implement logic to display component details or route to a new view
}

// Computed: Group components by folder
const folders = computed(() => {
  const grouped = components.value.reduce(
    (acc, component) => {
      const folderName = component.folderName
      if (!acc[folderName]) {
        acc[folderName] = {
          folderName: folderName,
          components: [],
        }
      }
      acc[folderName].components.push(component)
      return acc
    },
    {} as Record<string, { folderName: string; components: Component[] }>,
  )

  return Object.values(grouped)
})

// Fetch components whenever the data source is changed
watch(dataSource, fetchComponents)

// On mounted, fetch the initial set of components
onMounted(fetchComponents)
</script>

<style scoped>
input[type='radio'],
input[type='checkbox'] {
  margin-right: 4px;
  margin-left: 8px;
}

.grid {
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
}

li {
  padding: 10px;
  margin-bottom: 5px;
  cursor: pointer;
}
</style>
