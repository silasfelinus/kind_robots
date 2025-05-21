<!-- /components/content/wonderlab/lab-gallery.vue -->
<template>
  <div class="grid grid-cols-[repeat(auto-fit,_minmax(150px,_1fr))] gap-4 p-4">
    <div
      v-for="folder in folderNames"
      :key="folder"
      class="rounded-lg hover:bg-primary hover:text-default cursor-pointer transition-transform transform hover:scale-105"
      @click="$emit('select-folder', folder)"
    >
      <div class="text-center">
        <Icon name="kind-icon:folder" class="text-4xl" />
        <p class="mt-2 font-semibold">{{ folder }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useComponentStore } from '@/stores/componentStore'

const componentStore = useComponentStore()

const folderNames = computed(() => {
  const folders = new Set(
    componentStore.components.map((component) => component.folderName),
  )
  return Array.from(folders)
})
</script>
