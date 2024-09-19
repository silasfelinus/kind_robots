<template>
  <div class="p-6 bg-base-200 min-h-screen">
    <!-- Loading State -->
    <div v-if="isLoading">
      <Icon name="mdi:loading" class="animate-spin text-4xl" />
      Loading...
    </div>

    <!-- Folder View -->
    <div v-if="!selectedComponent && !isLoading" class="grid grid-cols-3 gap-4">
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

    <!-- Component List View -->
    <div
      v-if="selectedComponents.length && !selectedComponent"
      class="grid grid-cols-3 gap-4"
    >
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

    <!-- Component Detail View -->
    <ComponentScreen v-if="selectedComponent" :is-mockup="isMockup" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useComponentStore } from '@/stores/componentStore'
import type { Component } from '@prisma/client' // Adjust import as necessary

// Access the component store
const componentStore = useComponentStore()

// State variables
const isLoading = ref(false)
const errorComponents = ref<string[]>([])
const isMockup = ref(false) // Add isMockup state

// Computed properties
const folderNames = computed(() =>
  componentStore.folders.map((folder) => folder.folderName),
)
const selectedComponent = computed(() => componentStore.selectedComponent)
const selectedComponents = computed(() => componentStore.selectedComponents)

// Function to fetch components (if needed for future)
const _fetchComponentJSON = async () => {
  try {
    isLoading.value = true
    const response = await fetch('/components.json')
    if (!response.ok) {
      throw new Error('Failed to load components.json')
    }
    const jsonData = await response.json()
    componentStore.folders = jsonData
  } catch (error) {
    console.error('Error loading components.json:', error)
    errorComponents.value.push('Failed to load components.json')
  } finally {
    isLoading.value = false
  }
}

const fetchComponents = (folderName: string) => {
  componentStore.fetchComponentList(folderName)
}

const clearSelectedComponents = () => {
  componentStore.clearSelectedComponents()
}

// Open a specific component and switch to mockup view
const openComponent = (component: Component) => {
  // Ensure channelId exists
  componentStore.setSelectedComponent({
    ...component,
  })
}

// Fetch folder names and component data when the component is mounted
onMounted(() => {
  componentStore.initializeComponentStore() // If fetching from store, initialize store
})
</script>
