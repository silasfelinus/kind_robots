<!-- /components/content/layout/main-content.vue -->
<template>
  <div
    class="relative h-full w-full rounded-2xl overflow-hidden bg-base-300 border border-accent"
  >
    <!-- Mobile View: flip transition between splash and page -->
    <div
      v-if="displayStore.isMobileViewport"
      class="relative h-full w-full"
      key="mobile"
    >
      <!-- Mobile View: flip transition between splash and page -->
      <div
        v-if="displayStore.isMobileViewport"
        class="relative h-full w-full"
        key="mobile"
      >
        <div class="flip-card h-full w-full">
          <div
            class="flip-card-inner h-full w-full"
            :class="{ 'is-flipped': sidebarRightOpen }"
          >
            <div
              class="flip-card-front absolute inset-0 h-full w-full overflow-y-auto"
            >
              <NuxtPage :key="$route.fullPath" />
            </div>
            <div class="flip-card-back absolute inset-0 h-full w-full">
              <splash-tutorial />
            </div>
          </div>
        </div>
      </div>
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
.flip-card {
  perspective: 1000px;
}

.flip-card-inner {
  width: 100%;
  height: 100%;
  position: relative;
  transition: transform 0.6s ease-in-out;
  transform-style: preserve-3d;
}

.flip-card-inner.is-flipped {
  transform: rotateY(180deg);
}

.flip-card-front,
.flip-card-back {
  backface-visibility: hidden;
  position: absolute;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.flip-card-back {
  transform: rotateY(180deg);
}
</style>
