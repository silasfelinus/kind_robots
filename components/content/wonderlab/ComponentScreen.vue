<template>
  <div class="p-6 bg-base-200 min-h-screen flex flex-col items-center">
    <!-- Display status message while creating/updating component -->
    <div v-if="loadingStatus" class="text-xl text-center text-blue-500 mb-4">
      {{ loadingStatus }}
    </div>

    <!-- Section to create a new component -->
    <div
      v-if="!componentId"
      class="w-full max-w-3xl bg-white p-6 rounded-lg shadow-md"
    >
      <h2 class="text-3xl font-bold mb-4">Create New Component</h2>
      <input
        v-model="newComponentName"
        type="text"
        placeholder="Component Name"
        class="w-full p-2 mb-2 border rounded"
      />
      <input
        v-model="newFolderName"
        type="text"
        placeholder="Folder Name"
        class="w-full p-2 mb-2 border rounded"
      />
      <button class="btn btn-primary mt-4" @click="createOrUpdateComponent">
        Create Component
      </button>
    </div>

    <!-- Once we have a componentId, display the component-reaction section -->
    <component-reaction v-if="componentId" :component-id="componentId" />

    <!-- Error message display -->
    <div v-if="errorMessage" class="text-red-500 mt-4">{{ errorMessage }}</div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useComponentStore } from '@/stores/componentStore'
import type { Component } from '@prisma/client'

// State
const componentId = ref<number | null>(null) // Component ID, set once component is created/loaded
const newComponentName = ref<string>('') // New component name for creation
const newFolderName = ref<string>('') // New folder name for creation
const loadingStatus = ref<string | null>(null)
const errorMessage = ref<string | null>(null)

// Access the componentStore
const componentStore = useComponentStore()

// Function to create or update the component
const createOrUpdateComponent = async () => {
  try {
    loadingStatus.value = componentId.value
      ? 'Updating component...'
      : 'Creating component...'

    const action = componentId.value ? 'update' : 'create'

    // Create the component object, but only include 'id' if updating
    const component = {
      componentName: newComponentName.value,
      folderName: newFolderName.value,
      isWorking: true,
      underConstruction: false,
      isBroken: false,
      title: null,
      notes: null,
      createdAt: new Date(),
      updatedAt: null,
      ...(componentId.value && { id: componentId.value }), // Only include 'id' if updating
    }

    // Create or update the component
    const result = await componentStore.createOrUpdateComponent(
      component as Component,
      action,
    )

    // If it's a new component, set the component ID
    if (action === 'create') {
      componentId.value = result.id // Use the newly created ID
      console.log('New component created with ID:', componentId.value)
    } else {
      console.log('Component updated successfully')
    }

    loadingStatus.value = null
  } catch (error) {
    errorMessage.value = `Error ${componentId.value ? 'updating' : 'creating'} component: ${(error as Error).message}`
    loadingStatus.value = null
  }
}
</script>
