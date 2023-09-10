<template>
  <nav class="w-full bg-base p-4 transition-all duration-500 ease-in-out">
    <div class="flex flex-wrap justify-center mt-2 space-x-2">
      <div v-for="page in pagesByTag('home')" :key="page._id" class="m-2 relative group">
        <NuxtLink
          :to="page._path"
          class="flex flex-col items-center py-2 px-4 text-white shadow-lg transform transition-transform hover:scale-110"
          :class="
            page.sort === 'icon'
              ? 'btn btn-accent rounded-full'
              : 'text-white hover:text-accent-dark'
          "
        >
          <template v-if="page.sort === 'highlight'">
            <img
              :src="`/images/${page.image}`"
              alt="Page Image"
              class="w-24 h-24 rounded-full object-cover"
            />
            <div class="mt-2 text-white">{{ page.title }}</div>
          </template>
          <template v-else-if="page.sort === 'icon'">
            <icon
              :name="page.icon"
              class="w-6 h-6 text-white group-hover:text-accent transition-colors duration-300"
            />
            <div class="mt-2 text-white">{{ page.title }}</div>
          </template>
          <template v-else>
            {{ page.title }}
          </template>
        </NuxtLink>
        <template v-if="page.underConstruction">
          <div class="absolute inset-0 flex items-center justify-center">
            <div
              class="w-16 h-16 bg-red-600 opacity-75 rounded-full flex items-center justify-center"
            >
              <icon name="mdi:close-thick" class="text-white w-10 h-10" />
            </div>
          </div>
        </template>
      </div>
    </div>
  </nav>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { usePageStore } from '@/stores/pageStore'

onMounted(() => {
  if (process.client) {
    const pageStore = usePageStore()
    pageStore.getPages()
  }
})

const pagesByTag = (tag: string) => {
  const pageStore = usePageStore()
  return pageStore.pages.filter((page: any) => page.tags?.includes(tag))
}
</script>
