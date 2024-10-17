<template>
  <canvas
    ref="butterflyCanvas"
    class="absolute inset-0"
    :style="{ height: canvasHeight, width: canvasWidth }"
  ></canvas>
</template>

<script setup lang="ts">
import { onMounted, ref, computed, watch } from 'vue'
import { useButterflyStore } from '@/stores/butterflyStore'
import { useDisplayStore } from '@/stores/displayStore'

const canvasRef = ref<HTMLCanvasElement | null>(null)
const butterflyStore = useButterflyStore()
const displayStore = useDisplayStore()

// Canvas size based on display store
const canvasHeight = computed(() => displayStore.centerHeight || '100vh')
const canvasWidth = computed(() => displayStore.centerWidth || '100vw')

// Render butterflies on canvas
const renderButterflies = () => {
  const canvas = canvasRef.value
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  // Clear canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height)

  // Draw each butterfly
  butterflyStore.butterflies.forEach(butterfly => {
    // Simple example: Draw circle representing butterfly
    ctx.save()
    ctx.translate(butterfly.x, butterfly.y)
    ctx.rotate(butterfly.rotation * (Math.PI / 180))
    ctx.scale(butterfly.scale, butterfly.scale)
    ctx.fillStyle = butterfly.wingTopColor
    ctx.beginPath()
    ctx.arc(0, 0, 20, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()
  })
}

// Watch for changes in butterflies and re-render
watch(
  () => butterflyStore.butterflies,
  renderButterflies,
  { deep: true }
)

onMounted(() => {
  // Initially render butterflies
  renderButterflies()
})
</script>

<style scoped>
canvas {
  position: absolute;
  left: 0;
  top: 0;
  z-index: 0;
}
</style>
