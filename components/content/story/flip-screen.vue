<template>
  <div class="flip-container">
    <div class="flip-inner" :class="{ 'is-flipped': flipping }">
      <div class="flip-page flip-front">
        <slot name="current"></slot>
      </div>
      <div class="flip-page flip-back">
        <slot name="previous"></slot>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const flipping = ref(false)
const previousContent = ref<string | null>(null)

// Watch route changes to trigger flip
watch(
  () => route.fullPath,
  (newRoute, oldRoute) => {
    if (newRoute !== oldRoute) {
      console.log(`[Flip] Transitioning from ${oldRoute} to ${newRoute}`)
      previousContent.value = oldRoute // Store the previous page
      flipping.value = true
      setTimeout(() => {
        flipping.value = false
        previousContent.value = null // Clear after transition
      }, 600) // Match transition duration
    }
  },
)
</script>

<style scoped>
.flip-container {
  perspective: 1200px;
  width: 100%;
  height: 100%;
  position: relative;
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

.flip-page {
  position: absolute;
  width: 100%;
  height: 100%;
  backface-visibility: hidden;
}

.flip-front {
  transform: rotateY(0deg);
  background: white; /* Ensure visibility */
}

.flip-back {
  transform: rotateY(180deg);
  background: white;
}
</style>
