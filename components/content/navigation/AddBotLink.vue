<template>
  <div class="icon-link-container">
    <NuxtLink
      to="/addbot"
      :class="{
        'icon-link': true,
        'rounded-2xl': true,
        'bg-base-200': true,
        'text-center': true,
        'hover:scale-110': !isCurrentPage,
        'hover:glow-animation': !isCurrentPage,
        'text-gray-400': isCurrentPage,
      }"
    >
      <icon name="fluent--bot-add-20-regular" class="icon-effect" />
    </NuxtLink>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useContentStore } from './../../../stores/contentStore'

const contentStore = useContentStore()
const isCurrentPage = computed(
  () => contentStore.currentPage?._path === '/addbot',
)
</script>

<style scoped>
.icon-effect {
  @apply w-6 h-6 md:w-16 md:h-16 cursor-pointer transition-shadow;
}
.glow-animation:hover {
  animation: glow 1.5s infinite;
}
</style>
