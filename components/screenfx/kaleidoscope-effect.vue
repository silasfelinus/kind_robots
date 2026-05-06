<!-- /components/content/screenfx/kaleidoscope-effect.vue -->
<template>
  <canvas ref="canvasRef" class="effect-canvas" />
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Cursor {
  ra: number // radial oscillation frequency
  ta: number // angular oscillation frequency
  rPhase: number // radial phase offset
  tPhase: number // angular phase offset
  speed: number // time step per frame
  t: number // current time accumulator
  px: number // previous x in local (wedge-centered) coords
  py: number // previous y
  hue: number // current hue
  hueSpeed: number // hue degrees per frame
  size: number // brush radius
  alpha: number // current opacity
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const rand = (a: number, b: number) => a + Math.random() * (b - a)

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

  // ── Symmetry cycling ────────────────────────────────────────────────────────
  // Cycles through N-fold values every ~20 seconds

  const SYMMETRIES = [6, 8, 10, 12]
  let symIdx = 2 // start at 10
  let N = SYMMETRIES[symIdx]!
  let symTimer = 0
  const SYM_INTERVAL = 1200 // frames

  // ── Cursors: Lissajous traces in polar wedge space ─────────────────────────
  // Each cursor oscillates in (r, θ) within the wedge segment,
  // producing interlocking spirograph-like patterns when mirrored N times.

  const cursors: Cursor[] = [
    {
      ra: 1,
      ta: 3,
      rPhase: 0.0,
      tPhase: 0.0,
      speed: 0.008,
      t: 0,
      px: 0,
      py: 0,
      hue: 0,
      hueSpeed: 0.4,
      size: 14,
      alpha: 1,
    },
    {
      ra: 2,
      ta: 5,
      rPhase: 1.0,
      tPhase: 0.5,
      speed: 0.011,
      t: 0,
      px: 0,
      py: 0,
      hue: 60,
      hueSpeed: 0.3,
      size: 10,
      alpha: 1,
    },
    {
      ra: 3,
      ta: 7,
      rPhase: 2.1,
      tPhase: 1.2,
      speed: 0.006,
      t: 0,
      px: 0,
      py: 0,
      hue: 130,
      hueSpeed: 0.5,
      size: 8,
      alpha: 1,
    },
    {
      ra: 1.5,
      ta: 4,
      rPhase: 0.7,
      tPhase: 2.0,
      speed: 0.014,
      t: 0,
      px: 0,
      py: 0,
      hue: 200,
      hueSpeed: 0.35,
      size: 12,
      alpha: 1,
    },
    {
      ra: 2.5,
      ta: 6,
      rPhase: 3.1,
      tPhase: 0.8,
      speed: 0.009,
      t: 0,
      px: 0,
      py: 0,
      hue: 280,
      hueSpeed: 0.45,
      size: 9,
      alpha: 1,
    },
  ]

  // ── Global state ────────────────────────────────────────────────────────────

  let globalAngle = 0 // slow rotation of entire pattern
  let globalZoom = 1 // breathing scale
  let zoomPhase = 0
  let frame = 0

  // ── Tick ───────────────────────────────────────────────────────────────────

  const tick = () => {
    const w = canvas.width
    const h = canvas.height
    const cx = w / 2
    const cy = h / 2
    const maxR = Math.min(w, h) * 0.46

    frame++
    symTimer++

    // Fade canvas — the trail length is controlled by this alpha
    ctx.fillStyle = 'rgba(0,0,0,0.013)'
    ctx.fillRect(0, 0, w, h)

    // Advance global rotation and zoom
    globalAngle += 0.0006
    zoomPhase += 0.008
    globalZoom = 1 + Math.sin(zoomPhase) * 0.06 // subtle breathe

    // ── Symmetry transition ─────────────────────────────────────────────────

    if (symTimer >= SYM_INTERVAL) {
      symTimer = 0
      symIdx = (symIdx + 1) % SYMMETRIES.length
      N = SYMMETRIES[symIdx]!
    }

    const segAngle = (Math.PI * 2) / N

    // ── Update cursors ──────────────────────────────────────────────────────

    for (const c of cursors) {
      // Advance time
      c.t += c.speed
      c.hue = (c.hue + c.hueSpeed) % 360

      // Polar position in wedge space
      const r =
        maxR * 0.08 +
        maxR * 0.92 * (0.5 + 0.5 * Math.sin(c.ra * c.t + c.rPhase))
      const theta =
        segAngle * 0.5 * (0.5 + 0.5 * Math.sin(c.ta * c.t + c.tPhase))

      // Convert to Cartesian (local, wedge-centered coords)
      const nx = r * Math.cos(theta)
      const ny = r * Math.sin(theta)

      // ── Stamp in all N segments ─────────────────────────────────────────

      for (let i = 0; i < N; i++) {
        ctx.save()
        ctx.translate(cx, cy)
        ctx.rotate(i * segAngle + globalAngle)
        ctx.scale(globalZoom, globalZoom)
        if (i % 2 === 1) ctx.scale(-1, 1) // mirror alternating segments

        // Clip to this wedge
        ctx.beginPath()
        ctx.moveTo(0, 0)
        ctx.arc(0, 0, maxR, 0, segAngle)
        ctx.closePath()
        ctx.clip()

        // Line from previous to current
        ctx.beginPath()
        ctx.moveTo(c.px, c.py)
        ctx.lineTo(nx, ny)
        ctx.strokeStyle = `hsla(${c.hue},95%,72%,0.75)`
        ctx.lineWidth = c.size * 0.55
        ctx.lineCap = 'round'
        ctx.stroke()

        // Glowing dot at current position
        const g = ctx.createRadialGradient(nx, ny, 0, nx, ny, c.size * 1.8)
        g.addColorStop(0, `hsla(${c.hue},100%,92%,0.95)`)
        g.addColorStop(0.4, `hsla(${c.hue},100%,70%,0.6)`)
        g.addColorStop(1, `hsla(${c.hue},100%,55%,0)`)
        ctx.beginPath()
        ctx.arc(nx, ny, c.size * 1.8, 0, Math.PI * 2)
        ctx.fillStyle = g
        ctx.fill()

        ctx.restore()
      }

      // Store previous position
      c.px = nx
      c.py = ny
    }

    // ── Center mandala ──────────────────────────────────────────────────────

    const centerHue = (frame * 0.4) % 360

    // Pulsing rings
    for (let ring = 3; ring >= 0; ring--) {
      const ringR = (12 + ring * 9) * globalZoom
      const ringA = 0.06 - ring * 0.012
      const ringHue = (centerHue + ring * 30) % 360
      ctx.beginPath()
      ctx.arc(cx, cy, ringR, 0, Math.PI * 2)
      ctx.fillStyle = `hsla(${ringHue},100%,75%,${ringA})`
      ctx.fill()
    }

    // Bright center
    const cg = ctx.createRadialGradient(cx, cy, 0, cx, cy, 18 * globalZoom)
    cg.addColorStop(0, `hsla(${centerHue},100%,98%,0.9)`)
    cg.addColorStop(0.5, `hsla(${centerHue},100%,75%,0.5)`)
    cg.addColorStop(1, `hsla(${centerHue},100%,55%,0)`)
    ctx.beginPath()
    ctx.arc(cx, cy, 18 * globalZoom, 0, Math.PI * 2)
    ctx.fillStyle = cg
    ctx.fill()

    // N-pointed spoke marks at segment boundaries
    for (let i = 0; i < N; i++) {
      const spokeAngle = i * ((Math.PI * 2) / N) + globalAngle
      const sx = cx + Math.cos(spokeAngle) * maxR * 0.96
      const sy = cy + Math.sin(spokeAngle) * maxR * 0.96
      ctx.beginPath()
      ctx.arc(sx, sy, 2.5, 0, Math.PI * 2)
      ctx.fillStyle = `hsla(${(centerHue + i * (360 / N)) % 360},90%,80%,0.3)`
      ctx.fill()
    }

    // ── Outer vignette ──────────────────────────────────────────────────────

    const vg = ctx.createRadialGradient(cx, cy, maxR * 0.7, cx, cy, maxR * 1.1)
    vg.addColorStop(0, 'rgba(0,0,0,0)')
    vg.addColorStop(1, 'rgba(0,0,0,0.55)')
    ctx.fillStyle = vg
    ctx.fillRect(0, 0, w, h)

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
