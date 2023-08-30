<template>
  <div
    :style="blobStyle"
    class="blob cursor-pointer transition duration-300 hover:scale-105"
    @click="handleClick"
  >
    {{ label }}
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

// Props definition
const props = defineProps<{
  label?: string
  prompt?: string
  url?: string
}>()

const label = props.label || 'Bubble'

// Data
const blobRadius = ref(randomizeBlobShape())
const blobColor = ref(randomColor())

// Computed
const blobStyle = computed(() => ({
  borderRadius: blobRadius.value,
  backgroundColor: blobColor.value,
  width: '150px',
  height: '150px',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  fontSize: '1rem',
  animation: 'float 4s ease-in-out infinite'
}))

// Methods
function handleClick() {
  if (props.url) {
    window.location.href = props.url
  }
  // Handle API interaction with prompt data here if needed
}

function randomizeBlobShape(): string {
  const values = [
    `${getRandom(50, 60)}% ${getRandom(60, 70)}% ${getRandom(60, 70)}% ${getRandom(
      50,
      60
    )}% / ${getRandom(50, 60)}% ${getRandom(50, 60)}% ${getRandom(50, 60)}% ${getRandom(50, 60)}%`,
    `${getRandom(60, 70)}% ${getRandom(50, 60)}% ${getRandom(50, 60)}% ${getRandom(
      60,
      70
    )}% / ${getRandom(50, 60)}% ${getRandom(60, 70)}% ${getRandom(60, 70)}% ${getRandom(50, 60)}%`
    // Add more variations if desired
  ]
  return values[Math.floor(Math.random() * values.length)]
}

function getRandom(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1) + min)
}

function randomColor(): string {
  const colors = ['#3498db', '#e74c3c', '#f39c12', '#2ecc71', '#8e44ad'] // Example colors
  return colors[Math.floor(Math.random() * colors.length)]
}
</script>

<style>
@keyframes float {
  0% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-20px);
  }
  100% {
    transform: translateY(0px);
  }
}
</style>
