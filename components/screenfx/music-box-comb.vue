<template>
  <canvas ref="canvasRef" class="music-box-comb" />
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'

const canvasRef = ref<HTMLCanvasElement | null>(null)

// A music box: a brass cylinder scrolls pins past a comb of tuned tines. Each
// pin is deterministic (hash of its index), so the tune is closed-form and the
// scene holds no per-note state. Hover brightens nearby tines; a click plays a
// rate-limited glissando flourish that fades away.
const TINES = 14
const PIN_ROWS = 14
const SCROLL_SPEED = 0.35
const KICK_COOLDOWN_MS = 3000
const KICK_DECAY_PER_SEC = 0.35
const TWO_PI = Math.PI * 2

let context: CanvasRenderingContext2D | null = null
let resizeObserver: ResizeObserver | null = null
let motionQuery: MediaQueryList | null = null
let animationFrameId: number | null = null
let lastFrameTs = 0
let clock = 0
let width = 1
let height = 1
let reducedMotion = false
let flourish = 0
let lastKickTs = 0
let pointerX = -1
let pointerY = -1

// Deterministic 0..1 value per flake and channel.
function seeded(i: number, channel: number): number {
  const v = Math.sin(i * 127.1 + channel * 311.7) * 43758.5453
  return v - Math.floor(v)
}

function canvasPoint(event: PointerEvent): { x: number; y: number } | null {
  const canvas = canvasRef.value
  if (!canvas) return null
  const rect = canvas.getBoundingClientRect()
  const x = event.clientX - rect.left
  const y = event.clientY - rect.top
  if (x < 0 || y < 0 || x > rect.width || y > rect.height) return null
  return { x, y }
}

function handlePointerMove(event: PointerEvent): void {
  if (reducedMotion) return
  const point = canvasPoint(event)
  pointerX = point ? point.x : -1
  pointerY = point ? point.y : -1
}

function handlePointerDown(event: PointerEvent): void {
  if (reducedMotion) return
  if (!canvasPoint(event)) return
  const now = performance.now()
  if (now - lastKickTs < KICK_COOLDOWN_MS) return
  lastKickTs = now
  flourish = 1
}

function resizeCanvas(): void {
  const canvas = canvasRef.value
  if (!canvas || !context) return
  const rect = canvas.getBoundingClientRect()
  width = Math.max(1, rect.width)
  height = Math.max(1, rect.height)
  const ratio = Math.min(window.devicePixelRatio || 1, 2)
  canvas.width = Math.round(width * ratio)
  canvas.height = Math.round(height * ratio)
  context.setTransform(ratio, 0, 0, ratio, 0, 0)
}

function hasPin(row: number, tine: number): boolean {
  return seeded(row * 31 + tine, 7) > 0.78
}

function drawScene(seconds: number): void {
  if (!context) return
  const bg = context.createLinearGradient(0, 0, 0, height)
  bg.addColorStop(0, '#1d1830')
  bg.addColorStop(1, '#0e0a18')
  context.fillStyle = bg
  context.fillRect(0, 0, width, height)

  const left = width * 0.12
  const span = width * 0.76
  const pitch = span / TINES
  const combY = height * 0.72
  const drumTop = height * 0.2
  const rowGap = (combY - drumTop) / PIN_ROWS

  context.fillStyle = 'rgba(176, 132, 62, 0.16)'
  context.fillRect(left - pitch * 0.5, drumTop, span + pitch, combY - drumTop)

  const scroll = seconds * SCROLL_SPEED * PIN_ROWS * 0.25
  const base = Math.floor(scroll)
  const frac = scroll - base
  for (let r = -1; r <= PIN_ROWS; r += 1) {
    const row = base - r
    const y = combY - (r + frac) * rowGap
    if (y < drumTop - rowGap || y > combY + rowGap) continue
    for (let t = 0; t < TINES; t += 1) {
      if (!hasPin(row, t)) continue
      const x = left + (t + 0.5) * pitch
      const near = Math.max(0, 1 - Math.abs(y - combY) / (rowGap * 1.2))
      context.fillStyle = `rgba(255, 214, 120, ${0.35 + near * 0.6})`
      context.beginPath()
      context.arc(x, y, Math.max(2, pitch * 0.12), 0, TWO_PI)
      context.fill()
      if (near > 0.6) {
        // Plucked: a sparkle drifts up from the tine.
        const rise = (1 - near) * 2.5 + 0.2
        const g = context.createRadialGradient(
          x,
          y - rise * rowGap,
          0,
          x,
          y - rise * rowGap,
          pitch * 0.7,
        )
        g.addColorStop(0, `rgba(255, 236, 180, ${near * 0.5})`)
        g.addColorStop(1, 'rgba(255, 236, 180, 0)')
        context.fillStyle = g
        context.beginPath()
        context.arc(x, y - rise * rowGap, pitch * 0.7, 0, TWO_PI)
        context.fill()
      }
    }
  }

  for (let t = 0; t < TINES; t += 1) {
    const x = left + (t + 0.5) * pitch
    const len = height * (0.2 - t * 0.008)
    const hover =
      pointerX >= 0 ? Math.max(0, 1 - Math.abs(x - pointerX) / (pitch * 3)) : 0
    const wave =
      Math.max(0, 1 - Math.abs(t / TINES - (1 - flourish)) * 6) * flourish
    const glow = Math.min(1, hover * 0.6 + wave)
    context.fillStyle = `hsl(42, ${30 + glow * 50}%, ${58 + glow * 30}%)`
    context.fillRect(x - pitch * 0.18, combY, pitch * 0.36, len)
  }
  context.fillStyle = '#4a3418'
  context.fillRect(left - pitch * 0.5, combY - 4, span + pitch, 8)
}

function renderFrame(timestamp: number): void {
  if (!context) return
  const dt = lastFrameTs ? Math.min(0.1, (timestamp - lastFrameTs) / 1000) : 0
  lastFrameTs = timestamp
  flourish = Math.max(0, flourish - KICK_DECAY_PER_SEC * dt)
  clock += dt
  drawScene(clock)
  animationFrameId = window.requestAnimationFrame(renderFrame)
}

function handleMotionChange(event: MediaQueryListEvent): void {
  reducedMotion = event.matches
  flourish = 0
  pointerX = -1
  pointerY = -1
  if (reducedMotion) {
    if (animationFrameId !== null) window.cancelAnimationFrame(animationFrameId)
    animationFrameId = null
    drawScene(0)
  } else if (animationFrameId === null) {
    lastFrameTs = 0
    animationFrameId = window.requestAnimationFrame(renderFrame)
  }
}

onMounted(() => {
  const canvas = canvasRef.value
  if (!canvas) return
  context = canvas.getContext('2d')
  if (!context) return

  motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
  reducedMotion = motionQuery.matches
  motionQuery.addEventListener('change', handleMotionChange)

  resizeObserver = new ResizeObserver(() => {
    resizeCanvas()
    if (reducedMotion) drawScene(0)
  })
  resizeObserver.observe(canvas)
  window.addEventListener('pointermove', handlePointerMove, { passive: true })
  window.addEventListener('pointerdown', handlePointerDown, { passive: true })
  resizeCanvas()
  if (reducedMotion) drawScene(0)
  else animationFrameId = window.requestAnimationFrame(renderFrame)
})

onBeforeUnmount(() => {
  if (animationFrameId !== null) window.cancelAnimationFrame(animationFrameId)
  resizeObserver?.disconnect()
  motionQuery?.removeEventListener('change', handleMotionChange)
  window.removeEventListener('pointermove', handlePointerMove)
  window.removeEventListener('pointerdown', handlePointerDown)
  context = null
})
</script>

<style scoped>
.music-box-comb {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}
</style>
