<template>
  <div class="flex flex-wrap justify-center space-x-2 rounded-2xl p-1 m-10">
    <NuxtLink
      v-for="page in highlightPages"
      :key="page._id"
      :to="page._path"
      class="group hover:bg-accent transition-colors relative p-2 rounded-2xl border bg-base-200 flex flex-row items-center space-x-2 w-72"
      @mouseover="isHovered = page._id"
      @mouseleave="isHovered = null"
    >
      <div class="w-24 h-24 rounded-lg overflow-hidden border bg-secondary">
        <img :src="`/images/${page.image}`" alt="Page Image" class="object-cover w-full h-full" />
      </div>
      <div class="flex flex-col justify-between items-start w-full">
        <div class="text-lg font-bold bg-base-200 p-2 rounded-2xl border">
          {{ page.title }}
        </div>
        <div
          v-if="page._path === $route.path"
          class="flex items-center m-1 text-xl rounded-2xl border bg-accent p-1"
        >
          You are here <icon name="line-md:download-outline-loop" class="text-lg m-1" />
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
import { usePageStore } from '@/stores/pageStore'

const pageStore = usePageStore()

onMounted(() => {
  pageStore.getPages()
})

const isHovered = ref(null)
const highlightPages = computed(() => {
  return pageStore.highlightPages
})
</script>
