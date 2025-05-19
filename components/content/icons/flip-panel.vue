<!-- /components/content/icons/flip-panel.vue -->
<template>
  <div class="flip-panel-wrapper">
    <div class="flip-panel-inner" :class="{ 'is-flipped': flipped }">
      <!-- Front Face -->
      <div
        class="flip-panel-face flip-panel-front"
        :class="{
          'overflow-y-auto touch-auto': !flipped,
          'overflow-hidden touch-none': flipped,
          'front-hidden': flipped,
        }"
      >
        <slot name="front" />
      </div>

      <!-- Back Face -->
      <div
        class="flip-panel-face flip-panel-back"
        :class="{
          'overflow-y-auto touch-auto': flipped,
          'overflow-hidden touch-none': !flipped,
          'back-hidden': !flipped,
        }"
      >
        <slot name="back" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
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
