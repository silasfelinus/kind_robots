<template>
  <div class="w-full max-w-5xl rounded-2xl bg-base-100 relative flip-card shadow-lg overflow-y-auto">
    <div class="flip-card-inner" :class="{ 'is-flipped': !showTutorial }">
      <!-- Front side: Splash Tutorial -->
      <div class="flip-card-front">
        <SplashTutorial />
      </div>
      <!-- Back side: NuxtPage content -->
      <div class="flip-card-back">
        <NuxtPage />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { defineProps } from 'vue'

// Props to control flipping behavior
const props = defineProps({
  showTutorial: {
    type: Boolean,
    required: true,
  },
})
</script>

<style scoped>
.flip-card {
  width: 100%;
  height: 100%;
  perspective: 1000px;
}

.flip-card-inner {
  width: 100%;
  height: 100%;
  transition: transform 0.6s ease-in-out;
  transform-style: preserve-3d;
}

.flip-card-inner.is-flipped {
  transform: rotateY(180deg);
}

.flip-card-front,
.flip-card-back {
  position: absolute;
  width: 100%;
  height: 100%;
  backface-visibility: hidden;
  border-radius: 12px;
}

.flip-card-front {
  z-index: 2;
}

.flip-card-back {
  transform: rotateY(180deg);
}
</style>
