<template>
  <div class="w-full min-h-screen overflow-y-auto">
    <!-- Loading State -->
    <div v-if="isLoading" class="flex justify-center items-center h-[100vh]">
      <Icon name="kind-icon:bubble-loading" class="animate-spin text-4xl" />
      Loading...
    </div>

    <!-- Main WonderLab Layout -->
    <div
      v-else-if="!errorMessages.length"
      class="flex flex-col lg:flex-row min-h-[100vh] space-y-4 lg:space-y-0 lg:space-x-4 p-4"
    >
      <!-- Component Screen or Welcome Message -->
      <div class="w-full lg:w-2/3 flex flex-col">
        <div v-if="!componentStore.selectedComponent" class="text-center p-4">
          <h1 class="text-4xl font-bold">Welcome to the WonderLab</h1>
          <p class="text-lg mt-4">
            Select a folder to view or interact with components!
          </p>
          <component-count class="my-4" />
        </div>

        <div
          v-else
          class="flex-1 min-h-0 overflow-y-auto rounded-2xl border bg-base-100"
        >
          <component-screen
            :component="componentStore.selectedComponent"
            class="w-full h-full"
            @close="handleComponentClose"
          />
        </div>
      </div>

      <!-- Folder + Reaction Panel -->
      <div class="w-full lg:w-1/3 flex flex-col">
        <!-- Folder View -->
        <div
          class="flex-1 min-h-0 bg-base-300 rounded-2xl p-4 flex flex-col border"
        >
          <div
            v-if="componentStore.selectedFolder"
            class="mb-2 text-lg font-semibold"
          >
            Viewing: {{ componentStore.selectedFolder }}
          </div>

          <div
            v-else
            class="flex-1 min-h-0 overflow-y-auto"
          >
            <lab-gallery @select-folder="handleFolderSelect" />
          </div>

          <div
            v-if="componentStore.selectedFolder"
            class="grid grid-cols-2 gap-4 flex-1 min-h-0 overflow-y-auto pr-1"
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
          class="bg-gray-200 mt-4 rounded-2xl overflow-hidden transition-all duration-300"
          :style="{ height: reactionsHeight }"
        >
          <div class="h-full w-full overflow-auto bg-gray-50 p-4">
            <component-reactions
              :component="componentStore.selectedComponent"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Error Reporting -->
    <div
      v-if="errorMessages.length"
      class="fixed bottom-4 left-1/2 transform -translate-x-1/2 text-red-500 bg-red-100 p-4 rounded-lg shadow-lg"
    >
      🚨 Error loading data: {{ errorMessages.join(', ') }}
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
        (component) =>
          component.folderName === componentStore.selectedFolder,
      )
    : [],
)

const galleryHeight = computed(() =>
  componentStore.selectedComponent
    ? displayStore.mainContentHeight
    : displayStore.mainContentHeight,
)

const reactionsHeight = computed(() =>
  componentStore.selectedComponent ? displayStore.mainContentHeight : '0px',
)

onMounted(async () => {
  isLoading.value = true
  try {
    await componentStore.initializeComponents()
    displayStore.initialize()
  } catch (error) {
    errorMessages.value.push('Failed to initialize components')
    console.error('Error during initialization:', error)
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
