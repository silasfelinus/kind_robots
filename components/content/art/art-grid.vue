<!-- /components/content/art/art-grid.vue -->
<template>
  <div class="relative w-full h-[calc(100vh-4rem)] overflow-hidden flex flex-col">
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

    <!-- Title + Toggle Buttons -->
    <div class="text-center mt-6 md:mt-0">
      <slot name="title" />
    </div>

    <div class="hidden md:flex justify-center gap-2 mt-2">
      <button class="btn btn-sm" :class="{ 'btn-primary': showLeft }" @click="toggleSection('left')">⬅️ Left</button>
      <button class="btn btn-sm" :class="{ 'btn-primary': showCenter }" @click="toggleSection('center')">🎯 Center</button>
      <button class="btn btn-sm" :class="{ 'btn-primary': showRight }" @click="toggleSection('right')">➡️ Right</button>
    </div>

    <!-- Report Area -->
    <div class="text-center px-4 md:px-12 lg:px-32 space-y-2">
      <slot name="report" />
    </div>

    <!-- Main Display -->
    <div
      class="flex-1 overflow-hidden flex w-full transition-all duration-500"
      :class="{ 'opacity-30 pointer-events-none': isExtraExpanded }"
    >
      <div
        v-if="showLeft"
        class="h-full overflow-y-auto px-2 space-y-4"
        :class="sectionClass"
      >
        <slot name="left" />
      </div>
      <div
        v-if="showCenter"
        class="h-full overflow-y-auto px-2 space-y-4"
        :class="sectionClass"
      >
        <slot name="center" />
      </div>
      <div
        v-if="showRight"
        class="h-full overflow-y-auto px-2 space-y-4"
        :class="sectionClass"
      >
        <slot name="right" />
      </div>
    </div>

    <transition name="slide-fade">
  <div
    ref="extraRef"
    class="w-full border-t border-base-content bg-base-300 shadow-inner overflow-y-auto transition-all duration-500 relative"
    :class="{ 'absolute bottom-0 left-0 right-0 z-40': isExtraExpanded }"
    :style="{ maxHeight: isExtraExpanded ? '85vh' : '20vh' }"
    @touchstart="onTouchStart"
    @touchend="onTouchEnd"
  >
    <!-- Floating Toggle -->
    <div class="absolute top-0 left-1/2 -translate-x-1/2 z-10 mt-1">
      <button
        class="btn btn-xs btn-circle bg-base-100 border border-base-content shadow"
        @click="isExtraExpanded = !isExtraExpanded"
      >
        <Icon
          :name="isExtraExpanded ? 'kind-icon:chevron-double-down' : 'kind-icon:chevron-double-up'"
        />
      </button>
    </div>

    <!-- Slot Content -->
    <div class="pt-8 px-2 pb-4">
      <slot name="extra" />
    </div>
  </div>
</transition>


    <!-- Overlay -->
    <div
      v-if="showOverlay"
      class="fixed inset-0 bg-base-100 bg-opacity-90 z-50 flex items-center justify-center"
    >
      <div class="w-[90vw] h-[90vh] overflow-auto p-4 rounded-xl shadow-xl bg-base-200 border border-base-content">
        <slot name="overlay" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// /components/content/art/art-grid.vue
import { ref, computed } from 'vue'
import { useDisplayStore } from '@/stores/displayStore'

const displayStore = useDisplayStore()

const showLeft = ref(true)
const showCenter = ref(true)
const showRight = ref(true)
const showOverlay = ref(false)
const isExtraExpanded = ref(false)

let startY = 0

function onTouchStart(e: TouchEvent) {
  startY = e.touches[0].clientY
}

function onTouchEnd(e: TouchEvent) {
  const endY = e.changedTouches[0].clientY
  const deltaY = endY - startY

  // Ignore minor movement
  if (Math.abs(deltaY) < 50) return

  // Swipe up: expand, Swipe down: collapse
  isExtraExpanded.value = deltaY < 0
}


function toggleSection(section: 'left' | 'center' | 'right') {
  if (section === 'left') showLeft.value = !showLeft.value
  if (section === 'center') showCenter.value = !showCenter.value
  if (section === 'right') showRight.value = !showRight.value
}

const sectionClass = computed(() => {
  const visible = [showLeft.value, showCenter.value, showRight.value].filter(Boolean).length
  if (visible === 3) return 'w-1/3'
  if (visible === 2) return 'w-1/2'
  return 'w-full'
})
</script>
