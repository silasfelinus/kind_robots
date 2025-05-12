<!-- /components/content/layout/main-content.vue -->
<template>
  <div class="relative h-full w-full rounded-2xl overflow-hidden bg-base-300">
    <!-- Mobile View: Flip between page and splash -->
    <div v-if="displayStore.isMobileViewport" class="h-full w-full">
      <div class="flip-card h-full w-full">
        <div
          class="flip-card-inner"
          :class="{ 'is-flipped': sidebarRightOpen }"
        >
          <!-- Front Face: Main Page -->
          <div class="flip-card-front">
            <NuxtPage :key="$route.fullPath" class="min-h-full w-full" />
          </div>

          <!-- Back Face: Splash Tutorial -->
          <div class="flip-card-back">
            <splash-tutorial />
          </div>
        </div>
      </div>
    </div>

    <!-- Desktop View: Always show both -->
    <div v-else class="h-full w-full" key="desktop">
      <div class="h-full w-full overflow-y-auto">
        <NuxtPage :key="$route.fullPath" class="min-h-full w-full" />
      </div>
    </div>

    <!-- Right Sidebar & Toggle -->
    <right-toggle
      class="fixed bottom-4 right-4 z-40"
      :class="{
        'bg-accent text-white shadow-xl': sidebarRightOpen,
        'bg-base-300 shadow': !sidebarRightOpen,
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
import { computed, watchEffect } from 'vue'
import { useDisplayStore } from '@/stores/displayStore'

const displayStore = useDisplayStore()

const sidebarRightOpen = computed(
  () =>
    displayStore.sidebarRightState !== 'hidden' &&
    displayStore.sidebarRightState !== 'disabled',
)

watchEffect(() => {
  console.log(
    '[main-content] flip state:',
    sidebarRightOpen.value ? 'Flipped to splash' : 'Flipped to page',
  )
})
</script>

<style scoped>
.flip-card {
  perspective: 1000px;
  width: 100%;
  height: 100%;
}

.flip-card-inner {
  position: relative;
  width: 100%;
  height: 100%;
  transition: transform 0.6s;
  transform-style: preserve-3d;
}

.flip-card-inner.is-flipped {
  transform: rotateY(180deg);
}

.flip-card-front,
.flip-card-back {
  width: 100%;
  height: 100%;
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
  -webkit-overflow-scrolling: touch;
  overflow-y: auto;
}

.flip-card-front {
  position: relative;
  z-index: 2;
}

.flip-card-back {
  position: absolute;
  top: 0;
  left: 0;
  transform: rotateY(180deg);
  z-index: 1;
}
</style>
