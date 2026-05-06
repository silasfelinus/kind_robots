<!-- /components/content/screenfx/glitch-effect.vue -->
<template>
  <canvas ref="canvasRef" class="effect-canvas" />
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'

// ─── Types ────────────────────────────────────────────────────────────────────

interface GlitchSlice {
  y: number
  h: number
  offsetX: number
  life: number
  hue: number
  alpha: number
}

interface BlockGlitch {
  x: number
  y: number
  w: number
  h: number
  life: number
  type: 'noise' | 'color' | 'white' | 'dark' | 'rgb'
  hue: number
}

interface TrackingLine {
  y: number
  w: number // width fraction 0–1
  life: number
  alpha: number
}

interface RgbGhost {
  // Chromatic aberration ghost — a colored offset rect
  x: number
  y: number
  w: number
  h: number
  life: number
  channel: 'r' | 'g' | 'b'
  offsetX: number
}

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

  const resize = () => {
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight
  }
  resize()
  window.addEventListener('resize', resize)

  // ── State ──────────────────────────────────────────────────────────────────

  const slices: GlitchSlice[] = []
  const blocks: BlockGlitch[] = []
  const tracking: TrackingLine[] = []
  const rgbGhosts: RgbGhost[] = []

  let frame = 0
  let intensity = 0 // 0–1 global glitch intensity, pulses up and decays
  let nextBurst = randInt(60, 180)
  let scanlinePhase = 0
  let vignetteFlick = 0 // brief screen darkening on burst

  // ── Burst spawner ──────────────────────────────────────────────────────────

  const triggerBurst = (force = false) => {
    const w = canvas.width,
      h = canvas.height
    intensity = force ? 1 : rand(0.4, 1)
    vignetteFlick = intensity * 0.35

    // Horizontal slice displacement — the core glitch look
    const sliceCount = randInt(2, 8)
    for (let i = 0; i < sliceCount; i++) {
      const sy = rand(0, h)
      slices.push({
        y: sy,
        h: rand(2, h * 0.15),
        offsetX: (Math.random() > 0.5 ? 1 : -1) * rand(8, 80) * intensity,
        life: 1,
        hue: rand(0, 360),
        alpha: rand(0.4, 0.85),
      })
    }

    // Block corruption
    const blockCount = randInt(1, 5)
    for (let i = 0; i < blockCount; i++) {
      const type = (['noise', 'color', 'white', 'dark', 'rgb'] as const)[
        randInt(0, 4)
      ]!
      blocks.push({
        x: rand(0, w),
        y: rand(0, h),
        w: rand(20, w * 0.4),
        h: rand(4, 60),
        life: 1,
        type,
        hue: rand(0, 360),
      })
    }

    // VHS tracking lines
    const trackCount = randInt(1, 4)
    for (let i = 0; i < trackCount; i++) {
      tracking.push({
        y: rand(0, h),
        w: rand(0.3, 1.0),
        life: 1,
        alpha: rand(0.3, 0.8),
      })
    }

    // RGB ghost aberration bands
    if (intensity > 0.5) {
      const ghostCount = randInt(1, 3)
      for (let i = 0; i < ghostCount; i++) {
        const channel = (['r', 'g', 'b'] as const)[randInt(0, 2)]!
        rgbGhosts.push({
          x: 0,
          y: rand(0, h),
          w,
          h: rand(3, 30),
          life: 1,
          channel,
          offsetX: (Math.random() > 0.5 ? 1 : -1) * rand(4, 24),
        })
      }
    }
  }

  // ── Noise texture helper ───────────────────────────────────────────────────

  const drawNoise = (
    x: number,
    y: number,
    w: number,
    h: number,
    alpha: number,
  ) => {
    const imgData = ctx.createImageData(Math.ceil(w), Math.ceil(h))
    const d = imgData.data
    for (let i = 0; i < d.length; i += 4) {
      const v = Math.random() > 0.5 ? randInt(180, 255) : 0
      d[i] = d[i + 1] = d[i + 2] = v
      d[i + 3] = Math.floor(alpha * 255)
    }
    ctx.putImageData(imgData, x, y)
  }

  // ── Scanline overlay ───────────────────────────────────────────────────────

  const drawScanlines = () => {
    const w = canvas.width,
      h = canvas.height
    const spacing = 3
    const baseAlpha = 0.06 + intensity * 0.08

    ctx.strokeStyle = `rgba(0,0,0,${baseAlpha})`
    ctx.lineWidth = 1

    for (let y = 0; y < h; y += spacing) {
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(w, y)
      ctx.stroke()
    }

    // Every ~12 lines, a slightly brighter phosphor line
    ctx.strokeStyle = `rgba(120,255,200,0.025)`
    for (let y = scanlinePhase % 12; y < h; y += 12) {
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(w, y)
      ctx.stroke()
    }
  }

  // ── Vignette ───────────────────────────────────────────────────────────────

  const drawVignette = () => {
    const w = canvas.width,
      h = canvas.height
    const alpha = 0.18 + vignetteFlick
    const g = ctx.createRadialGradient(
      w / 2,
      h / 2,
      h * 0.3,
      w / 2,
      h / 2,
      h * 0.85,
    )
    g.addColorStop(0, `rgba(0,0,0,0)`)
    g.addColorStop(1, `rgba(0,0,0,${alpha})`)
    ctx.fillStyle = g
    ctx.fillRect(0, 0, w, h)
  }

  // ── CRT screen curvature hint (edge darkening) ─────────────────────────────

  const drawCrtEdge = () => {
    const w = canvas.width,
      h = canvas.height
    // Left edge
    const gl = ctx.createLinearGradient(0, 0, 40, 0)
    gl.addColorStop(0, 'rgba(0,0,0,0.22)')
    gl.addColorStop(1, 'rgba(0,0,0,0)')
    ctx.fillStyle = gl
    ctx.fillRect(0, 0, 40, h)
    // Right edge
    const gr = ctx.createLinearGradient(w - 40, 0, w, 0)
    gr.addColorStop(0, 'rgba(0,0,0,0)')
    gr.addColorStop(1, 'rgba(0,0,0,0.22)')
    ctx.fillStyle = gr
    ctx.fillRect(w - 40, 0, 40, h)
  }

  // ── Tick ───────────────────────────────────────────────────────────────────

  const tick = () => {
    const w = canvas.width,
      h = canvas.height
    frame++
    scanlinePhase++
    intensity = Math.max(0, intensity - 0.025)
    vignetteFlick = Math.max(0, vignetteFlick - 0.015)

    ctx.clearRect(0, 0, w, h)

    // Always-on subtle scanlines + vignette + CRT edge
    drawScanlines()
    drawVignette()
    drawCrtEdge()

    // Persistent ambient chromatic aberration along top edge
    const aberAlpha = 0.04 + intensity * 0.08
    ctx.fillStyle = `rgba(255,0,60,${aberAlpha})`
    ctx.fillRect(0, 0, w, 2)
    ctx.fillStyle = `rgba(0,255,200,${aberAlpha})`
    ctx.fillRect(0, 2, w, 1)

    // ── Slices ──────────────────────────────────────────────────────────────

    for (let i = slices.length - 1; i >= 0; i--) {
      const s = slices[i]!
      s.life -= 0.07
      if (s.life <= 0) {
        slices.splice(i, 1)
        continue
      }

      const alpha = s.alpha * s.life

      // The displaced bar — colored glitch stripe
      ctx.fillStyle = `hsla(${s.hue},80%,60%,${alpha * 0.25})`
      ctx.fillRect(0, s.y, w, s.h)

      // Offset ghost line (simulating pixel displacement)
      ctx.save()
      ctx.translate(s.offsetX, 0)
      ctx.fillStyle = `hsla(${s.hue},100%,75%,${alpha * 0.18})`
      ctx.fillRect(0, s.y, w, Math.min(s.h, 4))
      ctx.restore()

      // Hard edge line at slice boundary
      ctx.strokeStyle = `hsla(${s.hue},90%,80%,${alpha * 0.6})`
      ctx.lineWidth = 0.5
      ctx.beginPath()
      ctx.moveTo(0, s.y)
      ctx.lineTo(w, s.y)
      ctx.stroke()
    }

    // ── Block corruption ────────────────────────────────────────────────────

    for (let i = blocks.length - 1; i >= 0; i--) {
      const b = blocks[i]!
      b.life -= 0.1
      if (b.life <= 0) {
        blocks.splice(i, 1)
        continue
      }

      const alpha = b.life

      switch (b.type) {
        case 'noise':
          drawNoise(b.x, b.y, b.w, b.h, alpha * 0.6)
          break
        case 'color':
          ctx.fillStyle = `hsla(${b.hue},100%,60%,${alpha * 0.35})`
          ctx.fillRect(b.x, b.y, b.w, b.h)
          break
        case 'white':
          ctx.fillStyle = `rgba(255,255,255,${alpha * 0.4})`
          ctx.fillRect(b.x, b.y, b.w, b.h)
          break
        case 'dark':
          ctx.fillStyle = `rgba(0,0,0,${alpha * 0.7})`
          ctx.fillRect(b.x, b.y, b.w, b.h)
          break
        case 'rgb':
          // Three-color split bars
          ctx.fillStyle = `rgba(255,0,0,${alpha * 0.3})`
          ctx.fillRect(b.x, b.y, b.w, b.h / 3)
          ctx.fillStyle = `rgba(0,255,0,${alpha * 0.3})`
          ctx.fillRect(b.x, b.y + b.h / 3, b.w, b.h / 3)
          ctx.fillStyle = `rgba(0,0,255,${alpha * 0.3})`
          ctx.fillRect(b.x, b.y + (b.h * 2) / 3, b.w, b.h / 3)
          break
      }
    }

    // ── VHS tracking lines ──────────────────────────────────────────────────

    for (let i = tracking.length - 1; i >= 0; i--) {
      const t = tracking[i]!
      t.life -= 0.04
      if (t.life <= 0) {
        tracking.splice(i, 1)
        continue
      }
      t.y += 0.8 // tracking lines slowly drift downward

      const alpha = t.alpha * t.life
      const lineW = w * t.w

      // Bright tracking stripe
      ctx.fillStyle = `rgba(255,255,255,${alpha * 0.7})`
      ctx.fillRect(0, t.y, lineW, 1.5)

      // Color fringe below
      ctx.fillStyle = `rgba(0,200,255,${alpha * 0.3})`
      ctx.fillRect(0, t.y + 2, lineW * 0.8, 1)
    }

    // ── RGB ghost bands ─────────────────────────────────────────────────────

    for (let i = rgbGhosts.length - 1; i >= 0; i--) {
      const g = rgbGhosts[i]!
      g.life -= 0.06
      if (g.life <= 0) {
        rgbGhosts.splice(i, 1)
        continue
      }

      const alpha = g.life * 0.35
      let color: string
      switch (g.channel) {
        case 'r':
          color = `rgba(255,0,60,${alpha})`
          break
        case 'g':
          color = `rgba(0,255,140,${alpha})`
          break
        case 'b':
          color = `rgba(60,80,255,${alpha})`
          break
      }

      ctx.fillStyle = color!
      ctx.fillRect(g.offsetX, g.y, g.w, g.h)
    }

    // ── Occasional full-screen noise flash ──────────────────────────────────

    if (intensity > 0.9 && Math.random() > 0.92) {
      ctx.fillStyle = `rgba(255,255,255,${rand(0.02, 0.07)})`
      ctx.fillRect(0, 0, w, h)
    }

    // ── Burst timer ─────────────────────────────────────────────────────────

    nextBurst--
    if (nextBurst <= 0) {
      triggerBurst()
      // Occasional double-tap
      if (Math.random() > 0.75) {
        setTimeout(() => triggerBurst(), randInt(60, 180))
      }
      nextBurst = randInt(50, 220)
    }

    rafId = requestAnimationFrame(tick)
  }

  // Trigger an opening burst so it doesn't start blank
  setTimeout(() => triggerBurst(true), 200)

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
  z-index: 55; /* slightly above most effects so glitch reads on top */
}
</style>
