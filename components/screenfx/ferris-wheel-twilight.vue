<template>
  <canvas ref="canvasRef" class="ferris-wheel-twilight" />
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'

const canvasRef = ref<HTMLCanvasElement | null>(null)

const KICK_COOLDOWN_MS = 3000
const STRIKE_DECAY_PER_SEC = 0.35
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
let strike = 0
let spin = 0
let spinRate = 0
let lastKickTs = 0
let pointerX = -1
let pointerY = -1

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
  strike = 1
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

// A fairground Ferris wheel turns slowly against a twilight sky. Gondola
// positions are a closed-form function of the wheel angle, and each gondola
// hangs upright with a small pendulum sway driven by the same clock, so nothing
// per-gondola is stored. A chase of rim bulbs runs around the wheel. Hover
// lights the nearest gondola's window; a click gives the wheel a brief push
// (rate-limited) that eases back to the idle turn.
const GONDOLAS = 12
const BULBS = 48
const IDLE_SPIN = 0.07

function drawScene(seconds: number): void {
  if (!context) return
  const sky = context.createLinearGradient(0, 0, 0, height)
  sky.addColorStop(0, '#1b1838')
  sky.addColorStop(0.6, '#4a2c4f')
  sky.addColorStop(1, '#c46a4a')
  context.fillStyle = sky
  context.fillRect(0, 0, width, height)

  // Faint early stars, fixed positions from a cheap hash.
  for (let s = 0; s < 40; s += 1) {
    const sx = ((s * 9301 + 49297) % 233280) / 233280
    const sy = ((s * 4057 + 1213) % 7919) / 7919
    const twinkle = 0.3 + 0.3 * Math.sin(seconds * 0.8 + s * 2.1)
    context.fillStyle = `rgba(255, 244, 220, ${twinkle * 0.6})`
    context.fillRect(sx * width, sy * height * 0.45, 1.5, 1.5)
  }

  const cx = width * 0.5
  const radius = Math.min(width, height) * 0.34
  const cy = height * 0.92 - radius * 1.15
  const angle = seconds * IDLE_SPIN + spin

  // Support legs.
  context.strokeStyle = '#2a1f33'
  context.lineWidth = Math.max(3, radius * 0.03)
  context.beginPath()
  context.moveTo(cx, cy)
  context.lineTo(cx - radius * 0.55, height)
  context.moveTo(cx, cy)
  context.lineTo(cx + radius * 0.55, height)
  context.stroke()

  // Spokes and rim.
  context.strokeStyle = 'rgba(240, 210, 230, 0.35)'
  context.lineWidth = 1.2
  context.beginPath()
  for (let g = 0; g < GONDOLAS; g += 1) {
    const a = angle + (g / GONDOLAS) * TWO_PI
    context.moveTo(cx, cy)
    context.lineTo(cx + Math.cos(a) * radius, cy + Math.sin(a) * radius)
  }
  context.stroke()
  context.lineWidth = 2
  context.beginPath()
  context.arc(cx, cy, radius, 0, TWO_PI)
  context.stroke()

  // Chasing rim bulbs.
  const chase = seconds * 6 + spin * 20
  for (let b = 0; b < BULBS; b += 1) {
    const a = angle + (b / BULBS) * TWO_PI
    const on = 0.25 + 0.75 * Math.max(0, Math.cos((b - chase) * 0.5))
    const hue = 40 + (b % 3) * 120
    context.fillStyle = `hsla(${hue}, 90%, 72%, ${on})`
    context.beginPath()
    context.arc(
      cx + Math.cos(a) * radius,
      cy + Math.sin(a) * radius,
      Math.max(1.5, radius * 0.012),
      0,
      TWO_PI,
    )
    context.fill()
  }

  // Hub.
  context.fillStyle = '#f2c66d'
  context.beginPath()
  context.arc(cx, cy, Math.max(4, radius * 0.05), 0, TWO_PI)
  context.fill()

  // Gondolas hang upright from the rim with a small sway.
  const size = radius * 0.16
  for (let g = 0; g < GONDOLAS; g += 1) {
    const a = angle + (g / GONDOLAS) * TWO_PI
    const px = cx + Math.cos(a) * radius
    const py = cy + Math.sin(a) * radius
    const sway =
      Math.sin(seconds * 1.3 + g * 0.9) * 0.06 + Math.sin(a) * spinRate * 0.4
    const dist = Math.hypot(px - pointerX, py + size - pointerY)
    const hover = pointerX >= 0 ? Math.max(0, 1 - dist / (size * 2.5)) : 0
    const hue = (g * 30) % 360

    context.save()
    context.translate(px, py)
    context.rotate(sway)
    context.strokeStyle = 'rgba(240, 210, 230, 0.6)'
    context.lineWidth = 1
    context.beginPath()
    context.moveTo(0, 0)
    context.lineTo(0, size * 0.45)
    context.stroke()
    context.fillStyle = `hsl(${hue}, 55%, ${45 + hover * 15}%)`
    context.beginPath()
    context.moveTo(-size * 0.6, size * 0.45)
    context.lineTo(size * 0.6, size * 0.45)
    context.lineTo(size * 0.5, size * 1.4)
    context.lineTo(-size * 0.5, size * 1.4)
    context.closePath()
    context.fill()
    context.fillStyle = `rgba(255, 226, 150, ${0.35 + hover * 0.6})`
    context.fillRect(-size * 0.35, size * 0.6, size * 0.7, size * 0.4)
    context.restore()
  }
}

function renderFrame(timestamp: number): void {
  if (!context) return
  const dt = lastFrameTs ? Math.min(0.1, (timestamp - lastFrameTs) / 1000) : 0
  lastFrameTs = timestamp
  strike = Math.max(0, strike - STRIKE_DECAY_PER_SEC * dt)
  clock += dt
  spinRate = strike * 0.5
  spin += spinRate * dt
  drawScene(clock)
  animationFrameId = window.requestAnimationFrame(renderFrame)
}

function handleMotionChange(event: MediaQueryListEvent): void {
  reducedMotion = event.matches
  strike = 0
  spinRate = 0
  pointerX = -1
  pointerY = -1
  if (reducedMotion) {
    if (animationFrameId !== null) window.cancelAnimationFrame(animationFrameId)
    animationFrameId = null
    drawScene(6)
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
    if (reducedMotion) drawScene(6)
  })
  resizeObserver.observe(canvas)
  window.addEventListener('pointermove', handlePointerMove, { passive: true })
  window.addEventListener('pointerdown', handlePointerDown, { passive: true })
  resizeCanvas()
  if (reducedMotion) drawScene(6)
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
.ferris-wheel-twilight {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}
</style>
