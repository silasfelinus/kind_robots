<template>
  <span
    class="transition-transform fixed-size"
    :style="{ color: currentColor }"
  >
    {{ currentAdjective }}
  </span>
</template>

<script lang="ts" setup>
import { ref, onMounted, computed } from 'vue'

// List of adjectives without requiring "an"
const adjectives = [
  'cool',
  'unique',
  'epic',
  'stellar',
  'rad',
  'creative',
  'snazzy',
  'quirky',
  'brilliant',
  'smart',
  'impressive',
  'bold',
  'charming',
  'savvy',
  'witty',
  'fun',
  'catchy',
  'classy',
  'legendary',
]

// Rainbow colors for rotating
const colors = [
  '#FF0000', // Red
  '#FF7F00', // Orange
  '#FFFF00', // Yellow
  '#00FF00', // Green
  '#0000FF', // Blue
  '#4B0082', // Indigo
  '#9400D3', // Violet
]

const duration = 10_000 // Total animation duration in milliseconds
const interval = Math.floor(duration / adjectives.length)

const currentIndex = ref(0)
const currentAdjective = computed(() => adjectives[currentIndex.value])
const currentColor = computed(() => colors[currentIndex.value % colors.length]) // Cycle through colors

let timer: number | null = null

const startAnimation = () => {
  timer = window.setInterval(() => {
    if (currentIndex.value < adjectives.length - 1) {
      currentIndex.value++
    } else {
      clearInterval(timer!)
    }
  }, interval)
}

onMounted(() => {
  startAnimation()
})

onUnmounted(() => {
  if (timer) clearInterval(timer)
})
</script>

<style scoped>
.fixed-size {
  display: inline-block;
  width: 8ch; /* Reserve space for the largest word */
  text-align: center;
}
.transition-transform {
  animation: flipIn 0.6s ease-out forwards;
}
@keyframes flipIn {
  0% {
    transform: rotateX(-90deg);
    opacity: 0;
  }
  100% {
    transform: rotateX(0deg);
    opacity: 1;
  }
}
</style>
