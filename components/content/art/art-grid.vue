<!-- /components/content/art/art-grid.vue -->
<template>
  <div
    class="relative w-full flex flex-col"
    :style="{ height: `calc(var(--vh) * ${displayStore.mainContentHeight})` }"
  >
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
    <div class="text-center mt-6 md:mt-1">
      <slot name="title" />
    </div>

    <!-- Toggle Buttons -->
    <div class="flex justify-center gap-2 mt-2">
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

    <!-- Main Area: Columns -->
    <div class="relative w-full flex-1 flex min-h-0">
      <div
        v-if="displayStore.showLeft"
        class="flex-1 overflow-y-auto min-h-0 px-2 space-y-4"
        :class="sectionClass"
      >
        <slot name="left" />
      </div>
      <div
        v-if="displayStore.showCenter"
        class="flex-1 overflow-y-auto min-h-0 px-2 space-y-4"
        :class="sectionClass"
      >
        <slot name="center" />
      </div>
      <div
        v-if="displayStore.showRight"
        class="flex-1 overflow-y-auto min-h-0 px-2 space-y-4"
        :class="sectionClass"
      >
        <slot name="right" />
      </div>
    </div>

    <!-- Footer Panel with Toggle -->
    <div class="fixed rounded-2xl" :style="displayStore.footerStyle">
      <div class="relative w-full h-full">
        <!-- Toggle inside footer -->
        <div class="absolute top-0 left-1/2 -translate-x-1/2 z-50 p-1">
          <button
            class="btn btn-xs btn-circle"
            @click="displayStore.toggleFooter()"
          >
            <Icon
              :name="
                displayStore.footerState === 'extended'
                  ? 'kind-icon:chevron-double-down'
                  : 'kind-icon:chevron-double-up'
              "
            />
          </button>
        </div>

        <!-- Extra content inside footer -->
        <slot name="extra" />
      </div>
    </div>

    <!-- Overlay -->
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
