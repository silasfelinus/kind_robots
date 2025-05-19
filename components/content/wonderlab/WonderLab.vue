<!-- /components/content/labs/wonder-lab.vue -->
<template>
  <div class="absolute inset-0 overflow-y-auto bg-base-200">
    <div
      class="flex flex-col lg:flex-row min-h-[100vh] gap-4 p-4 box-border"
    >
      <!-- Left: Welcome or Component Screen -->
      <div class="w-full lg:w-2/3 flex flex-col">
        <!-- Welcome Message -->
        <div
          v-if="!componentStore.selectedComponent"
          class="text-center p-4"
        >
          <h1 class="text-4xl font-bold">Welcome to the WonderLab</h1>
          <p class="text-lg mt-4">
            Select a folder to view or interact with components!
          </p>
          <component-count class="my-4" />
        </div>

        <!-- Component Screen (scrollable if large) -->
        <div
          v-else
          class="flex-1 overflow-y-auto bg-base-100 border rounded-2xl"
        >
          <component-screen
            :component="componentStore.selectedComponent"
            class="w-full h-full"
            @close="handleComponentClose"
          />
        </div>
      </div>

      <!-- Right: Folder View & Reactions -->
      <div class="w-full lg:w-1/3 flex flex-col gap-4">
        <!-- Folder View -->
        <div class="flex flex-col bg-base-300 rounded-2xl border p-4 flex-1 min-h-[300px]">
          <div
            v-if="componentStore.selectedFolder"
            class="mb-2 text-lg font-semibold"
          >
            Viewing: {{ componentStore.selectedFolder }}
          </div>

          <!-- Show folders if no folder selected -->
          <div
            v-else
            class="flex-1 min-h-0 overflow-y-auto"
          >
            <lab-gallery @select-folder="handleFolderSelect" />
          </div>

          <!-- Show components in folder -->
          <div
            v-if="componentStore.selectedFolder"
            class="grid grid-cols-2 gap-4 overflow-y-auto flex-1 min-h-0"
          >
            <component-card
              v-for="component in folderComponents"
              :key="component.id"
              :component="component"
              class="bg-white shadow rounded-lg transform transition-transform duration-200 hover:scale-105 hover:shadow-lg"
              @select="handleComponentSelect"
            />
          </div>
        </div>

        <!-- Reactions -->
        <div
          v-if="componentStore.selectedComponent"
          class="bg-gray-200 rounded-2xl border p-4 max-h-[300px] overflow-y-auto"
        >
          <component-reactions
            :component="componentStore.selectedComponent"
          />
        </div>
      </div>
    </div>

    <!-- Error Display -->
    <div
      v-if="errorMessages.length"
      class="fixed bottom-4 left-1/2 transform -translate-x-1/2 text-red-500 bg-red-100 p-4 rounded-lg shadow-lg"
    >
      🚨 {{ errorMessages.join(', ') }}
    </div>
  </div>
</template>

<script setup lang="ts">
// /components/content/labs/wonder-lab.vue
import { ref, computed, onMounted } from 'vue'
import { useComponentStore } from '@/stores/componentStore'
import { useDisplayStore } from '@/stores/displayStore'
import LabGallery from './LabGallery.vue'
import ComponentScreen from './ComponentScreen.vue'
import type { KindComponent as Component } from '@/stores/componentStore'

const isLoading = ref(true)
const errorMessages = ref<string[]>([])

const componentStore = useComponentStore()
const displayStore = useDisplayStore()

const folderComponents = computed(() =>
  componentStore.selectedFolder
    ? componentStore.components.filter(
        (component) => component.folderName === componentStore.selectedFolder,
      )
    : [],
)

onMounted(async () => {
  isLoading.value = true
  try {
    await componentStore.initializeComponents()
    displayStore.initialize()
  } catch (error) {
    errorMessages.value.push('Failed to initialize components')
    console.error(error)
  } finally {
    isLoading.value = false
  }
})

const handleFolderSelect = (folderName: string) => {
  componentStore.setSelectedFolder(folderName)
}

const handleComponentSelect = (component: Component) => {
  componentStore.selectedComponent = component
}

const handleComponentClose = () => {
  componentStore.clearSelectedComponent()
  componentStore.clearSelectedFolder()
}
</script>
