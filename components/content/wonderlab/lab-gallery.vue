<template>
  <div class="px-4 py-6 max-w-7xl mx-auto w-full space-y-6">
    <!-- Folder View -->
    <div v-if="!selectedFolder" class="space-y-2">
      <h2 class="text-xl font-semibold text-center">Choose a folder to explore</h2>
      <div class="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        <div
          v-for="folder in folderNames"
          :key="folder"
          class="flex flex-col items-center justify-center rounded-2xl border border-base-300 bg-base-200 hover:bg-primary hover:text-primary-content cursor-pointer transition-all duration-200 transform hover:scale-105 py-6 px-4 shadow-sm"
          @click="selectedFolder = folder"
        >
          <Icon name="kind-icon:folder" class="text-5xl mb-2" />
          <p class="text-sm font-bold text-center">{{ folder }}</p>
        </div>
      </div>
    </div>

    <!-- Component View -->
    <div v-else class="flex flex-col space-y-4 h-[75vh]">
      <!-- Header with Back Button -->
      <div class="flex justify-between items-center">
        <p class="italic text-sm text-base-content/70">
          Browsing folder:
          <strong class="text-base-content">{{ selectedFolder }}</strong>
        </p>
        <button class="btn btn-sm btn-outline btn-accent" @click="selectedFolder = null">
          <Icon name="kind-icon:arrow-left" class="mr-1" />
          Back to folders
        </button>
      </div>

      <!-- Grid of components -->
      <div
        class="overflow-y-auto flex-grow grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 pr-1"
      >
        <div
          v-for="component in folderComponents"
          :key="component.id"
          class="rounded-2xl bg-base-100 border border-base-300 hover:bg-secondary hover:text-secondary-content transition-transform transform hover:scale-105 p-4 cursor-pointer shadow-sm"
          @click="componentStore.selectedComponent = component"
        >
          <div class="flex flex-col items-center text-center space-y-2">
            <Icon name="kind-icon:companion-cube" class="text-4xl" />
            <p class="font-bold text-sm truncate w-full">
              {{ component.componentName }}
            </p>
            <p
              v-if="component.title"
              class="text-xs text-base-content/60 truncate w-full"
            >
              {{ component.title }}
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// /components/content/wonderlab/lab-gallery.vue
import { ref, computed } from 'vue'
import {
  useComponentStore,
  type KindComponent as Component,
} from '@/stores/componentStore'

const selectedFolder = ref<string | null>(null)
const componentStore = useComponentStore()

const folderNames = computed(() => {
  const folders = new Set(
    componentStore.components.map((c) => c.folderName?.trim()),
  )
  return Array.from(folders).filter(Boolean) as string[]
})

const folderComponents = computed(() =>
  selectedFolder.value
    ? componentStore.components.filter(
        (c) =>
          c.folderName?.trim().toLowerCase() ===
          selectedFolder.value?.trim().toLowerCase(),
      )
    : [],
)
</script>
