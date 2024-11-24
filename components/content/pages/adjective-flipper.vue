<template>
  <span class="transition-transform fixed-size" :class="[currentColor]">
    {{ currentAdjective }}
  </span>
</template>

<script lang="ts" setup>
import { ref, onMounted, computed, onUnmounted } from 'vue'

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

const colors = [
  'text-primary',
  'text-secondary',
  'text-info',
  'text-warning',
  'text-accent',
]

const totalDuration = 10_000
const baseInterval = Math.floor(totalDuration / adjectives.length)
const pauseDuration = 200
let currentSpeed = baseInterval

const currentIndex = ref(0)
const currentAdjective = computed(() => adjectives[currentIndex.value] || '')
const currentColor = computed(
  () => colors[currentIndex.value % colors.length] || 'text-primary',
)

let timer: number | null = null

const startAnimation = () => {
  const animateWord = () => {
    if (currentIndex.value < adjectives.length - 1) {
      currentIndex.value++
      currentSpeed = Math.max(currentSpeed - 50, 200)
      if (timer) clearTimeout(timer)
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
  width: 8ch;
  text-align: center;
}
.transition-transform {
  animation: flipIn 0.3s ease-out forwards;
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
