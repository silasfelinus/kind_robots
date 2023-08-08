<template>
  <nav class="w-full bg-base p-4 transition-all duration-500 ease-in-out">
    <!-- Always Visible Home Links -->
    <div class="flex flex-wrap justify-center mt-2 space-x-2">
      <div v-for="page in pagesByTag('home')" :key="page._id" class="m-2">
        <NuxtLink
          :to="page._path"
          class="btn btn-accent rounded-full py-1 px-3 text-white shadow-lg transform transition-transform hover:scale-110"
        >
          {{ page.title }}
        </NuxtLink>
      </div>
    </div>
  </nav>
</template>

<script setup lang="ts">
import { useContentStore } from '../../../stores/contentStore'

const contentStore = useContentStore()
contentStore.getPages()

const pagesByTag = (tag: string) => {
  return contentStore.pages.filter((page: any) => page.tags?.includes(tag))
}
</script>
