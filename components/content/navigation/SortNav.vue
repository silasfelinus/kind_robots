<template>
  <nav class="w-full p-2 transition-all duration-500 ease-in-out bg-base-200 border rounded-2xl">
    <div class="flex flex-wrap justify-center m-2 space-x-2">
      <div
        v-for="page in pagesByTagAndSort('home', 'highlight')"
        :key="page._id"
        class="m-2 relative group"
      >
        <NuxtLink
          :to="page._path"
          class="flex flex-col items-center py-2 px-4 transform transition-transform hover:scale-110"
          @mouseover="isHovered = page._id"
          @mouseleave="isHovered = null"
        >
          <img
            :src="`/images/${page.image}`"
            alt="Page Image"
            class="w-24 h-24 rounded-lg object-cover"
          />
          <div class="mt-2">{{ page.title }}</div>
          <div v-if="page.underConstruction" class="mt-1 px-2 py-0.5 bg-info text-xs rounded-full">
            Under Development
          </div>
        </NuxtLink>
        <popup-description
          v-if="isHovered === page._id"
          :icon="page.icon"
          :description="page.description"
          :is-hovered="isHovered === page._id"
        />
      </div>
    </div>
    <div class="flex flex-wrap justify-center mt-2 space-x-2">
      <div
        v-for="page in pagesByTagAndSort('home', 'icon')"
        :key="page._id"
        class="m-2 relative group"
      >
        <NuxtLink
          :to="page._path"
          class="btn btn-accent rounded-full p-2 transform transition-transform hover:scale-110 flex items-center space-x-2"
        >
          <icon
            :name="page.icon"
            class="w-6 h-6 group-hover:text-accent transition-colors duration-300"
          />
          {{ page.title }}
        </NuxtLink>
        <popup-description
          v-if="isHovered === page._id"
          :icon="page.icon"
          :description="page.description"
          :is-hovered="isHovered === page._id"
        />
        <div v-if="page.underConstruction" class="mt-1 px-2 py-0.5 bg-info text-md rounded-full">
          Under Development
        </div>
      </div>
    </div>
    <div class="flex flex-wrap justify-center mt-2 space-x-2">
      <div
        v-for="page in pagesByTagAndSort('home', 'text')"
        :key="page._id"
        class="m-2 relative group"
      >
        <NuxtLink :to="page._path" class="p-2 transform transition-transform hover:scale-110">
          {{ page.title }}
        </NuxtLink>
        <popup-description
          v-if="isHovered === page._id"
          :icon="page.icon"
          :description="page.description"
          :is-hovered="isHovered === page._id"
        />
        <div v-if="page.underConstruction" class="mt-1 px-2 py-0.5 bg-info text-xs rounded-full">
          Under Development
        </div>
      </div>
    </div>
  </nav>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { usePageStore } from '@/stores/pageStore'
const isHovered = ref(null)
onMounted(() => {
  if (process.client) {
    const pageStore = usePageStore()
    pageStore.getPages()
  }
})

const pagesByTagAndSort = (tag: string, sort: string) => {
  const pageStore = usePageStore()
  return pageStore.pages.filter((page: any) => page.tags?.includes(tag) && page.sort === sort)
}
</script>
