<!-- /components/content/icons/flip-panel.vue -->
<template>
  <div
    class="relative w-full h-full overflow-auto overscroll-y-contain [perspective:1000px]"
  >
    <div
      class="relative w-full h-full transition-transform duration-500 ease-in-out [transform-style:preserve-3d]"
      :class="{ '[transform:rotateY(180deg)]': flipped }"
    >
      <!-- Front Face -->
      <div
        class="absolute inset-0 flex flex-col [backface-visibility:hidden] [contain:layout_paint] z-20"
      >
        <slot name="front" />
      </div>

      <!-- Back Face -->
      <div
        class="absolute inset-0 flex flex-col [backface-visibility:hidden] [contain:layout_paint] [transform:rotateY(180deg)] z-10"
      >
        <slot name="back" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{ flipped: boolean }>()
</script>
