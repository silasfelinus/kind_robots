<!-- /components/content/icons/main-content.vue -->
<template>
  <div class="relative flex flex-col h-full w-full bg-base-300 rounded-2xl">
    <!-- Nuxt Page -->
    <NuxtPage
      :key="$route.fullPath"
      class="absolute inset-0 h-full w-full px-4 py-6 transition-opacity duration-300"
      v-show="showMainContent"
    />

    <!-- Splash Tutorial -->
    <splash-tutorial
      class="absolute inset-0 h-full w-full px-4 py-6 transition-opacity duration-300"
      v-show="showSplashTutorial"
    />

    <!-- Right Sidebar Toggle (always visible) -->
    <right-toggle
      class="fixed bottom-14 right-4 z-40"
      :class="{
        'bg-accent text-white shadow-xl': sidebarRightOpen,
        'bg-base-300 shadow': !sidebarRightOpen,
      }"
    />
  </div>
</template>

// /components/content/icons/main-content.vue
<script setup lang="ts">
import { computed } from 'vue'
import { useDisplayStore } from '@/stores/displayStore'

const displayStore = useDisplayStore()

const sidebarRightOpen = computed(
  () =>
    displayStore.sidebarRightState !== 'hidden' &&
    displayStore.sidebarRightState !== 'disabled',
)

const showMainContent = computed(() => {
  if (displayStore.viewportSize === 'small') {
    return displayStore.sidebarRightState !== 'open'
  }
  return true
})

const showSplashTutorial = computed(() => {
  if (displayStore.viewportSize === 'small') {
    return (
      displayStore.sidebarRightState === 'hidden' ||
      displayStore.sidebarRightState === 'disabled'
    )
  }
  return false
})
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
.slide-in-right-enter-from,
.slide-in-right-leave-to {
  transform: translateX(100%);
  opacity: 0;
}
.slide-in-right-enter-active,
.slide-in-right-leave-active {
  transition:
    transform 0.4s ease-in-out,
    opacity 0.3s ease-in-out;
}
.slide-in-right-enter-to,
.slide-in-right-leave-from {
  transform: translateX(0);
  opacity: 1;
}
</style>
