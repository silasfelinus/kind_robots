<template>
  <div class="Icon-link-container">
    <NuxtLink
      to="/botmessages"
      :class="[
        'flex',
        'items-center',
        'justify-center',
        'rounded-2xl',
        'text-center',
        'hover:scale-110',
        'hover:glow-animation',
        isCurrentPage ? 'text-gray-400' : '',
      ]"
    >
      <Icon
        name="material-symbols:menu-book-outline"
        class="w-6 h-6 md:w-16 md:h-16 cursor-pointer transition-shadow"
      />
    </NuxtLink>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useContentStore } from './../../../stores/contentStore'

const contentStore = useContentStore()
const isCurrentPage = computed(
  () => contentStore.currentPage?._path === '/botmessages',
)
</script>

<style scoped>
.glow-animation:hover {
  animation: glow 1.5s infinite;
}

@keyframes glow {
  0%,
  100% {
    box-shadow: 0 0 5px rgba(255, 255, 255, 0.75);
  }
  50% {
    box-shadow:
      0 0 20px rgba(255, 115, 253, 0.75),
      0 0 30px rgba(255, 115, 253, 0.75);
  }
}
</style>
