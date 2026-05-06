<!-- /components/content/screenfx/plasma-effect.vue -->
<template>
  <canvas ref="canvasRef" class="effect-canvas" />
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'

const canvasRef = ref<HTMLCanvasElement | null>(null)
let rafId: number | null = null

// Render at reduced resolution for performance, scaled up
const SCALE = 6

onMounted(() => {
  const canvas = canvasRef.value
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const resize = () => {
    canvas.width = Math.ceil(window.innerWidth / SCALE)
    canvas.height = Math.ceil(window.innerHeight / SCALE)
    canvas.style.width = window.innerWidth + 'px'
    canvas.style.height = window.innerHeight + 'px'
    ctx.imageSmoothingEnabled = false
  }
  resize()
  window.addEventListener('resize', resize)

  let t = 0
  const imageData = ctx.createImageData(canvas.width, canvas.height)
  const data = imageData.data

  const tick = () => {
    const w = canvas.width,
      h = canvas.height
    t += 0.025

    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const v =
          Math.sin(x * 0.18 + t) +
          Math.sin(y * 0.12 + t * 0.8) +
          Math.sin((x + y) * 0.1 + t * 1.1) +
          Math.sin(Math.sqrt(x * x + y * y) * 0.15 + t * 0.9)

        const hue = (v * 40 + t * 20) % 360
        const [r, g, b] = hslToRgb(((hue % 360) + 360) % 360, 80, 55)
        const idx = (y * w + x) * 4
        data[idx] = r!
        data[idx + 1] = g!
        data[idx + 2] = b!
        data[idx + 3] = 80 // ~30% opacity — stays interactive-feeling
      }
    }

    ctx.putImageData(imageData, 0, 0)
    rafId = requestAnimationFrame(tick)
  }

  tick()

  onBeforeUnmount(() => {
    if (rafId) cancelAnimationFrame(rafId)
    window.removeEventListener('resize', resize)
  })
})

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  s /= 100
  l /= 100
  const k = (n: number) => (n + h / 30) % 12
  const a = s * Math.min(l, 1 - l)
  const f = (n: number) =>
    l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)))
  return [
    Math.round(f(0) * 255),
    Math.round(f(8) * 255),
    Math.round(f(4) * 255),
  ]
}
</script>

<style scoped>
.effect-canvas {
  position: fixed;
  top: 0;
  left: 0;
  image-rendering: pixelated;
  pointer-events: none;
  z-index: 50;
}
</style>
