<template>
  <div class="px-4 py-6 max-w-7xl mx-auto w-full space-y-6">
    <div v-if="!selectedFolder" class="space-y-2">
      <h2 class="text-xl font-semibold text-center">
        Choose a folder to explore
      </h2>
      <div
        class="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
      >
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

    <div v-else class="flex flex-col space-y-4 h-[75vh]">
      <div class="flex justify-between items-center">
        <p class="italic text-sm text-base-content/70">
          Browsing folder:
          <strong class="text-base-content">{{ selectedFolder }}</strong>
        </p>
        <button
          class="btn btn-sm btn-outline btn-accent"
          type="button"
          @click="selectedFolder = null"
        >
          <Icon name="kind-icon:arrow-left" class="mr-1" />
          Back to folders
        </button>
      </div>

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
import { useComponentStore, type KindComponent } from '@/stores/componentStore'

const selectedFolder = ref<string | null>(null)
const componentStore = useComponentStore()

const folderNames = computed<string[]>(() => {
  const folders = new Set<string>()

  componentStore.components.forEach((c: KindComponent) => {
    const name = c.folderName?.trim()
    if (name) folders.add(name)
  })

  return Array.from(folders)
})

const folderComponents = computed<KindComponent[]>(() => {
  const target = selectedFolder.value?.trim().toLowerCase()
  if (!target) return []

  return componentStore.components.filter((c: KindComponent) => {
    const folder = c.folderName?.trim().toLowerCase()
    return folder === target
  })
})
</script>
