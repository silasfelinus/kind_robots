<!-- /components/content/screenfx/lightning-effect.vue -->
<template>
  <canvas ref="canvasRef" class="effect-canvas" />
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'

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

  let lastStrike = 0
  let nextInterval = 1800 + Math.random() * 2400

  const branch = (
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    w: number,
    depth: number,
  ) => {
    if (depth > 7 || w < 0.25) return
    const span = Math.abs(x2 - x1) + Math.abs(y2 - y1)
    const mx = (x1 + x2) / 2 + (Math.random() - 0.5) * span * 0.55
    const my = (y1 + y2) / 2 + (Math.random() - 0.5) * span * 0.55
    const r = 160 + Math.floor(Math.random() * 70)
    const g = 130 + Math.floor(Math.random() * 80)
    ctx.strokeStyle = `rgba(${r},${g},255,${Math.min(1, w * 0.6)})`
    ctx.lineWidth = w
    ctx.beginPath()
    ctx.moveTo(x1, y1)
    ctx.lineTo(mx, my)
    ctx.lineTo(x2, y2)
    ctx.stroke()
    branch(x1, y1, mx, my, w * 0.66, depth + 1)
    branch(mx, my, x2, y2, w * 0.66, depth + 1)
    if (Math.random() > 0.55) {
      branch(
        mx,
        my,
        mx + (Math.random() - 0.5) * 120,
        my + Math.random() * 80,
        w * 0.38,
        depth + 2,
      )
    }
  }

  const strike = () => {
    const w = canvas.width,
      h = canvas.height
    ctx.clearRect(0, 0, w, h)
    const count = 1 + Math.floor(Math.random() * 2)
    for (let i = 0; i < count; i++) {
      const x = w * 0.1 + Math.random() * w * 0.8
      ctx.shadowColor = 'rgba(140,100,255,0.6)'
      ctx.shadowBlur = 18
      branch(x, 0, x + (Math.random() - 0.5) * 200, h, 3.5, 0)
      ctx.shadowBlur = 0
    }
    // Screen flash
    ctx.fillStyle = 'rgba(180,160,255,0.06)'
    ctx.fillRect(0, 0, w, h)
  }

  const tick = (t: number) => {
    ctx.fillStyle = 'rgba(0,0,18,0.07)'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    if (t - lastStrike > nextInterval) {
      lastStrike = t
      nextInterval = 1800 + Math.random() * 2400
      strike()
    }

    rafId = requestAnimationFrame(tick)
  }

  rafId = requestAnimationFrame(tick)

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
