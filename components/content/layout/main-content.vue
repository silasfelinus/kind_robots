<!-- /components/content/layout/main-content.vue -->
<template>
  <div
    class="relative h-full w-full rounded-2xl overflow-hidden bg-base-300 border border-accent"
  >
    <!-- Mobile Flip View -->
    <div v-if="displayStore.isMobileViewport" class="relative h-full w-full">
      <div class="flip-card h-full w-full">
        <div
          class="flip-card-inner"
          :class="{ 'is-flipped': sidebarRightOpen }"
        >
          <div class="flip-card-front">
            <NuxtPage
              :key="$route.fullPath"
              class="h-full w-full overflow-y-auto"
            />
          </div>
          <div class="flip-card-back">
            <splash-tutorial />
          </div>
        </div>
      </div>
    </div>

    <!-- Desktop: both shown -->
    <div v-else class="h-full w-full" key="desktop">
      <NuxtPage :key="$route.fullPath" class="h-full w-full overflow-y-auto" />
    </div>

    <!-- Toggle + Sidebar -->
    <right-toggle
      class="fixed bottom-4 right-4 z-40"
      :class="{
        'bg-accent text-white shadow-xl': sidebarRightOpen,
        'bg-base-200 shadow': !sidebarRightOpen,
      }"
    />
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
.flip-card {
  perspective: 1000px;
  width: 100%;
  height: 100%;
  position: relative;
}

.flip-card-inner {
  position: relative;
  width: 100%;
  height: 100%;
  transform-style: preserve-3d;
  transition: transform 0.6s ease-in-out;
}

.flip-card-inner.is-flipped {
  transform: rotateY(180deg);
}

.flip-card-front,
.flip-card-back {
  position: absolute;
  width: 100%;
  height: 100%;
  backface-visibility: hidden;
  top: 0;
  left: 0;
  overflow: hidden;
}

.flip-card-front {
  z-index: 2;
}

.flip-card-back {
  transform: rotateY(180deg);
  z-index: 1;
}
</style>
