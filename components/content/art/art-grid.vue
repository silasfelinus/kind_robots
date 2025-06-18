<template>
  <div class="relative w-full h-full overflow-hidden flex flex-col">

    <!-- Fullscreen Toggle -->
    <div class="absolute top-0 left-0 z-10 p-1">
      <button
        class="btn btn-xs btn-circle"
        @click="displayStore.toggleFullscreen()"
      >
        <Icon
          :name="
            displayStore.isFullScreen
              ? 'kind-icon:compress'
              : 'kind-icon:expand'
          "
        />
      </button>
    </div>

    <!-- Title -->
    <div class="text-center mt-6 md:mt-0">
      <slot name="title" />
    </div>

    <!-- Toggle Buttons with Custom Labels -->
    <div class="hidden md:flex justify-center gap-2 mt-2">
      <button
        class="btn btn-sm"
        :class="{ 'btn-primary': displayStore.showLeft }"
        @click="displayStore.toggleSection('left')"
      >
        <slot name="label-left">⬅️ Left</slot>
      </button>
      <button
        class="btn btn-sm"
        :class="{ 'btn-primary': displayStore.showCenter }"
        @click="displayStore.toggleSection('center')"
      >
        <slot name="label-center">🎯 Center</slot>
      </button>
      <button
        class="btn btn-sm"
        :class="{ 'btn-primary': displayStore.showRight }"
        @click="displayStore.toggleSection('right')"
      >
        <slot name="label-right">➡️ Right</slot>
      </button>
    </div>

    <!-- Report Area -->
    <div class="text-center px-4 md:px-12 lg:px-32 space-y-2">
      <slot name="report" />
    </div>

    <!-- Main Area: Scrollable Columns -->
    <div class="relative flex-1 w-full overflow-hidden">
      <div class="flex w-full h-full">
        <div
          v-if="displayStore.showLeft"
          class="h-full overflow-y-auto px-2 space-y-4"
          :class="sectionClass"
        >
          <slot name="left" />
        </div>
        <div
          v-if="displayStore.showCenter"
          class="h-full overflow-y-auto px-2 space-y-4"
          :class="sectionClass"
        >
          <slot name="center" />
        </div>
        <div
          v-if="displayStore.showRight"
          class="h-full overflow-y-auto px-2 space-y-4"
          :class="sectionClass"
        >
          <slot name="right" />
        </div>
      </div>

      <!-- Fixed Bottom Art Generator -->
      <div class="absolute bottom-0 left-0 right-0 z-30">
        <slot name="extra" />
      </div>
    </div>

    <!-- Overlay (e.g. modal) -->
    <slot name="overlay" />
  </div>
</template>


<script setup lang="ts">
// /components/content/art/art-grid.vue
import { computed } from 'vue'
import { useDisplayStore } from '@/stores/displayStore'

const displayStore = useDisplayStore()

const sectionClass = computed(() => {
  const visibleCount = [
    displayStore.showLeft,
    displayStore.showCenter,
    displayStore.showRight,
  ].filter(Boolean).length
  if (visibleCount === 3) return 'w-1/3'
  if (visibleCount === 2) return 'w-1/2'
  return 'w-full'
})
</script>

<style scoped>
.slide-fade-enter-active,
.slide-fade-leave-active {
  transition: all 0.4s ease;
}
.slide-fade-enter-from,
.slide-fade-leave-to {
  opacity: 0;
  transform: translateY(2rem);
}
</style>
