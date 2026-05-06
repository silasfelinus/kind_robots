<!-- /components/content/screenfx/orbit-effect.vue -->
<template>
  <canvas ref="canvasRef" class="effect-canvas" />
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'

interface Orb {
  radius: number
  speed: number
  angle: number
  size: number
  hue: number
  trail: { x: number; y: number }[]
}

const canvasRef = ref<HTMLCanvasElement | null>(null)
let rafId: number | null = null

const TRAIL_LEN = 28

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

  const cx = () => canvas.width / 2
  const cy = () => canvas.height / 2

  const ORBS: Orb[] = [
    { radius: 60, speed: 0.022, angle: 0, size: 5, hue: 200, trail: [] },
    { radius: 110, speed: 0.014, angle: 1.0, size: 7, hue: 280, trail: [] },
    { radius: 170, speed: 0.009, angle: 2.1, size: 5, hue: 150, trail: [] },
    { radius: 240, speed: 0.006, angle: 0.5, size: 9, hue: 40, trail: [] },
    { radius: 320, speed: 0.004, angle: 3.4, size: 6, hue: 330, trail: [] },
    { radius: 85, speed: -0.018, angle: 1.8, size: 4, hue: 90, trail: [] },
    { radius: 145, speed: -0.011, angle: 0.3, size: 5, hue: 180, trail: [] },
  ]

  const tick = () => {
    const w = canvas.width,
      h = canvas.height
    ctx.clearRect(0, 0, w, h)
    const ox = cx(),
      oy = cy()

    // Center glow
    const cg = ctx.createRadialGradient(ox, oy, 0, ox, oy, 18)
    cg.addColorStop(0, 'rgba(255,240,200,0.6)')
    cg.addColorStop(1, 'rgba(255,200,80,0)')
    ctx.beginPath()
    ctx.arc(ox, oy, 18, 0, Math.PI * 2)
    ctx.fillStyle = cg
    ctx.fill()

    // Orbit rings
    ctx.strokeStyle = 'rgba(255,255,255,0.04)'
    ctx.lineWidth = 1
    for (const orb of ORBS) {
      ctx.beginPath()
      ctx.arc(ox, oy, orb.radius, 0, Math.PI * 2)
      ctx.stroke()
    }

    for (const orb of ORBS) {
      orb.angle += orb.speed
      const x = ox + Math.cos(orb.angle) * orb.radius
      const y = oy + Math.sin(orb.angle) * orb.radius

      orb.trail.push({ x, y })
      if (orb.trail.length > TRAIL_LEN) orb.trail.shift()

      // Trail
      for (let i = 0; i < orb.trail.length - 1; i++) {
        const a = (i / TRAIL_LEN) * 0.4
        ctx.beginPath()
        ctx.moveTo(orb.trail[i]!.x, orb.trail[i]!.y)
        ctx.lineTo(orb.trail[i + 1]!.x, orb.trail[i + 1]!.y)
        ctx.strokeStyle = `hsla(${orb.hue},90%,70%,${a})`
        ctx.lineWidth = orb.size * (i / TRAIL_LEN)
        ctx.stroke()
      }

      // Orb glow
      const g = ctx.createRadialGradient(x, y, 0, x, y, orb.size * 2.5)
      g.addColorStop(0, `hsla(${orb.hue},100%,85%,0.9)`)
      g.addColorStop(1, `hsla(${orb.hue},100%,60%,0)`)
      ctx.beginPath()
      ctx.arc(x, y, orb.size * 2.5, 0, Math.PI * 2)
      ctx.fillStyle = g
      ctx.fill()

      ctx.beginPath()
      ctx.arc(x, y, orb.size * 0.6, 0, Math.PI * 2)
      ctx.fillStyle = `hsla(${orb.hue},100%,95%,1)`
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
