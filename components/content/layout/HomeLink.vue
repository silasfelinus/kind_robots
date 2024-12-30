<template>
  <div class="Icon-link-container">
    <NuxtLink
      v-if="!isHomePage"
      to="/"
      :class="[
        'flex',
        'items-center',
        'justify-center',
        'rounded-2xl',
        'text-center',
        'hover:scale-110',
        'hover:glow-animation',
        isHomePage ? 'text-gray-400' : '',
      ]"
    >
      <Icon
        name="kind-icon:home"
        class="Icon-effect w-6 h-6 md:w-12 md:h-12 cursor-pointer transform transition-transform ease-in-out hover:scale-110"
      />
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
.Icon-effect {
  @apply cursor-pointer transition-shadow;
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
