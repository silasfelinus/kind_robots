<template>
  <div class="p-6 bg-base-200 min-h-screen flex flex-col items-center">
    <!-- Check if the component has been loaded dynamically -->
    <div
      v-if="component && folderName && componentName"
      class="w-full max-w-3xl bg-white p-6 rounded-lg shadow-md"
    >
      <h2 class="text-3xl font-bold mb-4">
        Component: {{ componentName }} in Folder: {{ folderName }}
      </h2>

      <!-- Dynamically load and display the component -->
      <component :is="component"></component>

      <button class="btn btn-error mt-4" @click="emitClose">Close</button>
    </div>

    <!-- Show a message if no component is selected -->
    <div v-else>
      <p>No component selected or failed to load.</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, defineProps, defineEmits } from 'vue'

// Define the props for folderName and componentName
const props = defineProps({
  componentName: {
    type: String,
    required: true,
    default: '',
  },
  folderName: {
    type: String,
    required: true,
    default: '',
  },
})

// Declare the emit for the 'close' event
const emit = defineEmits(['close'])

// Emit the 'close' event when the button is clicked
const emitClose = () => {
  emit('close')
}

// State to hold the dynamically loaded component
const component = ref<null | object>(null)

// Function to dynamically import the component
const loadComponent = async (folderName: string, componentName: string) => {
  try {
    // Dynamically import the component based on folder and component names
    component.value = (
      await import(`@/components/content/${folderName}/${componentName}.vue`)
    ).default
  } catch (error) {
    console.error(
      `Failed to load component: ${folderName}/${componentName}`,
      error,
    )
    component.value = null // Set to null if loading fails
  }
}

// Watch for changes in folderName or componentName and load the component
watch(
  () => [props.folderName, props.componentName],
  ([newFolderName, newComponentName]) => {
    if (newFolderName && newComponentName) {
      loadComponent(newFolderName, newComponentName)
    }
  },
  { immediate: true },
)
</script>
