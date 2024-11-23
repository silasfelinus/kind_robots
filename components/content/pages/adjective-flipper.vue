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
  'epic',
  'creative',
  'snazzy',
  'quirky',
  'smart',
  'impressive',
  'bold',
  'charming',
  'witty',
  'fun',
  'catchy',
  'classy',
  'legendary',
    'unique',
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

const totalDuration = 10_000 // Total animation duration in milliseconds
const baseInterval = Math.floor(totalDuration / adjectives.length)
const pauseDuration = 200 // Pause duration in milliseconds
let currentSpeed = baseInterval

const currentIndex = ref(0)
const currentAdjective = computed(() => adjectives[currentIndex.value])
const currentColor = computed(() => colors[currentIndex.value % colors.length]) // Cycle through colors

let timer: number | null = null

const startAnimation = () => {
  const animateWord = () => {
    if (currentIndex.value < adjectives.length - 1) {
      currentIndex.value++
      currentSpeed = Math.max(currentSpeed - 50, 200) // Escalate speed, min 200ms
      timer = window.setTimeout(animateWord, currentSpeed + pauseDuration)
    } else {
      clearTimeout(timer!)
    }
  }
  timer = window.setTimeout(animateWord, currentSpeed + pauseDuration)
}

onMounted(() => {
  startAnimation()
})

onUnmounted(() => {
  if (timer) clearTimeout(timer)
})
</script>

<style scoped>
.fixed-size {
  display: inline-block;
  width: 8ch; /* Reserve space for the largest word */
  text-align: center;
}
.transition-transform {
  animation: flipIn 0.3s ease-out forwards; /* Twice as fast */
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
