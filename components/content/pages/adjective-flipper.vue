<template>
  <span class="transition-transform" :style="{ animation: animationStyle }">
    {{ currentAdjective }}
  </span>
</template>

<script lang="ts" setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'

const adjectives = [
  'cool',
  'awesome',
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
  'elegant',
  'dynamic',
  'charming',
  'fierce',
  'genius',
  'savvy',
  'witty',
  'fun',
  'catchy',
  'sharp',
  'original',
  'vivid',
  'artsy',
  'rare',
  'classy',
  'legendary',
  'extraordinary',
]

const duration = 10_000 // Total duration in milliseconds
const interval = Math.floor(duration / adjectives.length)
const currentIndex = ref(0)

const currentAdjective = computed(() => adjectives[currentIndex.value])

const animationStyle = computed(() => {
  const waveTiming = `${(currentIndex.value + 1) * 0.2}s`
  return `ease-out ${waveTiming}`
})

let timer: NodeJS.Timeout

const startAnimation = () => {
  timer = setInterval(() => {
    currentIndex.value = (currentIndex.value + 1) % adjectives.length
  }, interval)
}

const stopAnimation = () => {
  clearInterval(timer)
}

onMounted(() => {
  startAnimation()
})

onUnmounted(() => {
  stopAnimation()
})
</script>

<style scoped>
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
.transition-transform {
  animation: flipIn 0.6s ease-out forwards;
  display: inline-block;
}
</style>
