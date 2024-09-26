<template>
  <div
    class="flex flex-wrap justify-center space-x-2 overflow-y-auto pb-10 bg-base-300 rounded-2xl p-2 border relative"
    style="overflow: visible; z-index: 0"
  >
    <div
      class="flex items-center space-x-2 absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
    >
      <div
        class="text-center text-lg font-semibold text-info border-b-2 border-accent rounded-full px-4"
      >
        Highlight Rooms
      </div>
      <Icon name="line-md:highlight" class="text-info text-2xl" />
    </div>
    <NuxtLink
      v-for="page in highlightPages"
      :key="page._id"
      :to="page._path"
      class="group hover:bg-accent transition-colors relative p-2 rounded-2xl border bg-primary flex flex-row items-center space-x-2"
    >
      <div class="w-24 h-24 rounded-lg overflow-hidden border bg-secondary">
        <img
          :src="`/images/${page.image}`"
          alt="Page Image"
          class="object-cover w-full h-full"
        />
      </div>
      <div
        class="flex flex-col items-start"
        @mouseover="isHovered = page._id"
        @mouseleave="isHovered = undefined"
      >
        <div class="text-lg font-bold bg-base-300 p-2 rounded-2xl border">
          {{ page.title }}
        </div>
        <popup-description
          v-if="isHovered === page._id"
          :image="page.image"
          :description="page.description"
          :is-hovered="isHovered === page._id"
        />
      </div>
      <div v-if="page._path === $route.path" class="absolute top-2 right-2">
        <Icon name="line-md:location" class="text-info" />
      </div>
    </NuxtLink>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useContentStore } from './../../../stores/contentStore'

const pageStore = useContentStore()

const isHovered = ref<string | undefined>(undefined)
const highlightPages = computed(() => {
  return pageStore.highlightPages
})
</script>
