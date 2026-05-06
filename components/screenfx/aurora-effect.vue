<!-- /components/content/screenfx/aurora-effect.vue -->
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

  let t = 0

  const BANDS = [
    { hue: 150, offset: 0.0, speed: 0.0004, amp: 0.08, y: 0.18 },
    { hue: 190, offset: 1.2, speed: 0.0003, amp: 0.06, y: 0.28 },
    { hue: 270, offset: 2.5, speed: 0.0005, amp: 0.07, y: 0.22 },
    { hue: 120, offset: 0.8, speed: 0.00035, amp: 0.05, y: 0.32 },
    { hue: 310, offset: 3.1, speed: 0.00045, amp: 0.06, y: 0.14 },
  ]

  const tick = () => {
    const w = canvas.width,
      h = canvas.height
    ctx.clearRect(0, 0, w, h)
    t++

    for (const band of BANDS) {
      const baseY = band.y * h
      const hue = (band.hue + t * 0.05) % 360

      ctx.beginPath()
      ctx.moveTo(0, h)

      for (let x = 0; x <= w; x += 4) {
        const wave =
          Math.sin(x * 0.005 + t * band.speed * 1000 + band.offset) *
            band.amp *
            h +
          Math.sin(x * 0.012 + t * band.speed * 700 + band.offset * 1.3) *
            band.amp *
            0.5 *
            h
        ctx.lineTo(x, baseY + wave)
      }

      ctx.lineTo(w, 0)
      ctx.lineTo(0, 0)
      ctx.closePath()

      const grad = ctx.createLinearGradient(0, 0, 0, h * 0.5)
      grad.addColorStop(0, `hsla(${hue},90%,65%,0)`)
      grad.addColorStop(0.4, `hsla(${hue},90%,65%,0.13)`)
      grad.addColorStop(1, `hsla(${hue},90%,65%,0)`)
      ctx.fillStyle = grad
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
