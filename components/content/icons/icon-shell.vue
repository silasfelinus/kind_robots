<!-- /components/content/icons/icon-shell.vue -->
<template>
  <div
    class="group relative flex items-center justify-center snap-start h-[6rem] w-[4rem] select-none"
    :class="{ 'cursor-move': draggable && !isTouch }"
    :draggable="draggable && !isTouch"
    @dragstart="handleDragStart"
    @dragover.prevent
    @drop="onDrop"
  >
    <div class="relative w-full h-full flex items-center justify-center">
      <div
        class="w-[3rem] h-[3rem] flex items-center justify-center overflow-hidden"
        draggable="false"
      >
        <slot name="icon" />
      </div>

      <div
        class="absolute bottom-0 left-1/2 -translate-x-1/2 h-[1.25rem] w-full flex items-center justify-center pointer-events-none z-40"
      >
        <slot name="label" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  draggable?: boolean
  onDragStart?: (e: DragEvent) => void
  onDrop?: (e: DragEvent) => void
}>()

const isTouch = typeof window !== 'undefined' &&
  ('ontouchstart' in window || navigator.maxTouchPoints > 0)

function handleDragStart(e: DragEvent) {
  if (isTouch) return
  props.onDragStart?.(e)
}
</script>

<style scoped>
/* Optional: prevent accidental text selection while dragging */
.noselect {
  user-select: none;
  -webkit-user-select: none;
  -ms-user-select: none;
}
</style>
