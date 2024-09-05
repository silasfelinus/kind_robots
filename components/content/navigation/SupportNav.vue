<template>
  <div class="relative flex flex-wrap justify-center space-x-2 m-1">
    <NuxtLink
      v-for="page in supportPages"
      :key="page._id"
      :to="page._path"
      class="group hover:bg-accent transition-colors relative p-2 rounded-2xl border bg-primary flex flex-row items-center space-x-2 w-72 m-1"
      @mouseover="isHovered = page._id"
      @mouseleave="isHovered = undefined"
      @click="handleLinkClick"
    >
      <div class="w-24 h-24 rounded-lg overflow-hidden border bg-secondary">
        <img
          :src="`/images/${page.image}`"
          alt="Page Image"
          class="object-cover w-full h-full"
        />
      </div>
      <!-- You are here indicator -->
      <div
        v-if="page._path === $route.path"
        class="flex items-center m-2 p-1 text-xl rounded-2xl border bg-secondary"
      >
        You are here
        <Icon name="line-md:download-outline-loop" class="text-lg m-2" />
      </div>
      <div class="flex flex-col items-start">
        <div class="text-lg font-bold bg-base-200 p-2 rounded-2xl border">
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
import { ref, computed } from 'vue'
import { useContentStore } from './../../../stores/contentStore'
import { useFooterStore } from './../../../stores/footerStore'

const contentStore = useContentStore()
const footerStore = useFooterStore()

const isHovered = ref<string | undefined>(undefined)
const supportPages = computed(() => {
  return contentStore.pagesByTagAndSort('home', 'Icon')
})

const handleLinkClick = () => {
  if (footerStore.isExtended) {
    footerStore.toggleIsExtended()
  }
}
</script>
