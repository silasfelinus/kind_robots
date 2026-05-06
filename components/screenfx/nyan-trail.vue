<!-- /components/content/screenfx/nyan-trail.vue -->
<template>
  <canvas ref="canvasRef" class="effect-canvas" />
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  hue: number
  life: number
  maxLife: number
  r: number
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

  const particles: Particle[] = []
  let hueShift = 0
  let mouseX = -999,
    mouseY = -999

  const onMove = (e: MouseEvent) => {
    mouseX = e.clientX
    mouseY = e.clientY
    for (let i = 0; i < 5; i++) {
      hueShift = (hueShift + 12) % 360
      particles.push({
        x: mouseX + (Math.random() - 0.5) * 8,
        y: mouseY + (Math.random() - 0.5) * 8,
        vx: (Math.random() - 0.5) * 1.5,
        vy: (Math.random() - 0.5) * 1.5 - 0.5,
        hue: hueShift,
        life: 1,
        maxLife: 0.6 + Math.random() * 0.5,
        r: 3 + Math.random() * 4,
      })
    }
  }

  window.addEventListener('mousemove', onMove)

  const tick = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i]!
      p.life -= 0.018 / p.maxLife
      if (p.life <= 0) {
        particles.splice(i, 1)
        continue
      }

      p.x += p.vx
      p.y += p.vy
      p.vx *= 0.97
      p.vy *= 0.97

      const a = p.life * 0.9
      ctx.beginPath()
      ctx.arc(p.x, p.y, p.r * p.life, 0, Math.PI * 2)
      ctx.fillStyle = `hsla(${p.hue},100%,65%,${a})`
      ctx.fill()

      // sparkle core
      ctx.beginPath()
      ctx.arc(p.x, p.y, p.r * 0.35 * p.life, 0, Math.PI * 2)
      ctx.fillStyle = `hsla(${p.hue},100%,95%,${a * 0.8})`
      ctx.fill()
    }

    rafId = requestAnimationFrame(tick)
  }

  tick()

  onBeforeUnmount(() => {
    if (rafId) cancelAnimationFrame(rafId)
    window.removeEventListener('resize', resize)
    window.removeEventListener('mousemove', onMove)
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
