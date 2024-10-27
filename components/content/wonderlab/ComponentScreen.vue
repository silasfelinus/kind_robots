<template>
  <div class="p-6 bg-base-300 min-h-screen flex flex-col items-center relative">


    <!-- Display status message while loading -->
    <div v-if="loadingStatus" class="text-xl text-center text-blue-500 mb-4">
      {{ loadingStatus }}
    </div>

    <!-- Display error message if any -->
    <div v-if="errorMessage" class="text-red-500 mb-4">
      {{ errorMessage }}
    </div>

    <!-- Dynamically render the selected component if available -->
    <component
      :is="selectedComponentName"
      v-if="selectedComponentName"
      class="mb-6 w-full"
    />

    <!-- Display a message if no component is selected -->
    <div
      v-if="!selectedComponentName && !loadingStatus"
      class="text-center text-lg text-gray-500 mt-10"
    >
      No component selected.
    </div>

    <!-- Display the component-reaction for the selected component -->
    <component-reaction
      v-if="selectedComponent"
      :component-id="selectedComponent.id"
      class="mt-6 w-full"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useComponentStore } from './../../../stores/componentStore'

// State
const loadingStatus = ref<string | null>(null)
const errorMessage = ref<string | null>(null)

// Access the componentStore
const componentStore = useComponentStore()

// Computed property to get the selected component from the store
const selectedComponent = computed(() => componentStore.selectedComponent)

// This will hold the name of the dynamically selected component
const selectedComponentName = computed(() => {
  return selectedComponent.value ? selectedComponent.value.componentName : null
})

// Watch the selectedComponent and update dynamically when it changes
watch(selectedComponent, (newComponent) => {
  if (!newComponent) {
    errorMessage.value = 'No component selected.'
  } else {
    errorMessage.value = null // Clear error message if a component is selected
  }
})


</script>
