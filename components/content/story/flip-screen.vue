<template>
  <div class="flip-container">
    <div class="flip-inner" :class="{ 'is-flipped': flipping }">
      <!-- Front side: Displays the current page -->
      <div class="flip-page flip-front">
        <slot v-if="!flipping" name="current"></slot>
      </div>
      <!-- Back side: Displays the previous page during flip -->
      <div class="flip-page flip-back">
        <slot v-if="flipping" name="previous"></slot>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const flipping = ref(false)
const previousRoute = ref<string | null>(null)

// Prevent double animation
let isFlipping = false

watch(
  () => route.fullPath,
  (newRoute, oldRoute) => {
    if (newRoute !== oldRoute && !isFlipping) {
      console.log(`[Flip] Transitioning from ${oldRoute} to ${newRoute}`)

      isFlipping = true
      previousRoute.value = oldRoute // Store previous content
      flipping.value = true

      setTimeout(() => {
        flipping.value = false
        isFlipping = false
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
  background: white;
}

.flip-back {
  transform: rotateY(180deg);
  background: white;
}
</style>
