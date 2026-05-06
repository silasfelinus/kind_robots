<!-- /components/content/screenfx/pixel-explosion.vue -->
<!-- pointer-events: none — clicks pass through to the page normally.         -->
<!-- We listen on window so every click triggers an explosion AND works as     -->
<!-- expected (buttons, links, everything still functions underneath).         -->
<template>
  <canvas ref="canvasRef" class="effect-canvas" />
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Pixel {
  x: number
  y: number
  vx: number
  vy: number
  rot: number
  vrot: number
  size: number
  r: number
  g: number
  b: number // base color
  life: number // 1 → 0
  decay: number
  phase: number // for shimmer
}

interface Shockwave {
  x: number
  y: number
  radius: number
  maxRadius: number
  life: number
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const rand = (a: number, b: number) => a + Math.random() * (b - a)
const randInt = (a: number, b: number) => Math.floor(rand(a, b + 1))
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v))

// Parse "rgb(r, g, b)" or "rgba(r, g, b, a)" → {r,g,b} | null
function parseRgb(str: string): { r: number; g: number; b: number } | null {
  const m = str.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/)
  if (!m) return null
  return { r: +m[1]!, g: +m[2]!, b: +m[3]! }
}

// Shift an RGB color by hue/lightness variation for visual richness
function jitterColor(
  base: { r: number; g: number; b: number },
  amount = 40,
): { r: number; g: number; b: number } {
  return {
    r: clamp(base.r + randInt(-amount, amount), 0, 255),
    g: clamp(base.g + randInt(-amount, amount), 0, 255),
    b: clamp(base.b + randInt(-amount, amount), 0, 255),
  }
}

// Sample several DOM elements around a point to build a color palette
function sampleDomColors(
  x: number,
  y: number,
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
): { r: number; g: number; b: number }[] {
  const colors: { r: number; g: number; b: number }[] = []

  // First try: canvas pixel data (works if other effects are active)
  try {
    const offsets = [
      [0, 0],
      [-20, -20],
      [20, -20],
      [-20, 20],
      [20, 20],
      [-40, 0],
      [40, 0],
      [0, -40],
      [0, 40],
    ]
    for (const [dx, dy] of offsets) {
      const px = Math.round(x + dx!),
        py = Math.round(y + dy!)
      if (px < 0 || py < 0 || px >= canvas.width || py >= canvas.height)
        continue
      const d = ctx.getImageData(px, py, 1, 1).data
      if (d[3]! > 30) {
        // only use if not nearly transparent
        colors.push({ r: d[0]!, g: d[1]!, b: d[2]! })
      }
    }
  } catch (_) {}

  // Second try: DOM element computed styles
  const probeOffsets = [
    [0, 0],
    [-30, -30],
    [30, -30],
    [-30, 30],
    [30, 30],
    [0, -50],
    [0, 50],
  ]
  for (const [dx, dy] of probeOffsets) {
    const el = document.elementFromPoint(x + dx!, y + dy!)
    if (!el || el === canvas) continue
    const style = window.getComputedStyle(el)
    const bg = parseRgb(style.backgroundColor)
    const fg = parseRgb(style.color)
    if (bg && bg.r + bg.g + bg.b > 30) colors.push(bg)
    if (fg) colors.push(fg)
  }

  // Fallback: vibrant defaults so we always have something interesting
  if (colors.length < 3) {
    const hueBase = Math.random() * 360
    for (let i = 0; i < 6; i++) {
      const h = (hueBase + i * 60) % 360
      colors.push(hslToRgb(h, 85, 60))
    }
  }

  return colors
}

function hslToRgb(
  h: number,
  s: number,
  l: number,
): { r: number; g: number; b: number } {
  s /= 100
  l /= 100
  const k = (n: number) => (n + h / 30) % 12
  const a = s * Math.min(l, 1 - l)
  const f = (n: number) =>
    l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)))
  return {
    r: Math.round(f(0) * 255),
    g: Math.round(f(8) * 255),
    b: Math.round(f(4) * 255),
  }
}

// ─── Explosion factory ────────────────────────────────────────────────────────

function createExplosion(
  pixels: Pixel[],
  shockwaves: Shockwave[],
  cx: number,
  cy: number,
  palette: { r: number; g: number; b: number }[],
) {
  // Grid dimensions — a COLS×ROWS block of pixels shatters outward
  const COLS = 10
  const ROWS = 10
  const CELL = 9 // pixel square size (px)
  const GAP = 1

  const totalW = COLS * (CELL + GAP)
  const totalH = ROWS * (CELL + GAP)

  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      // Starting position: grid cell position relative to click center
      const gx = cx - totalW / 2 + col * (CELL + GAP) + CELL / 2
      const gy = cy - totalH / 2 + row * (CELL + GAP) + CELL / 2

      // Direction: outward from center, plus spread
      const dx = gx - cx
      const dy = gy - cy
      const len = Math.sqrt(dx * dx + dy * dy) || 1
      const baseAngle = Math.atan2(dy, dx)
      const spread = rand(-0.55, 0.55)
      const speed = rand(3.5, 14) * (0.5 + (len / (totalW * 0.7)) * 0.9)

      // Color from palette with per-pixel jitter
      const base = palette[Math.floor(Math.random() * palette.length)]!
      const color = jitterColor(base, 35)

      // Vary pixel sizes slightly for organic feel
      const size = CELL + randInt(-2, 3)

      pixels.push({
        x: gx,
        y: gy,
        vx: Math.cos(baseAngle + spread) * speed,
        vy: Math.sin(baseAngle + spread) * speed - rand(0.5, 2.5), // slight upward
        rot: rand(0, 360),
        vrot: (Math.random() > 0.5 ? 1 : -1) * rand(2, 12),
        size,
        ...color,
        life: 1,
        decay: rand(0.012, 0.024),
        phase: rand(0, Math.PI * 2),
      })
    }
  }

  // Shockwave ring
  shockwaves.push({
    x: cx,
    y: cy,
    radius: 0,
    maxRadius: rand(80, 140),
    life: 1,
  })

  // Secondary smaller shockwave (offset timing via smaller initial radius)
  shockwaves.push({
    x: cx,
    y: cy,
    radius: 12,
    maxRadius: rand(40, 80),
    life: 0.85,
  })
}

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

  const pixels: Pixel[] = []
  const shockwaves: Shockwave[] = []

  // ── Click handler ─────────────────────────────────────────────────────────

  const onClick = (e: MouseEvent) => {
    const palette = sampleDomColors(e.clientX, e.clientY, canvas, ctx)
    createExplosion(pixels, shockwaves, e.clientX, e.clientY, palette)
  }

  // Listen on window so underlying elements still receive the click first
  window.addEventListener('click', onClick, { capture: false })

  // ── Tick ──────────────────────────────────────────────────────────────────

  const tick = () => {
    const w = canvas.width,
      h = canvas.height
    ctx.clearRect(0, 0, w, h)

    // ── Shockwaves ───────────────────────────────────────────────────────────

    for (let i = shockwaves.length - 1; i >= 0; i--) {
      const sw = shockwaves[i]!
      sw.radius += (sw.maxRadius - sw.radius) * 0.14 // ease out
      sw.life -= 0.045
      if (sw.life <= 0) {
        shockwaves.splice(i, 1)
        continue
      }

      const alpha = sw.life * 0.6
      ctx.beginPath()
      ctx.arc(sw.x, sw.y, sw.radius, 0, Math.PI * 2)
      ctx.strokeStyle = `rgba(255,255,255,${alpha})`
      ctx.lineWidth = sw.life * 3
      ctx.stroke()

      // Inner glow ring
      ctx.beginPath()
      ctx.arc(sw.x, sw.y, sw.radius * 0.7, 0, Math.PI * 2)
      ctx.strokeStyle = `rgba(200,180,255,${alpha * 0.4})`
      ctx.lineWidth = 1
      ctx.stroke()
    }

    // ── Pixels ───────────────────────────────────────────────────────────────

    for (let i = pixels.length - 1; i >= 0; i--) {
      const p = pixels[i]!
      p.life -= p.decay
      if (p.life <= 0) {
        pixels.splice(i, 1)
        continue
      }

      p.phase += 0.08
      p.x += p.vx
      p.y += p.vy
      p.vy += 0.28 // gravity
      p.vx *= 0.985 // air resistance
      p.rot += p.vrot
      p.vrot *= 0.98 // spin decay

      const alpha = p.life
      const shimmer = 0.85 + Math.sin(p.phase) * 0.15
      const s = p.size * p.life * 0.6 + p.size * 0.4 // shrink slightly

      ctx.save()
      ctx.translate(p.x, p.y)
      ctx.rotate((p.rot * Math.PI) / 180)

      // Main pixel square
      ctx.fillStyle = `rgba(${p.r},${p.g},${p.b},${alpha * shimmer})`
      ctx.fillRect(-s / 2, -s / 2, s, s)

      // Highlight edge (top-left corner — classic pixel art shading)
      ctx.fillStyle = `rgba(255,255,255,${alpha * 0.35 * shimmer})`
      ctx.fillRect(-s / 2, -s / 2, s, 1.5) // top edge
      ctx.fillRect(-s / 2, -s / 2, 1.5, s) // left edge

      // Shadow edge (bottom-right)
      ctx.fillStyle = `rgba(0,0,0,${alpha * 0.3})`
      ctx.fillRect(-s / 2, s / 2 - 1.5, s, 1.5) // bottom edge
      ctx.fillRect(s / 2 - 1.5, -s / 2, 1.5, s) // right edge

      // Tiny pixel glow halo when fresh
      if (p.life > 0.7) {
        const glowSize = s * 1.8
        const g = ctx.createRadialGradient(0, 0, 0, 0, 0, glowSize)
        g.addColorStop(0, `rgba(${p.r},${p.g},${p.b},${(p.life - 0.7) * 0.5})`)
        g.addColorStop(1, `rgba(${p.r},${p.g},${p.b},0)`)
        ctx.fillStyle = g
        ctx.beginPath()
        ctx.arc(0, 0, glowSize, 0, Math.PI * 2)
        ctx.fill()
      }

      ctx.restore()
    }

    rafId = requestAnimationFrame(tick)
  }

  rafId = requestAnimationFrame(tick)

  onBeforeUnmount(() => {
    if (rafId) cancelAnimationFrame(rafId)
    window.removeEventListener('resize', resize)
    window.removeEventListener('click', onClick, {
      capture: false,
    } as EventListenerOptions)
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
  z-index: 56; /* above most effects so pixels read clearly */
}
</style>
