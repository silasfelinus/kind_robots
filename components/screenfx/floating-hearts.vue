<!-- /components/content/screenfx/floating-hearts.vue -->
<template>
  <canvas ref="canvasRef" class="effect-canvas" />
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Heart {
  x: number
  y: number
  vy: number // upward velocity (negative = up)
  vx: number // gentle lateral drift
  size: number
  life: number // 0 → 1, counts up
  maxLife: number // total lifespan in frames
  phase: number // wobble offset
  wobbleSpeed: number
  wobbleAmp: number
  hue: number // 0=red, 340=pink, 280=purple, 30=orange
  sat: number
  lum: number
  type: 'solid' | 'outline' | 'sparkle'
  rotation: number
  rotationSpeed: number
  scale: number // for pop-in animation
}

interface Sparkle {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  hue: number
  size: number
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const rand = (a: number, b: number) => a + Math.random() * (b - a)
const randInt = (a: number, b: number) => Math.floor(rand(a, b + 1))

// Draw a heart centered at (0,0) with given size
function drawHeart(ctx: CanvasRenderingContext2D, size: number) {
  const s = size * 0.5
  ctx.beginPath()
  ctx.moveTo(0, s * 0.4)
  ctx.bezierCurveTo(s, -s * 0.2, s * 1.4, s * 0.9, 0, s * 1.6)
  ctx.bezierCurveTo(-s * 1.4, s * 0.9, -s, -s * 0.2, 0, s * 0.4)
  ctx.closePath()
}

// ─── Config ───────────────────────────────────────────────────────────────────

// Warm palette: red, rose, pink, coral, lavender, peach
const HEART_HUES = [0, 340, 320, 15, 280, 25]
const MAX_HEARTS = 38
const SPAWN_INTERVAL = 42 // frames between ambient spawns

// ─── Component ────────────────────────────────────────────────────────────────

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

  const hearts: Heart[] = []
  const sparkles: Sparkle[] = []
  let frame = 0

  // ── Factory ────────────────────────────────────────────────────────────────

  const spawnHeart = (x?: number, y?: number, forced = false): Heart => {
    const hue = HEART_HUES[randInt(0, HEART_HUES.length - 1)]!
    const size = forced ? rand(12, 28) : rand(8, 52)
    const type: Heart['type'] =
      Math.random() > 0.75
        ? 'outline'
        : Math.random() > 0.88
          ? 'sparkle'
          : 'solid'

    return {
      x: x ?? rand(canvas.width * 0.05, canvas.width * 0.95),
      y: y ?? canvas.height + size,
      vy: -rand(0.6, 2.0),
      vx: rand(-0.4, 0.4),
      size,
      life: 0,
      maxLife: rand(180, 340),
      phase: rand(0, Math.PI * 2),
      wobbleSpeed: rand(0.018, 0.038),
      wobbleAmp: rand(0.3, 1.1),
      hue,
      sat: rand(75, 100),
      lum: type === 'outline' ? rand(65, 80) : rand(58, 72),
      type,
      rotation: rand(-15, 15),
      rotationSpeed: rand(-0.4, 0.4),
      scale: 0,
    }
  }

  const burstHearts = (x: number, y: number) => {
    const count = randInt(6, 12)
    for (let i = 0; i < count; i++) {
      const h = spawnHeart(x, y, true)
      const angle = rand(0, Math.PI * 2)
      const speed = rand(1.5, 5)
      h.vx = Math.cos(angle) * speed
      h.vy = Math.sin(angle) * speed - rand(1, 3)
      hearts.push(h)
    }
    // Sparkle burst
    for (let i = 0; i < 16; i++) {
      const angle = rand(0, Math.PI * 2)
      const speed = rand(1, 4)
      sparkles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1,
        hue: HEART_HUES[randInt(0, HEART_HUES.length - 1)]!,
        size: rand(1.5, 4),
      })
    }
  }

  // ── Click handler (on window, canvas stays pointer-events:none) ────────────

  const onClick = (e: MouseEvent) => burstHearts(e.clientX, e.clientY)
  window.addEventListener('click', onClick)

  // ── Draw ───────────────────────────────────────────────────────────────────

  const drawSingleHeart = (h: Heart) => {
    const progress = h.life / h.maxLife
    // Fade in first 8%, fade out last 20%
    const fadeIn = Math.min(1, h.life / (h.maxLife * 0.08))
    const fadeOut = progress > 0.8 ? 1 - (progress - 0.8) / 0.2 : 1
    const alpha = fadeIn * fadeOut

    if (alpha <= 0) return

    const wobbleX =
      Math.sin(h.phase + h.life * h.wobbleSpeed) * h.wobbleAmp * h.size * 0.15
    const px = h.x + wobbleX
    const py = h.y

    // Pop-in scale
    h.scale = Math.min(1, h.scale + 0.08)
    const displaySize = h.size * h.scale

    ctx.save()
    ctx.translate(px, py)
    ctx.rotate((h.rotation * Math.PI) / 180)
    ctx.scale(displaySize / 20, displaySize / 20) // normalize to size 20

    if (h.type === 'outline') {
      drawHeart(ctx, 20)
      ctx.strokeStyle = `hsla(${h.hue},${h.sat}%,${h.lum}%,${alpha * 0.9})`
      ctx.lineWidth = 2
      ctx.stroke()

      // Soft inner glow
      drawHeart(ctx, 20)
      ctx.fillStyle = `hsla(${h.hue},${h.sat}%,${h.lum + 15}%,${alpha * 0.12})`
      ctx.fill()
    } else if (h.type === 'sparkle') {
      // Filled heart with animated shimmer overlay
      drawHeart(ctx, 20)
      const grad = ctx.createLinearGradient(0, -8, 0, 14)
      grad.addColorStop(0, `hsla(${h.hue},${h.sat}%,${h.lum + 18}%,${alpha})`)
      grad.addColorStop(1, `hsla(${h.hue},${h.sat}%,${h.lum}%,${alpha})`)
      ctx.fillStyle = grad
      ctx.fill()

      // Moving shimmer streak
      const shimmerPos = ((h.life * 2) % h.maxLife) / h.maxLife
      const shimmerGrad = ctx.createLinearGradient(
        -14 + shimmerPos * 40,
        -14,
        -8 + shimmerPos * 40,
        14,
      )
      shimmerGrad.addColorStop(0, `hsla(0,0%,100%,0)`)
      shimmerGrad.addColorStop(0.5, `hsla(0,0%,100%,${alpha * 0.45})`)
      shimmerGrad.addColorStop(1, `hsla(0,0%,100%,0)`)
      drawHeart(ctx, 20)
      ctx.fillStyle = shimmerGrad
      ctx.fill()
    } else {
      // Solid heart with highlight
      drawHeart(ctx, 20)
      const grad = ctx.createRadialGradient(-4, -4, 0, 0, 2, 16)
      grad.addColorStop(0, `hsla(${h.hue},${h.sat}%,${h.lum + 20}%,${alpha})`)
      grad.addColorStop(1, `hsla(${h.hue},${h.sat}%,${h.lum - 8}%,${alpha})`)
      ctx.fillStyle = grad
      ctx.fill()
    }

    ctx.restore()
  }

  // ── Tick ───────────────────────────────────────────────────────────────────

  const tick = () => {
    const w = canvas.width,
      h = canvas.height
    ctx.clearRect(0, 0, w, h)
    frame++

    // Ambient spawn
    if (frame % SPAWN_INTERVAL === 0 && hearts.length < MAX_HEARTS) {
      hearts.push(spawnHeart())
      // Occasionally spawn a cluster of 2–3
      if (Math.random() > 0.72) hearts.push(spawnHeart())
      if (Math.random() > 0.88) hearts.push(spawnHeart())
    }

    // Update & draw sparkles
    for (let i = sparkles.length - 1; i >= 0; i--) {
      const s = sparkles[i]!
      s.life -= 0.035
      if (s.life <= 0) {
        sparkles.splice(i, 1)
        continue
      }
      s.x += s.vx
      s.vy += 0.08
      s.y += s.vy
      s.vx *= 0.95
      s.vy *= 0.95

      ctx.beginPath()
      ctx.arc(s.x, s.y, s.size * s.life, 0, Math.PI * 2)
      ctx.fillStyle = `hsla(${s.hue},90%,75%,${s.life * 0.9})`
      ctx.fill()

      // Crosshair sparkle shape
      const arm = s.size * s.life * 2.5
      ctx.strokeStyle = `hsla(${s.hue},90%,90%,${s.life * 0.6})`
      ctx.lineWidth = 0.8
      ctx.beginPath()
      ctx.moveTo(s.x - arm, s.y)
      ctx.lineTo(s.x + arm, s.y)
      ctx.moveTo(s.x, s.y - arm)
      ctx.lineTo(s.x, s.y + arm)
      ctx.stroke()
    }

    // Update & draw hearts
    for (let i = hearts.length - 1; i >= 0; i--) {
      const heart = hearts[i]!
      heart.life++
      heart.x += heart.vx
      heart.y += heart.vy
      heart.rotation += heart.rotationSpeed
      heart.vx *= 0.995
      // Subtle gravity resistance — hearts float, not fall
      heart.vy = Math.max(heart.vy, -2.5)

      if (heart.life >= heart.maxLife || heart.y < -heart.size * 2) {
        hearts.splice(i, 1)
        continue
      }

      drawSingleHeart(heart)
    }

    rafId = requestAnimationFrame(tick)
  }

  rafId = requestAnimationFrame(tick)

  onBeforeUnmount(() => {
    if (rafId) cancelAnimationFrame(rafId)
    window.removeEventListener('resize', resize)
    window.removeEventListener('click', onClick)
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
