<!-- /components/content/screenfx/wishing-stars.vue -->
<template>
  <canvas ref="canvasRef" class="effect-canvas" />
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'

interface Star {
  x: number
  y: number
  vx: number
  vy: number
  len: number
  life: number
  maxLife: number
  hue: number
  width: number
  sparkles: Sparkle[]
}

interface Sparkle {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  hue: number
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

  const stars: Star[] = []
  const sparkles: Sparkle[] = []
  let nextSpawn = 2000 + Math.random() * 3000
  let elapsed = 0
  let lastTime = performance.now()

  const spawnStar = () => {
    const angle = Math.PI / 6 + Math.random() * (Math.PI / 6) // 30–60deg diagonal
    const speed = 8 + Math.random() * 7
    const hue =
      Math.random() > 0.5 ? 200 + Math.random() * 60 : 40 + Math.random() * 30
    stars.push({
      x: Math.random() * canvas.width * 0.7,
      y: Math.random() * canvas.height * 0.4,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      len: 80 + Math.random() * 120,
      life: 1,
      maxLife: 1.2 + Math.random() * 0.8,
      hue,
      width: 1.5 + Math.random() * 2,
      sparkles: [],
    })
  }

  const tick = (now: number) => {
    const dt = now - lastTime
    lastTime = now
    elapsed += dt
    const w = canvas.width,
      h = canvas.height

    ctx.clearRect(0, 0, w, h)

    if (elapsed >= nextSpawn) {
      elapsed = 0
      nextSpawn = 2500 + Math.random() * 4000
      const count = Math.random() > 0.6 ? 2 : 1
      for (let i = 0; i < count; i++) spawnStar()
    }

    // Sparkles
    for (let i = sparkles.length - 1; i >= 0; i--) {
      const s = sparkles[i]!
      s.life -= 0.03
      if (s.life <= 0) {
        sparkles.splice(i, 1)
        continue
      }
      s.x += s.vx
      s.y += s.vy
      s.vy += 0.05
      ctx.beginPath()
      ctx.arc(s.x, s.y, s.r * s.life, 0, Math.PI * 2)
      ctx.fillStyle = `hsla(${s.hue},100%,80%,${s.life * 0.8})`
      ctx.fill()
    }

    // Stars
    for (let i = stars.length - 1; i >= 0; i--) {
      const s = stars[i]!
      s.life -= 0.012 / s.maxLife
      if (s.life <= 0) {
        stars.splice(i, 1)
        continue
      }

      s.x += s.vx
      s.y += s.vy

      // Spawn sparkles along trail
      if (Math.random() > 0.5) {
        sparkles.push({
          x: s.x + (Math.random() - 0.5) * 4,
          y: s.y + (Math.random() - 0.5) * 4,
          vx: (Math.random() - 0.5) * 1.5,
          vy: -(Math.random() * 1.5),
          life: 0.8 + Math.random() * 0.4,
          hue: s.hue + (Math.random() - 0.5) * 40,
          r: 1 + Math.random() * 2,
        })
      }

      const tailX = s.x - s.vx * (s.len / Math.sqrt(s.vx ** 2 + s.vy ** 2))
      const tailY = s.y - s.vy * (s.len / Math.sqrt(s.vx ** 2 + s.vy ** 2))

      const grad = ctx.createLinearGradient(tailX, tailY, s.x, s.y)
      grad.addColorStop(0, `hsla(${s.hue},100%,75%,0)`)
      grad.addColorStop(0.7, `hsla(${s.hue},100%,80%,${s.life * 0.6})`)
      grad.addColorStop(1, `hsla(${s.hue},100%,95%,${s.life})`)
      ctx.beginPath()
      ctx.moveTo(tailX, tailY)
      ctx.lineTo(s.x, s.y)
      ctx.strokeStyle = grad
      ctx.lineWidth = s.width * s.life
      ctx.lineCap = 'round'
      ctx.stroke()

      // Head glow
      const g = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, 8)
      g.addColorStop(0, `hsla(${s.hue},100%,98%,${s.life})`)
      g.addColorStop(1, `hsla(${s.hue},100%,75%,0)`)
      ctx.beginPath()
      ctx.arc(s.x, s.y, 8, 0, Math.PI * 2)
      ctx.fillStyle = g
      ctx.fill()
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
