<template>
  <div class="p-4 space-y-4">
    <!-- Folder View -->
    <div
      v-if="!selectedFolder"
      class="grid grid-cols-[repeat(auto-fit,_minmax(150px,_1fr))] gap-4"
    >
      <div
        v-for="folder in folderNames"
        :key="folder"
        class="rounded-lg hover:bg-primary hover:text-default cursor-pointer transition-transform transform hover:scale-105"
        @click="selectedFolder = folder"
      >
        <div class="text-center">
          <Icon name="kind-icon:folder" class="text-4xl" />
          <p class="mt-2 font-semibold">{{ folder }}</p>
        </div>
      </div>
    </div>

    <!-- Component View -->
    <div v-else class="flex flex-col space-y-4 h-[75vh]">
      <!-- Header / Back -->
      <div class="flex justify-between items-center">
        <p class="italic text-sm text-base-content/60">
          Viewing: <strong>{{ selectedFolder }}</strong>
        </p>
        <button
          class="btn btn-xs btn-outline"
          @click="selectedFolder = null"
        >
          Back to folders
        </button>
      </div>

      <!-- Grid of components -->
      <div
        class="overflow-y-auto flex-grow grid grid-cols-[repeat(auto-fit,_minmax(150px,_1fr))] gap-4 pr-1"
      >
        <div
          v-for="component in folderComponents"
          :key="component.id"
          class="rounded-lg hover:bg-secondary hover:text-default cursor-pointer transition-transform transform hover:scale-105 p-3"
          @click="$emit('select-component', component)"
        >
          <div class="text-center space-y-1">
            <Icon name="kind-icon:companion-cube" class="text-3xl mb-1" />
            <p class="font-semibold text-sm truncate">
              {{ component.componentName }}
            </p>
            <p v-if="component.title" class="text-xs text-base-content/60 truncate">
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

const emit = defineEmits<{
  (e: 'select-component', component: Component): void
}>()

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
