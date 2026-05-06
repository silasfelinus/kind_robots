<!-- /components/content/screenfx/ripple-effect.vue -->
<template>
  <canvas ref="canvasRef" class="effect-canvas" />
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Ripple {
  x: number
  y: number
  radius: number
  maxRadius: number
  life: number // 1 → 0
  decay: number
  hue: number
  speed: number
  type: 'cursor' | 'drip' | 'splash'
  rings: number // concentric ring count
}

interface Droplet {
  // Ambient drip that falls from top and splashes
  x: number
  y: number
  vy: number
  life: number
  splashed: boolean
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const rand = (min: number, max: number) => min + Math.random() * (max - min)

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

  const ripples: Ripple[] = []
  const droplets: Droplet[] = []

  // ── Ripple factory ──────────────────────────────────────────────────────────

  const spawnRipple = (
    x: number,
    y: number,
    type: Ripple['type'] = 'cursor',
  ) => {
    const configs = {
      cursor: {
        maxRadius: rand(80, 160),
        decay: rand(0.006, 0.01),
        speed: rand(2.5, 4.5),
        hue: rand(180, 230),
        rings: randInt(2, 4),
      },
      drip: {
        maxRadius: rand(30, 70),
        decay: rand(0.01, 0.016),
        speed: rand(1.8, 3.2),
        hue: rand(190, 220),
        rings: randInt(1, 3),
      },
      splash: {
        maxRadius: rand(120, 220),
        decay: rand(0.004, 0.007),
        speed: rand(3.5, 6),
        hue: rand(160, 240),
        rings: randInt(3, 5),
      },
    }
    const cfg = configs[type]
    ripples.push({
      x,
      y,
      radius: 0,
      maxRadius: cfg.maxRadius,
      life: 1,
      decay: cfg.decay,
      hue: cfg.hue,
      speed: cfg.speed,
      type,
      rings: cfg.rings,
    })
  }

  const randInt = (min: number, max: number) => Math.floor(rand(min, max + 1))

  // ── Droplets ────────────────────────────────────────────────────────────────

  const spawnDroplet = () => {
    droplets.push({
      x: rand(0, canvas.width),
      y: rand(-40, -10),
      vy: rand(4, 9),
      life: 1,
      splashed: false,
    })
  }

  // ── Input ───────────────────────────────────────────────────────────────────

  let lastMouseX = -1
  let lastMouseY = -1
  let mouseMoveAccum = 0

  const onMouseMove = (e: MouseEvent) => {
    const dx = e.clientX - lastMouseX
    const dy = e.clientY - lastMouseY
    const dist = Math.sqrt(dx * dx + dy * dy)
    mouseMoveAccum += dist

    // Only spawn a ripple when the cursor has moved enough
    if (mouseMoveAccum > 60) {
      mouseMoveAccum = 0
      spawnRipple(e.clientX, e.clientY, 'cursor')
    }

    lastMouseX = e.clientX
    lastMouseY = e.clientY
  }

  const onMouseDown = (e: MouseEvent) => {
    spawnRipple(e.clientX, e.clientY, 'splash')
  }

  window.addEventListener('mousemove', onMouseMove)
  window.addEventListener('mousedown', onMouseDown)

  // ── Timers ──────────────────────────────────────────────────────────────────

  let nextDrip = rand(800, 2000)
  let lastTime = performance.now()

  // ── Draw helpers ────────────────────────────────────────────────────────────

  const drawRippleRing = (
    x: number,
    y: number,
    radius: number,
    alpha: number,
    hue: number,
    lineWidth: number,
  ) => {
    // Main ring
    ctx.beginPath()
    ctx.arc(x, y, radius, 0, Math.PI * 2)
    ctx.strokeStyle = `hsla(${hue},80%,75%,${alpha})`
    ctx.lineWidth = lineWidth
    ctx.stroke()

    // Inner shimmer highlight (slightly offset smaller ring)
    if (alpha > 0.08) {
      ctx.beginPath()
      ctx.arc(x, y, radius * 0.88, 0, Math.PI * 2)
      ctx.strokeStyle = `hsla(${hue + 20},90%,92%,${alpha * 0.35})`
      ctx.lineWidth = lineWidth * 0.4
      ctx.stroke()
    }
  }

  const drawDroplet = (d: Droplet) => {
    const r = 2.5
    // Teardrop shape
    ctx.save()
    ctx.translate(d.x, d.y)
    ctx.beginPath()
    ctx.moveTo(0, -r * 2.2)
    ctx.bezierCurveTo(r, -r, r, r, 0, r)
    ctx.bezierCurveTo(-r, r, -r, -r, 0, -r * 2.2)
    ctx.closePath()
    ctx.fillStyle = `rgba(160,210,255,${d.life * 0.7})`
    ctx.fill()
    ctx.restore()
  }

  // ── Tick ─────────────────────────────────────────────────────────────────────

  const tick = (now: number) => {
    const dt = now - lastTime
    lastTime = now
    nextDrip -= dt

    const w = canvas.width,
      h = canvas.height

    // Dark water tint fade (not full clear — lets rings linger slightly)
    ctx.fillStyle = 'rgba(0, 8, 20, 0.18)'
    ctx.fillRect(0, 0, w, h)

    // Subtle water surface gradient at bottom of screen
    const surfaceGrad = ctx.createLinearGradient(0, h * 0.75, 0, h)
    surfaceGrad.addColorStop(0, 'rgba(0,30,60,0)')
    surfaceGrad.addColorStop(1, 'rgba(0,20,45,0.12)')
    ctx.fillStyle = surfaceGrad
    ctx.fillRect(0, h * 0.75, w, h)

    // ── Spawn ambient drip ─────────────────────────────────────────────────

    if (nextDrip <= 0) {
      spawnDroplet()
      nextDrip = rand(600, 2200)
    }

    // ── Droplets ────────────────────────────────────────────────────────────

    for (let i = droplets.length - 1; i >= 0; i--) {
      const d = droplets[i]!
      d.y += d.vy
      d.vy += 0.3 // gravity

      if (!d.splashed && d.y >= h * 0.92) {
        d.splashed = true
        spawnRipple(d.x, h * 0.92, 'drip')
        // Small crown splash particles implied by concentric rings
        droplets.splice(i, 1)
        continue
      }

      if (d.y > h + 20) {
        droplets.splice(i, 1)
        continue
      }
      drawDroplet(d)
    }

    // ── Ripples ────────────────────────────────────────────────────────────

    for (let i = ripples.length - 1; i >= 0; i--) {
      const rp = ripples[i]!
      rp.radius += rp.speed
      rp.life -= rp.decay

      if (rp.life <= 0 || rp.radius > rp.maxRadius) {
        ripples.splice(i, 1)
        continue
      }

      // Progress 0→1 through the ripple's life
      const progress = rp.radius / rp.maxRadius
      const alpha = rp.life * (1 - progress * 0.6)

      // Draw each concentric ring offset by a fixed gap
      for (let ring = 0; ring < rp.rings; ring++) {
        const ringOffset = ring * 14
        const rRadius = rp.radius - ringOffset
        if (rRadius <= 0) continue

        const ringAlpha = alpha * Math.max(0, 1 - ring * 0.28)
        const lineWidth =
          (rp.type === 'splash' ? 2.2 : 1.4) * rp.life * (1 - ring * 0.18)

        drawRippleRing(
          rp.x,
          rp.y,
          rRadius,
          ringAlpha,
          rp.hue,
          Math.max(0.3, lineWidth),
        )
      }

      // Interference glow at center for splash type
      if (rp.type === 'splash' && rp.radius < 20) {
        const g = ctx.createRadialGradient(rp.x, rp.y, 0, rp.x, rp.y, 20)
        g.addColorStop(0, `hsla(${rp.hue},90%,90%,${rp.life * 0.6})`)
        g.addColorStop(1, `hsla(${rp.hue},80%,70%,0)`)
        ctx.beginPath()
        ctx.arc(rp.x, rp.y, 20, 0, Math.PI * 2)
        ctx.fillStyle = g
        ctx.fill()
      }
    }

    // ── Interference shimmer where ripples overlap ──────────────────────────
    // For every pair of nearby ripples, draw a soft glow at intersection
    if (ripples.length > 1) {
      for (let a = 0; a < ripples.length - 1; a++) {
        for (let b = a + 1; b < ripples.length; b++) {
          const ra = ripples[a]!,
            rb = ripples[b]!
          const dx = ra.x - rb.x,
            dy = ra.y - rb.y
          const centerDist = Math.sqrt(dx * dx + dy * dy)
          // Rings overlap when |dist - (ra.radius + rb.radius)| is small
          const ringGap = Math.abs(centerDist - (ra.radius + rb.radius))
          if (ringGap < 18 && centerDist > 0) {
            // Point on the line between centers where rings meet
            const t = ra.radius / (ra.radius + rb.radius)
            const ix = ra.x + (rb.x - ra.x) * t
            const iy = ra.y + (rb.y - ra.y) * t
            const shimmerAlpha = (1 - ringGap / 18) * ra.life * rb.life * 0.5
            ctx.beginPath()
            ctx.arc(ix, iy, 4, 0, Math.PI * 2)
            ctx.fillStyle = `hsla(${(ra.hue + rb.hue) / 2},100%,90%,${shimmerAlpha})`
            ctx.fill()
          }
        }
      }
    }

    rafId = requestAnimationFrame(tick)
  }

  rafId = requestAnimationFrame(tick)

  onBeforeUnmount(() => {
    if (rafId) cancelAnimationFrame(rafId)
    window.removeEventListener('resize', resize)
    window.removeEventListener('mousemove', onMouseMove)
    window.removeEventListener('mousedown', onMouseDown)
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
