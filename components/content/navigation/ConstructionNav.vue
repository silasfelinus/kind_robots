<template>
  <div
    class="flex flex-wrap justify-center space-x-2 overflow-y-auto relative"
    style="overflow: visible; z-index: 0"
  >
    <div
      class="text-center text-2xl font-extrabold tracking-wider shadow-lg bg-warning border rounded-2xl transform -translate-x-1/2 mb-1 px-1 top-0 absolute z-50 pointer-events-none"
      style="left: 50%; transform: translateX(-50%)"
    >
      Under Construction
      <icon name="line-md:construction" class="text-2xl ml-2" />
    </div>
    <NuxtLink
      v-for="page in underConstructionPages"
      :key="page._id"
      :to="page._path"
      class="group hover:bg-accent transition-colors relative rounded-2xl border bg-info flex flex-row items-center space-x-2 w-64"
      @mouseover="isHovered = page._id"
      @mouseleave="isHovered = null"
    >
      <div
        v-if="page._path === $route.path"
        class="flex items-center mt-1 text-xl rounded-2xl border bg-secondary bottom-0 right-0 absolute"
      >
        You are here <icon name="line-md:download-outline-loop" class="text-lg mr-2" />
      </div>
      <div class="w-20 h-20 rounded-lg overflow-hidden border bg-secondary">
        <img :src="`/images/${page.image}`" alt="Page Image" class="object-cover w-full h-full" />
      </div>
      <div class="flex flex-col items-start">
        <div class="text-lg font-bold bg-base-200 px-2 rounded-2xl border">
          {{ page.title }}
        </div>
        <popup-description
          v-if="isHovered === page._id"
          :icon="page.icon"
          :description="page.description"
          :is-hovered="isHovered === page._id"
        />
      </div>
    </NuxtLink>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { usePageStore } from '~/stores/pageStore'

const pageStore = usePageStore()

onMounted(() => {
  if (process.client) {
    pageStore.getPages()
  }
})

const isHovered = ref(null)
const underConstructionPages = computed(() => {
  return pageStore.pagesUnderConstruction
})
</script>
