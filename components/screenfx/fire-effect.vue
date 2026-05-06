<!-- /components/content/screenfx/fire-effect.vue -->
<template>
  <canvas ref="canvasRef" class="effect-canvas" />
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Ember {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  size: number
  hue: number
  flicker: number
}

// ─── Fire palette: black → deep red → orange → yellow → white ────────────────

function buildPalette(): Uint8Array {
  const pal = new Uint8Array(64 * 3)
  const stops: [number, number, number, number][] = [
    [0, 0, 0, 0],
    [10, 80, 0, 0],
    [20, 180, 0, 0],
    [32, 255, 80, 0],
    [48, 255, 200, 0],
    [58, 255, 240, 160],
    [63, 255, 255, 255],
  ]
  for (let i = 0; i < stops.length - 1; i++) {
    const [i0, r0, g0, b0] = stops[i]!
    const [i1, r1, g1, b1] = stops[i + 1]!
    const steps = i1 - i0
    for (let j = 0; j <= steps; j++) {
      const t = j / steps
      const idx = (i0 + j) * 3
      pal[idx] = Math.round(r0 + (r1 - r0) * t)
      pal[idx + 1] = Math.round(g0 + (g1 - g0) * t)
      pal[idx + 2] = Math.round(b0 + (b1 - b0) * t)
    }
  }
  return pal
}

const PALETTE = buildPalette()

// ─── Helpers ──────────────────────────────────────────────────────────────────

const rand = (a: number, b: number) => a + Math.random() * (b - a)
const randInt = (a: number, b: number) => Math.floor(rand(a, b + 1))

// ─── Component ────────────────────────────────────────────────────────────────

const canvasRef = ref<HTMLCanvasElement | null>(null)
let rafId: number | null = null

onMounted(() => {
  const canvas = canvasRef.value
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  // Fire sim resolution divisor — higher = cheaper
  const SCALE = 4

  // Dedicated offscreen canvas for the fire pixel buffer
  const fireCanvas = document.createElement('canvas')
  const fireCtx = fireCanvas.getContext('2d')!

  let FW = 0
  let FH = 0
  let fireBuffer: Uint8Array = new Uint8Array(0)
  let imgData: ImageData | null = null

  // ── Init / resize ──────────────────────────────────────────────────────────

  const resize = () => {
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight
    FW = Math.ceil(canvas.width / SCALE)
    FH = Math.ceil(canvas.height / SCALE)
    fireCanvas.width = FW
    fireCanvas.height = FH
    fireBuffer = new Uint8Array(FW * FH)
    imgData = fireCtx.createImageData(FW, FH)
    // Seed bottom two rows
    for (let x = 0; x < FW; x++) {
      fireBuffer[(FH - 1) * FW + x] = 63
      fireBuffer[(FH - 2) * FW + x] = 63
    }
  }

  resize()
  window.addEventListener('resize', resize)

  // ── Wind ──────────────────────────────────────────────────────────────────

  let wind = 0
  let windTarget = 0
  let windTimer = 0

  // ── Embers ────────────────────────────────────────────────────────────────

  const embers: Ember[] = []

  const spawnEmber = () => {
    embers.push({
      x: rand(0, canvas.width),
      y: canvas.height - rand(20, 80),
      vx: wind * 0.8 + rand(-1.2, 1.2),
      vy: -rand(1.5, 4.5),
      life: 1,
      size: rand(1.5, 4),
      hue: rand(15, 45),
      flicker: rand(0, Math.PI * 2),
    })
  }

  // ── Doom fire step ─────────────────────────────────────────────────────────

  const stepFire = () => {
    // Drift wind
    windTimer--
    if (windTimer <= 0) {
      windTarget = rand(-1.5, 1.5)
      windTimer = randInt(40, 120)
    }
    wind += (windTarget - wind) * 0.02

    for (let y = 0; y < FH - 1; y++) {
      for (let x = 0; x < FW; x++) {
        const spread = randInt(0, 2)
        const windShift =
          wind > 0
            ? Math.random() < wind
              ? 1
              : 0
            : Math.random() < -wind
              ? -1
              : 0
        const srcX = Math.min(FW - 1, Math.max(0, x - spread + 1 + windShift))
        const srcVal = fireBuffer[(y + 1) * FW + srcX]!
        const decay = Math.random() > 0.4 ? 1 : 0
        fireBuffer[y * FW + x] = Math.max(0, srcVal - decay)
      }
    }

    // Keep base hot with occasional cool gaps
    for (let x = 0; x < FW; x++) {
      const cool = Math.random() < 0.04
      if (cool) {
        fireBuffer[(FH - 1) * FW + x] = Math.max(
          0,
          fireBuffer[(FH - 1) * FW + x]! - 4,
        )
      } else {
        fireBuffer[(FH - 1) * FW + x] = 63
      }
    }
  }

  // ── Write pixel buffer → offscreen canvas ─────────────────────────────────

  const flushFireBuffer = () => {
    if (!imgData) return
    const d = imgData.data

    for (let i = 0; i < FW * FH; i++) {
      const val = fireBuffer[i]!
      const pi = val * 3
      const idx = i * 4
      d[idx] = PALETTE[pi]!
      d[idx + 1] = PALETTE[pi + 1]!
      d[idx + 2] = PALETTE[pi + 2]!
      // Transparent for cold pixels, opaque for hot
      d[idx + 3] = val === 0 ? 0 : Math.floor((val / 63) * 220 + 35)
    }

    fireCtx.putImageData(imgData, 0, 0)
  }

  // ── Heat shimmer ───────────────────────────────────────────────────────────

  let shimmerPhase = 0

  const drawHeatShimmer = () => {
    const w = canvas.width,
      h = canvas.height
    shimmerPhase += 0.035

    // Wavy orange tint drifting upward above the flame zone
    const shimmerH = h * 0.55
    for (let y = 0; y < shimmerH; y += 8) {
      const t = 1 - y / shimmerH
      const alpha = t * 0.012
      if (alpha <= 0.001) continue
      const waveX = Math.sin(y * 0.025 + shimmerPhase) * 4
      ctx.save()
      ctx.translate(waveX, 0)
      ctx.fillStyle = `rgba(255,100,0,${alpha})`
      ctx.fillRect(0, y, w, 3)
      ctx.restore()
    }
  }

  // ── Ember update & draw ────────────────────────────────────────────────────

  const updateEmbers = () => {
    if (Math.random() > 0.6) spawnEmber()

    for (let i = embers.length - 1; i >= 0; i--) {
      const e = embers[i]!
      e.life -= 0.007 + rand(0, 0.005)
      e.flicker += 0.14
      e.x += e.vx + wind * 0.4
      e.y += e.vy
      e.vy += 0.018
      e.vx *= 0.99

      if (e.life <= 0 || e.y < -20) {
        embers.splice(i, 1)
        continue
      }

      const glow = Math.abs(Math.sin(e.flicker)) * 0.5 + 0.5
      const alpha = e.life * glow
      const r = e.size * e.life

      // Glow halo
      const g = ctx.createRadialGradient(e.x, e.y, 0, e.x, e.y, r * 4)
      g.addColorStop(0, `hsla(${e.hue},100%,70%,${alpha * 0.65})`)
      g.addColorStop(1, `hsla(${e.hue},100%,50%,0)`)
      ctx.beginPath()
      ctx.arc(e.x, e.y, r * 4, 0, Math.PI * 2)
      ctx.fillStyle = g
      ctx.fill()

      // Ember core
      ctx.beginPath()
      ctx.arc(e.x, e.y, Math.max(0.4, r), 0, Math.PI * 2)
      ctx.fillStyle = `hsla(${e.hue + 20},100%,92%,${alpha})`
      ctx.fill()
    }
  }

  // ── Tick ───────────────────────────────────────────────────────────────────

  let simFrame = 0

  const tick = () => {
    const w = canvas.width,
      h = canvas.height
    simFrame++

    // Run sim every other frame
    if (simFrame % 2 === 0) stepFire()
    flushFireBuffer()

    ctx.clearRect(0, 0, w, h)

    // Draw fire buffer scaled into the bottom 70% of the screen
    const fireTop = h * 0.3
    ctx.drawImage(fireCanvas, 0, fireTop, w, h - fireTop)

    // Soft gradient fade at the top of the fire zone so it dissolves into air
    const fadeGrad = ctx.createLinearGradient(0, fireTop, 0, fireTop + h * 0.22)
    fadeGrad.addColorStop(0, 'rgba(0,0,0,0.85)')
    fadeGrad.addColorStop(1, 'rgba(0,0,0,0)')
    ctx.fillStyle = fadeGrad
    ctx.fillRect(0, fireTop, w, h * 0.22)

    drawHeatShimmer()
    updateEmbers()

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
  image-rendering: pixelated;
}
</style>
