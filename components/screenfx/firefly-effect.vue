<!-- /components/content/screenfx/firefly-effect.vue -->
<template>
  <canvas ref="canvasRef" class="effect-canvas" />
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'

interface Firefly {
  x: number
  y: number
  vx: number
  vy: number
  phase: number
  r: number
  hue: number
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

  const makeFlies = (): Firefly[] =>
    Array.from({ length: 48 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.7,
      vy: (Math.random() - 0.5) * 0.7,
      phase: Math.random() * Math.PI * 2,
      r: 1.5 + Math.random() * 2,
      hue: 35 + Math.random() * 55,
    }))

  let flies = makeFlies()

  const tick = () => {
    const w = canvas.width,
      h = canvas.height
    ctx.fillStyle = 'rgba(0,6,0,0.1)'
    ctx.fillRect(0, 0, w, h)

    for (const f of flies) {
      f.phase += 0.025
      f.vx += (Math.random() - 0.5) * 0.08
      f.vy += (Math.random() - 0.5) * 0.08
      f.vx *= 0.98
      f.vy *= 0.98
      f.x += f.vx
      f.y += f.vy
      if (f.x < 0) f.x = w
      if (f.x > w) f.x = 0
      if (f.y < 0) f.y = h
      if (f.y > h) f.y = 0

      const a = Math.sin(f.phase) * 0.45 + 0.55
      const glowR = f.r * 9
      const g = ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, glowR)
      g.addColorStop(0, `hsla(${f.hue},100%,75%,${a})`)
      g.addColorStop(1, `hsla(${f.hue},100%,50%,0)`)
      ctx.beginPath()
      ctx.fillStyle = g
      ctx.arc(f.x, f.y, glowR, 0, Math.PI * 2)
      ctx.fill()

      ctx.beginPath()
      ctx.fillStyle = `hsla(${f.hue},100%,96%,${a})`
      ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2)
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
