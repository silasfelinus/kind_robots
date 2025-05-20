<!-- /components/content/icons/main-content.vue -->
<template>
  <div
    class="relative flex flex-col min-h-[100dvh] w-full rounded-2xl bg-base-300"
  >
    <!-- Mobile View -->
    <div
      v-if="displayStore.isMobileViewport"
      class="relative flex flex-col min-h-[100dvh] w-full"
    >
      <flip-panel :flipped="sidebarRightOpen">
        <template #front>
          <div class="absolute inset-0 overflow-y-auto">
            <NuxtPage :key="$route.fullPath" class="min-h-full w-full" />
          </div>
        </template>
        <template #back>
          <div class="absolute inset-0 overflow-y-auto">
            <splash-tutorial />
          </div>
        </template>
      </flip-panel>
    </div>

    <div v-else class="absolute inset-0 overflow-y-auto">
      <NuxtPage :key="$route.fullPath" class="min-h-[100dvh] w-full" />
    </div>

    <!-- Right Sidebar & Toggle -->
    <right-toggle
      class="fixed bottom-4 right-4 z-40"
      :class="{
        'bg-accent text-white shadow-xl': sidebarRightOpen,
        'bg-base-300 shadow': !sidebarRightOpen,
      }"
    />
    <transition name="slide-in-right">
      <aside
        v-show="!displayStore.isMobileViewport && sidebarRightOpen"
        class="fixed z-30 rounded-2xl border-6 border-secondary overflow-y-auto bg-base-200 transform transition-transform duration-500 ease-in-out"
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
.slide-in-right-enter-from,
.slide-in-right-leave-to {
  transform: translateX(100%);
  opacity: 0;
}

.slide-in-right-enter-to,
.slide-in-right-leave-from {
  transform: translateX(0);
  opacity: 1;
}

.slide-in-right-enter-active,
.slide-in-right-leave-active {
  transition:
    transform 0.4s ease,
    opacity 0.3s ease;
}
</style>
