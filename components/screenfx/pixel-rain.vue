<!-- /components/content/screenfx/pixel-rain.vue -->
<template>
  <canvas ref="canvasRef" class="effect-canvas" />
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'

interface Pixel {
  x: number
  y: number
  vy: number
  size: number
  hue: number
  settled: boolean
  settleY: number
  dissolveTimer: number
}

const canvasRef = ref<HTMLCanvasElement | null>(null)
let rafId: number | null = null

const PIXEL_SIZE = 10
const SPAWN_RATE = 3

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

  const pixels: Pixel[] = []
  // Track settled pixel heights per column
  const colHeights: Map<number, number> = new Map()

  const colX = (x: number) => Math.floor(x / PIXEL_SIZE) * PIXEL_SIZE

  const spawnPixel = () => {
    const col =
      Math.floor(Math.random() * Math.ceil(canvas.width / PIXEL_SIZE)) *
      PIXEL_SIZE
    pixels.push({
      x: col,
      y: -PIXEL_SIZE,
      vy: 2 + Math.random() * 3,
      size: PIXEL_SIZE,
      hue: Math.floor(Math.random() * 360),
      settled: false,
      settleY: colHeights.get(col) ?? canvas.height - PIXEL_SIZE,
      dissolveTimer: 0,
    })
  }

  let frame = 0

  const tick = () => {
    const w = canvas.width,
      h = canvas.height
    ctx.clearRect(0, 0, w, h)
    frame++

    if (frame % Math.floor(60 / SPAWN_RATE) === 0) spawnPixel()

    for (let i = pixels.length - 1; i >= 0; i--) {
      const p = pixels[i]!

      if (p.settled) {
        p.dissolveTimer++
        const alpha = Math.max(0, 1 - p.dissolveTimer / 120)
        if (alpha <= 0) {
          // free up the column height
          const cur = colHeights.get(p.x)
          if (cur !== undefined && cur === p.y)
            colHeights.set(p.x, p.y + PIXEL_SIZE)
          pixels.splice(i, 1)
          continue
        }
        ctx.fillStyle = `hsla(${p.hue},80%,60%,${alpha})`
        ctx.fillRect(p.x, p.y, p.size - 1, p.size - 1)
      } else {
        p.y += p.vy
        const settled = colHeights.get(p.x) ?? h
        if (p.y + PIXEL_SIZE >= settled) {
          p.y = settled - PIXEL_SIZE
          p.settled = true
          colHeights.set(p.x, p.y)
        }
        const brightness = 50 + Math.random() * 20
        ctx.fillStyle = `hsla(${p.hue},90%,${brightness}%,0.9)`
        ctx.fillRect(p.x, p.y, p.size - 1, p.size - 1)
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
