<!-- /components/content/icons/flip-panel.vue -->
<template>
  <div class="relative w-full h-full overflow-hidden [perspective:1000px]">
    <div
      class="relative w-full h-full transition-transform duration-500 ease-in-out [transform-style:preserve-3d]"
      :class="{ '[transform:rotateY(180deg)]': flipped }"
    >
      <!-- Front face -->
      <div
        class="absolute inset-0 z-20 flex flex-col [backface-visibility:hidden] [contain:layout_paint] will-change-transform overscroll-contain"
        :class="{ 'pointer-events-none invisible': flipped }"
      >
        <slot name="front" />
      </div>

      <!-- Back face -->
      <div
        class="absolute inset-0 z-10 flex flex-col [backface-visibility:hidden] [contain:layout_paint] will-change-transform overscroll-contain [transform:rotateY(180deg)]"
        :class="{ 'pointer-events-none invisible': !flipped }"
      >
        <slot name="back" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// /components/content/icons/flip-panel.vue
defineProps<{
  flipped: boolean
}>()
</script>
