<!-- /components/content/screenfx/snow-effect.vue -->
<template>
  <canvas ref="canvasRef" class="effect-canvas" />
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'

interface Flake {
  x: number
  y: number
  r: number
  speed: number
  drift: number
  phase: number
  a: number
}

const canvasRef = ref<HTMLCanvasElement | null>(null)
let rafId: number | null = null

onMounted(() => {
  const canvas = canvasRef.value
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const resize = () => {
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight
  }
  resize()
  window.addEventListener('resize', resize)

  const makeFlakes = (): Flake[] =>
    Array.from({ length: 140 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: 0.5 + Math.random() * 2.5,
      speed: 0.4 + Math.random() * 1.2,
      drift: (Math.random() - 0.5) * 0.4,
      phase: Math.random() * Math.PI * 2,
      a: 0.3 + Math.random() * 0.7,
    }))

  const flakes = makeFlakes()

  const tick = () => {
    const w = canvas.width,
      h = canvas.height
    ctx.clearRect(0, 0, w, h)

    for (const f of flakes) {
      f.phase += 0.018
      f.x += f.drift + Math.sin(f.phase) * 0.4
      f.y += f.speed
      if (f.y > h) {
        f.y = 0
        f.x = Math.random() * w
      }
      if (f.x < 0) f.x = w
      if (f.x > w) f.x = 0

      ctx.beginPath()
      ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2)
      ctx.fillStyle = `rgba(210,228,255,${f.a})`
      ctx.fill()
    }

    rafId = requestAnimationFrame(tick)
  }

  tick()

  onBeforeUnmount(() => {
    if (rafId) cancelAnimationFrame(rafId)
    window.removeEventListener('resize', resize)
  })
})
</script>

<style scoped>
.effect-canvas {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  pointer-events: none;
  z-index: 50;
}
</style>
