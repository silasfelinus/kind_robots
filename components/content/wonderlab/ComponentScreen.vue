<template>
  <div class="p-6 bg-base-200 min-h-screen flex flex-col items-center">
    <!-- Display status message while loading component -->
    <div v-if="loadingStatus" class="text-xl text-center text-blue-500 mb-4">
      {{ loadingStatus }}
    </div>

    <!-- Display error message if any -->
    <div v-if="errorMessage" class="text-red-500 mb-4">
      {{ errorMessage }}
    </div>

    <!-- Once we have a componentId, display the component-reaction section -->
    <component-reaction v-if="componentId" :component-id="componentId" />

    <!-- Display a message if no component is found or matched -->
    <div
      v-if="!componentId && !loadingStatus"
      class="text-center text-lg text-gray-500"
    >
      No matching component found.
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useComponentStore } from '@/stores/componentStore'

// State
const componentId = ref<number | null>(null) // Component ID, to be set once the component is found
const loadingStatus = ref<string | null>(null)
const errorMessage = ref<string | null>(null)

// Access the componentStore
const componentStore = useComponentStore()

// Function to find the matching component by folderName and componentName
const findComponent = async (folderName: string, componentName: string) => {
  try {
    loadingStatus.value = 'Loading component...'

    // Fetch the component by folderName and componentName from the store
    const component = await componentStore.findComponentByName(
      folderName,
      componentName,
    )

    if (component) {
      componentId.value = component.id // Set the found component ID
    } else {
      throw new Error('Component not found')
    }

    loadingStatus.value = null
  } catch (error) {
    errorMessage.value = `Error loading component: ${(error as Error).message}`
    loadingStatus.value = null
  }
}

// On mount, find the component based on the folderName and componentName
onMounted(() => {
  // You would typically get folderName and componentName from props or route params
  const folderName = 'exampleFolder'
  const componentName = 'exampleComponent'

  // Find the component in the store
  findComponent(folderName, componentName)
})
</script>
