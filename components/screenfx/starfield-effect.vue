<!-- /components/content/screenfx/starfield-effect.vue -->
<template>
  <canvas ref="canvasRef" class="effect-canvas" />
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'

interface Star {
  x: number
  y: number
  z: number
  pz: number
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

  const W = () => canvas.width
  const H = () => canvas.height

  const stars: Star[] = Array.from({ length: 220 }, () => ({
    x: (Math.random() - 0.5) * W() * 2,
    y: (Math.random() - 0.5) * H() * 2,
    z: Math.random() * W() * 0.9 + W() * 0.1,
    pz: W(),
  }))

  const tick = () => {
    const w = W(),
      h = H(),
      cx = w / 2,
      cy = h / 2
    ctx.fillStyle = 'rgba(0,0,12,0.2)'
    ctx.fillRect(0, 0, w, h)

    for (const s of stars) {
      s.pz = s.z
      s.z -= 5
      if (s.z <= 1) {
        s.x = (Math.random() - 0.5) * w * 2
        s.y = (Math.random() - 0.5) * h * 2
        s.z = w
        s.pz = w
      }
      const t = 1 - s.z / w
      const b = Math.floor(t * 220 + 35)
      const sx = (s.x / s.z) * w + cx
      const sy = (s.y / s.z) * h + cy
      const px = (s.x / s.pz) * w + cx
      const py = (s.y / s.pz) * h + cy
      ctx.strokeStyle = `rgb(${b},${b},${b})`
      ctx.lineWidth = t * 2.5 + 0.2
      ctx.beginPath()
      ctx.moveTo(px, py)
      ctx.lineTo(sx, sy)
      ctx.stroke()
    }

    rafId = requestAnimationFrame(tick)
  }

  ctx.fillStyle = '#00000c'
  ctx.fillRect(0, 0, W(), H())
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
