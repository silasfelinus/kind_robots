<!-- /components/content/icons/main-content.vue -->
<template>
  <div class="relative flex flex-col h-full w-full bg-base-300 rounded-2xl">
    <!-- Mobile View -->
    <div
      v-if="displayStore.isMobileViewport"
      class="relative flex flex-col h-full w-full"
    >
      <transition name="fade" mode="out-in">
        <component
          :is="sidebarRightOpen ? 'splash-tutorial' : 'NuxtPage'"
          :key="sidebarRightOpen ? 'splash' : $route.fullPath"
          class="absolute inset-0 min-h-[100dvh] w-full px-4 py-6"
        />
      </transition>
    </div>

    <!-- Desktop View -->
    <div v-else class="relative flex-1 w-full h-full">
      <div class="absolute inset-0">
        <NuxtPage :key="$route.fullPath" class="w-full px-4 py-6" />
      </div>
    </div>

    <!-- Right Sidebar & Toggle -->
    <right-toggle
      class="fixed bottom-14 right-4 z-40"
      :class="{
        'bg-accent text-white shadow-xl': sidebarRightOpen,
        'bg-base-300 shadow': !sidebarRightOpen,
      }"
    />
    <transition name="slide-in-right" appear>
      <aside
        v-show="!displayStore.isMobileViewport && sidebarRightOpen"
        class="fixed z-30 rounded-2xl border-6 border-secondary bg-base-200 transform will-change-transform transition-transform duration-500 ease-in-out"
        :style="displayStore.rightSidebarStyle"
      >
        <splash-tutorial />
      </aside>
    </transition>
  </div>
</template>

<script setup lang="ts">
// /components/content/icons/main-content.vue
import { computed } from 'vue'
import { useDisplayStore } from '@/stores/displayStore'

const displayStore = useDisplayStore()

const sidebarRightOpen = computed(
  () =>
    displayStore.sidebarRightState !== 'hidden' &&
    displayStore.sidebarRightState !== 'disabled',
)
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
