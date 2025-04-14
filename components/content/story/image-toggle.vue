<!-- /components/content/story/image-toggle.vue -->
<template>
  <div
    v-if="image"
    class="relative w-full max-h-[50%] cursor-pointer group"
    @click="handleClick"
  >
    <img
      :src="`/images/${image}`"
      alt="Main Image"
      class="rounded-2xl shadow-md object-contain w-full h-auto transition-opacity group-hover:opacity-80"
    />
    <div
      class="absolute top-2 right-2 text-xs px-2 py-1 bg-accent text-white rounded-full shadow hidden group-hover:block"
    >
      Close Sidebar
    </div>
  </div>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { usePageStore } from '@/stores/pageStore'
import { useDisplayStore } from '@/stores/displayStore'

const { image } = storeToRefs(usePageStore())
const displayStore = useDisplayStore()

const handleClick = () => {
  displayStore.setSidebarRight(false)
}
</script>
