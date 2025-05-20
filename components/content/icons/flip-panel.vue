<!-- /components/content/icons/flip-panel.vue -->
<template>
  <div class="relative w-full h-full overflow-hidden [perspective:1000px]">
    <div
      class="relative w-full h-full transition-transform duration-500 ease-in-out [transform-style:preserve-3d]"
      :class="{ '[transform:rotateY(180deg)]': flipped }"
    >
      <!-- Front Face -->
      <div
        class="absolute inset-0 flex flex-col [backface-visibility:hidden] [contain:layout_paint] will-change-transform overscroll-contain z-[1]"
        :class="{ 'pointer-events-none invisible': flipped }"
      >
        <div class="absolute inset-0 overflow-y-auto touch-auto">
          <slot name="front" />
        </div>
      </div>

      <!-- Back Face -->
      <div
        class="absolute inset-0 flex flex-col [backface-visibility:hidden] [contain:layout_paint] will-change-transform overscroll-contain [transform:rotateY(180deg)]"
        :class="{ 'pointer-events-none invisible': !flipped }"
      >
        <div class="absolute inset-0 overflow-y-auto touch-auto">
          <slot name="back" />
        </div>
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

<style scoped>
.flip-panel-wrapper {
  position: relative;
  width: 100%;
  height: 100%;
  perspective: 1000px;
  overflow: hidden;
}

.flip-panel-inner {
  position: relative;
  width: 100%;
  height: 100%;
  transform-style: preserve-3d;
  transition: transform 0.6s ease-in-out;
}

.flip-panel-inner.is-flipped {
  transform: rotateY(180deg);
}

.flip-panel-face {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
  contain: layout paint;
  will-change: transform;
  display: flex;
  flex-direction: column;
  overscroll-behavior: contain;
  -webkit-overflow-scrolling: touch;
}

.flip-panel-front {
  z-index: 1;
}

.flip-panel-back {
  transform: rotateY(180deg);
}

/* Optional: Hide content on hidden side */
.front-hidden {
  pointer-events: none;
  visibility: hidden;
}

.back-hidden {
  pointer-events: none;
  visibility: hidden;
}
</style>
