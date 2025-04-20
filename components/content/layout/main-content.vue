<template>
  <div
    class="relative h-full w-full rounded-2xl overflow-hidden bg-base-300 border border-accent"
  >
    <transition name="flip" mode="out-in">
      <!-- Mobile View -->
      <div
        v-if="displayStore.isMobileViewport"
        key="mobile-view"
        class="h-full w-full"
      >
        <splash-tutorial v-if="sidebarRightOpen" class="h-full w-full" />
        <NuxtPage
          :key="$route.fullPath"
          v-else
          class="h-full w-full overflow-y-auto no-scrollbar"
        />
      </div>

      <!-- Desktop View -->
      <div v-else key="desktop-view" class="h-full w-full">
        <NuxtPage
          :key="$route.fullPath"
          class="h-full w-full overflow-y-auto"
        />
      </div>
    </transition>

    <!-- Right Toggle Button -->
    <right-toggle
      class="fixed bottom-4 right-4 z-40"
      :class="{
        'bg-accent text-white shadow-xl': sidebarRightOpen,
        'bg-base-200 shadow': !sidebarRightOpen,
      }"
    />

    <!-- Right Sidebar for Desktop -->
    <aside
      v-if="!displayStore.isMobileViewport && sidebarRightOpen"
      class="fixed z-30 rounded-2xl border-6 border-secondary"
      :style="displayStore.rightSidebarStyle"
    >
      <splash-tutorial />
    </aside>
  </div>
</template>

<script setup lang="ts">
import { useDisplayStore } from '@/stores/displayStore'
import { computed } from 'vue'

const displayStore = useDisplayStore()

const sidebarRightOpen = computed(
  () =>
    displayStore.sidebarRightState !== 'hidden' &&
    displayStore.sidebarRightState !== 'disabled',
)
</script>

<style scoped>
/* Flip transition effect */
.flip-enter-active,
.flip-leave-active {
  transform-style: preserve-3d;
  perspective: 1000px;
  transition: transform 0.6s ease-in-out;
}

.flip-enter,
.flip-leave-to {
  transform: rotateY(90deg);
}

.flip-leave,
.flip-enter-to {
  transform: rotateY(0deg);
}
</style>
