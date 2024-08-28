<template>
  <div class="flex space-x-6">
    <!-- Show Home icon only if NOT home -->
    <NuxtLink
      v-if="!isHomePage"
      to="/"
      class="flex items-center justify-center rounded-2xl bg-base-200 text-center hover:scale-110 hover:glow-animation"
    >
      <icon name="line-md:home-md-twotone" class="icon-effect" />
    </NuxtLink>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const contentStore = useContentStore()

const isHomePage = computed(() => {
  return contentStore.currentPage
    ? contentStore.currentPage._path === '/' ||
        contentStore.currentPage._path === '/'
    : false
})
</script>

<style scoped>
.icon-effect {
  @apply w-6 h-6 md:w-16 md:h-16 cursor-pointer transition-shadow;
}

@keyframes glow {
  0% {
    box-shadow: 0 0 5px #fff;
  }
  50% {
    box-shadow:
      0 0 20px #fff,
      0 0 30px #ff73fd;
  }
  100% {
    box-shadow: 0 0 5px #fff;
  }
}

.glow-animation:hover {
  animation: glow 1.5s infinite;
}
</style>
