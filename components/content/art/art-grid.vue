<!-- /components/content/art/art-grid.vue -->
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
        :class="{ 'btn-primary': showLeft }"
        @click="toggleSection('left')"
      >
        <slot name="label-left">⬅️ Left</slot>
      </button>
      <button
        class="btn btn-sm"
        :class="{ 'btn-primary': showCenter }"
        @click="toggleSection('center')"
      >
        <slot name="label-center">🎯 Center</slot>
      </button>
      <button
        class="btn btn-sm"
        :class="{ 'btn-primary': showRight }"
        @click="toggleSection('right')"
      >
        <slot name="label-right">➡️ Right</slot>
      </button>
    </div>

    <!-- Report Area -->
    <div class="text-center px-4 md:px-12 lg:px-32 space-y-2">
      <slot name="report" />
    </div>

    <!-- Main Display -->
    <div class="flex-1 overflow-hidden flex w-full transition-all duration-500">
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

    <!-- Expandable Extra Section -->
    <transition name="slide-fade">
      <div
        ref="extraRef"
        class="w-full border-t border-base-content bg-base-300 shadow-inner overflow-y-auto transition-all duration-500 relative"
        :class="{
          'absolute bottom-0 left-0 right-0 z-40': displayStore.isExtraExpanded,
        }"
        :style="{ maxHeight: displayStore.isExtraExpanded ? '50vh' : '20vh' }"
      >
        <!-- Floating Toggle -->
        <div class="absolute top-0 left-1/2 -translate-x-1/2 z-10 mt-1">
          <button
            class="btn btn-xs btn-circle bg-base-100 border border-base-content shadow"
            @click="displayStore.toggleExtraExpanded()"
          >
            <Icon
              :name="
                displayStore.isExtraExpanded
                  ? 'kind-icon:chevron-double-down'
                  : 'kind-icon:chevron-double-up'
              "
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
    <slot name="overlay" />
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

function toggleSection(section: 'left' | 'center' | 'right') {
  if (section === 'left') showLeft.value = !showLeft.value
  if (section === 'center') showCenter.value = !showCenter.value
  if (section === 'right') showRight.value = !showRight.value
}

const sectionClass = computed(() => {
  const visible = [showLeft.value, showCenter.value, showRight.value].filter(
    Boolean,
  ).length
  if (visible === 3) return 'w-1/3'
  if (visible === 2) return 'w-1/2'
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
