<!-- /components/content/art/art-grid.vue -->
<template>
  <div
    class="relative w-full flex flex-col bg-secondary rounded-2xl"
    :style="{ height: `calc(var(--vh) * ${displayStore.mainContentHeight})` }"
  >
    <!-- Fullscreen Toggle -->
    <div class="absolute top-0 left-0 z-10 p-2">
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
    <div class="text-center p-2">
      <slot name="title" />
    </div>
    <!-- Toggle Buttons -->
    <div class="flex justify-center p-2">
      <div class="flex gap-2 bg-base-300 rounded-2xl p-2 shadow-inner">
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
    </div>

    <!-- Corner Panel -->
    <corner-panel />

    <!-- Main Area: Columns with Animations -->
    <div class="relative w-full flex-1 flex min-h-0">
      <Transition name="slide-left" mode="out-in">
        <div
          v-if="displayStore.showLeft"
          key="left"
          class="flex-1 overflow-y-auto min-h-0 px-2 space-y-4"
          :class="sectionClass"
        >
          <slot name="left" />
        </div>
      </Transition>

      <Transition name="slide-down" mode="out-in">
        <div
          v-if="displayStore.showCenter"
          key="center"
          class="flex-1 overflow-y-auto min-h-0 px-2 space-y-4"
          :class="sectionClass"
        >
          <slot name="center" />
        </div>
      </Transition>

      <Transition name="slide-right" mode="out-in">
        <div
          v-if="displayStore.showRight"
          key="right"
          class="flex-1 overflow-y-auto min-h-0 px-2 space-y-4"
          :class="sectionClass"
        >
          <slot name="right" />
        </div>
      </Transition>
    </div>
    <slot
      name="extra"
      :style="{ height: `calc(var(--vh) * ${displayStore.footerHeight})` }"
    />

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

<style scoped>
/* Shared */
.slide-left-enter-active,
.slide-left-leave-active,
.slide-right-enter-active,
.slide-right-leave-active,
.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 0.5s ease;
}

/* LEFT */
.slide-left-enter-from {
  transform: translateX(-100%);
  opacity: 0;
}
.slide-left-enter-to {
  transform: translateX(0);
  opacity: 1;
}
.slide-left-leave-from {
  transform: translateX(0);
  opacity: 1;
}
.slide-left-leave-to {
  transform: translateX(-100%);
  opacity: 0;
}

/* RIGHT */
.slide-right-enter-from {
  transform: translateX(100%);
  opacity: 0;
}
.slide-right-enter-to {
  transform: translateX(0);
  opacity: 1;
}
.slide-right-leave-from {
  transform: translateX(0);
  opacity: 1;
}
.slide-right-leave-to {
  transform: translateX(100%);
  opacity: 0;
}

/* DOWN (Center Column) */
.slide-down-enter-from {
  transform: translateY(-20px);
  opacity: 0;
}
.slide-down-enter-to {
  transform: translateY(0);
  opacity: 1;
}
.slide-down-leave-from {
  transform: translateY(0);
  opacity: 1;
}
.slide-down-leave-to {
  transform: translateY(-20px);
  opacity: 0;
}
</style>
