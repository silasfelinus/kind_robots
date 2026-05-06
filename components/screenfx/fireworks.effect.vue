<!-- /components/content/screenfx/fireworks-effect.vue -->
<template>
  <canvas ref="canvasRef" class="effect-canvas" />
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Rocket {
  x: number
  y: number
  vx: number
  vy: number
  targetY: number
  hue: number
  trail: { x: number; y: number; a: number }[]
  exploded: boolean
}

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  life: number // 0–1, counts down
  decay: number // life lost per frame
  hue: number
  sat: number
  size: number
  gravity: number
  twinkle: number // phase offset for shimmer
  type: 'spark' | 'star' | 'flare' | 'glitter'
}

interface Chrysanthemum {
  // A second-generation burst that fires from dying particles
  x: number
  y: number
  hue: number
  fired: boolean
}

// ─── Canvas setup ─────────────────────────────────────────────────────────────

const canvasRef = ref<HTMLCanvasElement | null>(null)
let rafId: number | null = null

// ─── Helpers ──────────────────────────────────────────────────────────────────

const rand = (min: number, max: number) => min + Math.random() * (max - min)
const randInt = (min: number, max: number) => Math.floor(rand(min, max + 1))

// Returns [r,g,b] from hsl
function hsl(h: number, s: number, l: number, a = 1) {
  return `hsla(${h},${s}%,${l}%,${a})`
}

// ─── Burst shapes ─────────────────────────────────────────────────────────────

type BurstStyle =
  | 'chrysanthemum'
  | 'peony'
  | 'ring'
  | 'willow'
  | 'crossette'
  | 'glitter'
  | 'comet'

function createBurst(
  particles: Particle[],
  x: number,
  y: number,
  hue: number,
  style: BurstStyle,
) {
  const count =
    style === 'ring'
      ? 48
      : style === 'willow'
        ? 80
        : style === 'glitter'
          ? 120
          : 72
  const speed = style === 'willow' ? rand(1.5, 4) : rand(3, 8)

  for (let i = 0; i < count; i++) {
    const angle =
      style === 'ring' ? (i / count) * Math.PI * 2 : Math.random() * Math.PI * 2

    const spd =
      style === 'ring'
        ? speed + rand(-0.3, 0.3)
        : style === 'chrysanthemum'
          ? rand(2, 7)
          : rand(speed * 0.4, speed)

    const hueShift =
      style === 'glitter' ? hue + rand(-40, 40) : hue + rand(-12, 12)

    let type: Particle['type'] = 'spark'
    if (style === 'peony') type = 'star'
    if (style === 'glitter') type = 'glitter'
    if (style === 'comet') type = i % 3 === 0 ? 'flare' : 'spark'

    particles.push({
      x,
      y,
      vx: Math.cos(angle) * spd,
      vy: Math.sin(angle) * spd,
      life: 1,
      decay:
        style === 'willow'
          ? rand(0.005, 0.009)
          : style === 'glitter'
            ? rand(0.012, 0.025)
            : rand(0.008, 0.018),
      hue: hueShift,
      sat: style === 'glitter' ? rand(60, 100) : rand(80, 100),
      size:
        style === 'glitter'
          ? rand(1, 2.5)
          : style === 'peony'
            ? rand(2.5, 4)
            : rand(1.5, 3),
      gravity: style === 'willow' ? 0.06 : style === 'peony' ? 0.03 : 0.045,
      twinkle: Math.random() * Math.PI * 2,
      type,
    })
  }
}

// ─── Main ─────────────────────────────────────────────────────────────────────

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

  const rockets: Rocket[] = []
  const particles: Particle[] = []
  const secondaries: Chrysanthemum[] = []

  let frame = 0
  let flashAlpha = 0

  const STYLES: BurstStyle[] = [
    'chrysanthemum',
    'peony',
    'ring',
    'willow',
    'crossette',
    'glitter',
    'comet',
  ]
  const HUES = [0, 30, 55, 120, 180, 210, 270, 300, 340]

  const launchRocket = () => {
    const w = canvas.width,
      h = canvas.height
    const x = rand(w * 0.1, w * 0.9)
    const targetY = rand(h * 0.1, h * 0.45)
    const hue = HUES[randInt(0, HUES.length - 1)]!
    const vx = rand(-1.2, 1.2)
    const vy = -rand(12, 18)

    rockets.push({ x, y: h, vx, vy, targetY, hue, trail: [], exploded: false })
  }

  const explode = (rocket: Rocket) => {
    const style = STYLES[randInt(0, STYLES.length - 1)]!
    createBurst(particles, rocket.x, rocket.y, rocket.hue, style)

    // Flash on large bursts
    if (style === 'peony' || style === 'chrysanthemum') {
      flashAlpha = Math.max(flashAlpha, 0.06)
    }

    // 20% chance of a double burst
    if (Math.random() > 0.8) {
      setTimeout(() => {
        createBurst(
          particles,
          rocket.x + rand(-30, 30),
          rocket.y + rand(-20, 20),
          (rocket.hue + 150) % 360,
          STYLES[randInt(0, STYLES.length - 1)]!,
        )
      }, 120)
    }
  }

  // Click/tap to launch a rocket from that position
  const onClick = (e: MouseEvent) => {
    const rect = canvas.getBoundingClientRect()
    // Fire a burst directly at cursor
    const hue = HUES[randInt(0, HUES.length - 1)]!
    const style = STYLES[randInt(0, STYLES.length - 1)]!
    createBurst(
      particles,
      e.clientX - rect.left,
      e.clientY - rect.top,
      hue,
      style,
    )
    flashAlpha = Math.max(flashAlpha, 0.05)
  }

  // Note: canvas has pointer-events: none, so we attach click to window
  // and re-enable pointer events only for click passthrough tracking
  window.addEventListener('click', onClick)

  let nextLaunch = rand(600, 1200)
  let lastTime = performance.now()

  const tick = (now: number) => {
    const dt = now - lastTime
    lastTime = now
    nextLaunch -= dt

    const w = canvas.width,
      h = canvas.height

    // Fade trail
    ctx.fillStyle = `rgba(0,0,8,0.22)`
    ctx.fillRect(0, 0, w, h)

    // Screen flash
    if (flashAlpha > 0) {
      ctx.fillStyle = `rgba(255,240,200,${flashAlpha})`
      ctx.fillRect(0, 0, w, h)
      flashAlpha = Math.max(0, flashAlpha - 0.004)
    }

    // Launch rockets
    if (nextLaunch <= 0) {
      const count = Math.random() > 0.7 ? 2 : 1
      for (let i = 0; i < count; i++) launchRocket()
      nextLaunch = rand(700, 2200)
    }

    // Update & draw rockets
    for (let i = rockets.length - 1; i >= 0; i--) {
      const r = rockets[i]!
      r.vy += 0.3 // gravity slowing ascent
      r.x += r.vx
      r.y += r.vy

      r.trail.push({ x: r.x, y: r.y, a: 1 })
      if (r.trail.length > 12) r.trail.shift()

      // Draw trail
      for (let t = 0; t < r.trail.length - 1; t++) {
        const pt = r.trail[t]!
        const alpha = (t / r.trail.length) * 0.7
        ctx.beginPath()
        ctx.arc(pt.x, pt.y, 1.5 * (t / r.trail.length), 0, Math.PI * 2)
        ctx.fillStyle = hsl(r.hue, 80, 80, alpha)
        ctx.fill()
      }

      // Rocket head
      ctx.beginPath()
      ctx.arc(r.x, r.y, 2.5, 0, Math.PI * 2)
      ctx.fillStyle = hsl(r.hue, 90, 90)
      ctx.fill()

      if (r.y <= r.targetY && !r.exploded) {
        r.exploded = true
        explode(r)
        rockets.splice(i, 1)
      } else if (r.y > h + 20) {
        rockets.splice(i, 1)
      }
    }

    // Update & draw particles
    frame++
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i]!
      p.life -= p.decay
      if (p.life <= 0) {
        particles.splice(i, 1)
        continue
      }

      p.vx *= 0.985
      p.vy *= 0.985
      p.vy += p.gravity
      p.x += p.vx
      p.y += p.vy
      p.twinkle += 0.15

      const shimmer =
        p.type === 'glitter'
          ? Math.abs(Math.sin(p.twinkle))
          : p.type === 'star'
            ? 0.7 + Math.sin(p.twinkle) * 0.3
            : 1

      const alpha = p.life * shimmer
      const lum = p.type === 'flare' ? 80 : 65

      if (p.type === 'star') {
        // 4-point star shape
        const s = p.size * p.life * 1.5
        ctx.save()
        ctx.translate(p.x, p.y)
        ctx.rotate(p.twinkle)
        ctx.beginPath()
        for (let pt = 0; pt < 4; pt++) {
          const a = (pt / 4) * Math.PI * 2
          const b = a + Math.PI / 4
          ctx.lineTo(Math.cos(a) * s, Math.sin(a) * s)
          ctx.lineTo(Math.cos(b) * s * 0.4, Math.sin(b) * s * 0.4)
        }
        ctx.closePath()
        ctx.fillStyle = hsl(p.hue, p.sat, lum, alpha)
        ctx.fill()
        ctx.restore()
      } else if (p.type === 'flare') {
        // Long comet-tail shape
        const tailLen = p.size * 6 * p.life
        const angle = Math.atan2(p.vy, p.vx) + Math.PI
        const g = ctx.createLinearGradient(
          p.x,
          p.y,
          p.x + Math.cos(angle) * tailLen,
          p.y + Math.sin(angle) * tailLen,
        )
        g.addColorStop(0, hsl(p.hue, p.sat, 90, alpha))
        g.addColorStop(1, hsl(p.hue, p.sat, 60, 0))
        ctx.beginPath()
        ctx.moveTo(p.x, p.y)
        ctx.lineTo(
          p.x + Math.cos(angle) * tailLen,
          p.y + Math.sin(angle) * tailLen,
        )
        ctx.strokeStyle = g
        ctx.lineWidth = p.size * p.life * 0.8
        ctx.lineCap = 'round'
        ctx.stroke()
      } else {
        // Default spark / glitter
        const r = p.size * p.life * shimmer
        ctx.beginPath()
        ctx.arc(p.x, p.y, Math.max(0.3, r), 0, Math.PI * 2)
        ctx.fillStyle = hsl(p.hue, p.sat, lum, alpha)
        ctx.fill()
      }

      // Crossette: particles spawn mini-bursts when they start dying
      if (
        p.type === 'spark' &&
        p.life < 0.35 &&
        p.life > 0.3 &&
        Math.random() > 0.94
      ) {
        for (let k = 0; k < 4; k++) {
          const a = Math.random() * Math.PI * 2
          particles.push({
            x: p.x,
            y: p.y,
            vx: Math.cos(a) * rand(1, 2.5),
            vy: Math.sin(a) * rand(1, 2.5),
            life: 0.6,
            decay: 0.025,
            hue: (p.hue + 30) % 360,
            sat: 100,
            size: p.size * 0.7,
            gravity: 0.03,
            twinkle: Math.random() * Math.PI * 2,
            type: 'glitter',
          })
        }
      }
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
