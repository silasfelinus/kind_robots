<template>
  <div class="flip-container">
    <div class="flip-inner" :class="{ 'is-flipped': flipping }">
      <slot name="front" class="flip-page flip-front"></slot>
      <slot name="back" class="flip-page flip-back"></slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const flipping = ref(false)

// Trigger flip on route change
watch(
  () => route.fullPath,
  () => {
    flipping.value = true
    setTimeout(() => {
      flipping.value = false
    }, 600) // Matches flip transition duration
  },
)
</script>

<style scoped>
.flip-container {
  perspective: 1200px;
  width: 100%;
  height: 100%;
}

.flip-inner {
  position: relative;
  width: 100%;
  height: 100%;
  transition: transform 0.6s ease-in-out;
  transform-style: preserve-3d;
}

.flip-inner.is-flipped {
  transform: rotateY(180deg);
}

/* Front & Back Pages */
.flip-page {
  position: absolute;
  width: 100%;
  height: 100%;
  backface-visibility: hidden;
}

.flip-front {
  transform: rotateY(0deg);
}

.flip-back {
  transform: rotateY(180deg);
}
</style>
