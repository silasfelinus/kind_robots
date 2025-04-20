<!-- /components/content/layout/main-content.vue -->
<template>
  <div
    class="relative h-full w-full rounded-2xl overflow-hidden bg-base-300 border border-accent"
  >
    <!-- Mobile View: flip transition between splash and page -->
    <div
      v-if="displayStore.isMobileViewport"
      class="relative h-full w-full"
      :style="displayStore.mainContentStyle"
      key="mobile"
    >
      <transition name="flip" mode="out-in">
        <div
          :key="sidebarRightOpen ? 'splash' : 'page'"
          class="h-full w-full relative"
        >
          <div
            class="absolute inset-0 h-full w-full transition-opacity duration-500"
            :class="{
              'opacity-100 z-20': sidebarRightOpen,
              'opacity-0 z-10 pointer-events-none': !sidebarRightOpen,
            }"
          >
            <splash-tutorial />
          </div>

          <div
            class="absolute inset-0 h-full w-full overflow-y-auto transition-opacity duration-500"
            :class="{
              'opacity-100 z-20': !sidebarRightOpen,
              'opacity-0 z-10 pointer-events-none': sidebarRightOpen,
            }"
          >
            <NuxtPage :key="$route.fullPath" />
          </div>
        </div>
      </transition>
    </div>

    <!-- Desktop View: both shown at once -->
    <div v-else class="h-full w-full" key="desktop">
      <NuxtPage :key="$route.fullPath" class="h-full w-full overflow-y-auto" />
    </div>

    <!-- Right Toggle Button -->
    <right-toggle
      class="fixed bottom-4 right-4 z-40"
      :class="{
        'bg-accent text-white shadow-xl': sidebarRightOpen,
        'bg-base-200 shadow': !sidebarRightOpen,
      }"
    />

    <!-- Desktop Sidebar -->
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
