<!-- /components/content/screenfx/constellation-effect.vue -->
<template>
  <canvas ref="canvasRef" class="effect-canvas" />
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'

interface Node {
  x: number
  y: number
  vx: number
  vy: number
  r: number
  a: number
}

const canvasRef = ref<HTMLCanvasElement | null>(null)
let rafId: number | null = null

const CONNECT_DIST = 160
const NODE_COUNT = 55

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

  const makeNodes = (): Node[] =>
    Array.from({ length: NODE_COUNT }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.35,
      vy: (Math.random() - 0.5) * 0.35,
      r: 1 + Math.random() * 1.5,
      a: 0.4 + Math.random() * 0.6,
    }))

  const nodes = makeNodes()

  const tick = () => {
    const w = canvas.width,
      h = canvas.height
    ctx.clearRect(0, 0, w, h)

    for (const n of nodes) {
      n.x += n.vx
      n.y += n.vy
      if (n.x < 0 || n.x > w) n.vx *= -1
      if (n.y < 0 || n.y > h) n.vy *= -1

      ctx.beginPath()
      ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2)
      ctx.fillStyle = `rgba(180,210,255,${n.a})`
      ctx.fill()
    }

    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const a = nodes[i]!,
          b = nodes[j]!
        const dx = a.x - b.x,
          dy = a.y - b.y
        const dist = Math.sqrt(dx * dx + dy * dy)
        if (dist < CONNECT_DIST) {
          const alpha = (1 - dist / CONNECT_DIST) * 0.35
          ctx.beginPath()
          ctx.moveTo(a.x, a.y)
          ctx.lineTo(b.x, b.y)
          ctx.strokeStyle = `rgba(160,200,255,${alpha})`
          ctx.lineWidth = 0.6
          ctx.stroke()
        }
      }
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
