<template>
  <nav class="w-full bg-base p-4 transition-all duration-500 ease-in-out">
    <div class="flex flex-wrap justify-center mt-2 space-x-2">
      <div v-for="page in pagesByTag('home')" :key="page._id" class="m-2">
        <NuxtLink
          :to="page._path"
          class="btn btn-accent rounded-full py-1 px-3 text-default shadow-lg transform transition-transform hover:scale-110"
        >
          <Icon
            name="page.Icon"
            class="Icon-effect transform transition-transform ease-in-out hover:scale-110 hover:shadow-lg"
          />
          {{ page.title }}
        </NuxtLink>
      </div>
    </div>
  </nav>
</template>

<script setup lang="ts">
import { useContentStore } from '../../../stores/contentStore'

const contentStore = useContentStore()

const pagesByTag = (tag: string) => {
  return contentStore.pages.filter((page) => {
    // Ensure that page.tags is defined and is an array
    return page.tags?.includes(tag) ?? false
  })
}
</script>
