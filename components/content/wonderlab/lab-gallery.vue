<!-- /components/content/labs/lab-gallery.vue -->
<template>
  <div class="bg-base-300 min-h-screen p-4">
    <!-- Folder View -->
    <div
      v-if="!componentStore.selectedFolder"
      class="grid grid-cols-[repeat(auto-fit,_minmax(150px,_1fr))] gap-4"
    >
      <div
        v-for="folder in folderNames"
        :key="folder"
        class="rounded-lg hover:bg-primary hover:text-default cursor-pointer transition-transform transform hover:scale-105"
        @click="selectFolder(folder)"
      >
        <div class="text-center">
          <Icon name="kind-icon:folder" class="text-4xl" />
          <p class="mt-2">{{ folder }}</p>
        </div>
      </div>
    </div>

    <!-- Component List View -->
    <div v-else class="flex flex-col h-[80vh]">
      <!-- Back Button -->
      <button
        class="mb-4 bg-primary text-default py-2 rounded hover:bg-secondary transition"
        @click="clearFolder"
      >
        Back to Folders
      </button>

      <!-- Scrollable Component Grid -->
      <div
        class="overflow-y-auto flex-grow grid grid-cols-[repeat(auto-fit,_minmax(150px,_1fr))] gap-4 pr-2"
      >
        <div
          v-for="component in folderComponents"
          :key="component.id"
          class="rounded-lg hover:bg-secondary hover:text-default cursor-pointer transition-transform transform hover:scale-105"
          @click="selectComponent(component)"
        >
          <div class="text-center">
            <Icon name="kind-icon:companion-cube" class="text-4xl mb-2" />
            <p>{{ component.componentName }}</p>
            <p v-if="component.title" class="text-xs">{{ component.title }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// /components/content/labs/lab-gallery.vue
import { computed, onMounted } from 'vue'
import {
  useComponentStore,
  type KindComponent as Component,
} from '@/stores/componentStore'

const componentStore = useComponentStore()

const folderNames = computed(() => {
  const folders = new Set(
    componentStore.components.map((component) => component.folderName),
  )
  return Array.from(folders)
})

const folderComponents = computed(() =>
  componentStore.selectedFolder
    ? componentStore.components.filter(
        (component) => component.folderName === componentStore.selectedFolder,
      )
    : [],
)

const selectFolder = (folderName: string) => {
  componentStore.setSelectedFolder(folderName)
}

const clearFolder = () => {
  componentStore.clearSelectedFolder()
  componentStore.clearSelectedComponent()
}

const selectComponent = (component: Component) => {
  componentStore.selectedComponent = component
}

onMounted(() => {
  if (!componentStore.components.length) {
    componentStore.initializeComponents()
  }
})
</script>
