<!-- /components/content/icons/flip-panel.vue -->
<template>
  <div class="flip-panel-wrapper">
    <div class="flip-panel-inner" :class="{ 'is-flipped': flipped }">
      <!-- Front Face -->
      <div class="flip-panel-face flip-panel-front">
        <slot name="front" />
      </div>

      <!-- Back Face -->
      <div class="flip-panel-face flip-panel-back">
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

<style scoped>
.flip-panel-wrapper {
  position: relative;
  width: 100%;
  height: 100dvh;
  perspective: 1000px;
  overflow: hidden;
}

.flip-panel-inner {
  position: relative;
  width: 100%;
  height: 100%;
  transition: transform 0.6s ease-in-out;
  transform-style: preserve-3d;
}

.flip-panel-inner.is-flipped {
  transform: rotateY(180deg);
}

.flip-panel-face {
  position: absolute;
  width: 100%;
  height: 100%;
  backface-visibility: hidden;
  will-change: transform;
  overflow-y: auto;
  contain: layout paint;
  display: flex;
  flex-direction: column;
}

.flip-panel-front {
  z-index: 2;
}

.flip-panel-back {
  transform: rotateY(180deg);
  z-index: 1;
}
</style>
