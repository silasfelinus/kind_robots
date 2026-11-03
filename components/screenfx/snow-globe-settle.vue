<template>
  <canvas ref="canvasRef" class="snow-globe-settle" />
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'

const canvasRef = ref<HTMLCanvasElement | null>(null)

// A glass snow globe over a tiny cottage. Each flake falls on a closed-form
// path (fall = clock * speed, wrapped), swaying side to side, so nothing needs
// per-flake state. A click "shakes" the globe: a swirl that decays away.
const FLAKES = 90
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
let kick = 0
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
  kick = 1
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

function drawCottage(cx: number, base: number, unit: number): void {
  if (!context) return
  context.fillStyle = '#6b4a35'
  context.fillRect(cx - unit * 0.9, base - unit * 1.1, unit * 1.8, unit * 1.1)
  context.fillStyle = '#e8eef5'
  context.beginPath()
  context.moveTo(cx - unit * 1.1, base - unit * 1.1)
  context.lineTo(cx, base - unit * 2)
  context.lineTo(cx + unit * 1.1, base - unit * 1.1)
  context.closePath()
  context.fill()
  context.fillStyle = '#ffd98a'
  context.fillRect(cx - unit * 0.55, base - unit * 0.85, unit * 0.4, unit * 0.4)
  context.fillStyle = '#3a2a20'
  context.fillRect(
    cx + unit * 0.2,
    base - unit * 0.75,
    unit * 0.35,
    unit * 0.75,
  )
}

function drawScene(seconds: number): void {
  if (!context) return
  const bg = context.createLinearGradient(0, 0, 0, height)
  bg.addColorStop(0, '#111a2e')
  bg.addColorStop(1, '#0a0f1c')
  context.fillStyle = bg
  context.fillRect(0, 0, width, height)

  const cx = width / 2
  const radius = Math.min(width * 0.42, height * 0.4)
  const cy = height * 0.46
  const baseY = cy + radius * 0.82

  // Glass dome interior.
  context.save()
  context.beginPath()
  context.arc(cx, cy, radius, 0, TWO_PI)
  context.clip()
  const glass = context.createRadialGradient(
    cx - radius * 0.3,
    cy - radius * 0.4,
    radius * 0.1,
    cx,
    cy,
    radius,
  )
  glass.addColorStop(0, '#2f4a73')
  glass.addColorStop(1, '#15233d')
  context.fillStyle = glass
  context.fillRect(cx - radius, cy - radius, radius * 2, radius * 2)

  // Snowy ground and cottage.
  context.fillStyle = '#dfe8f2'
  context.beginPath()
  context.ellipse(cx, baseY, radius * 0.95, radius * 0.22, 0, 0, TWO_PI)
  context.fill()
  drawCottage(cx, baseY, radius * 0.16)

  // Flakes.
  for (let i = 0; i < FLAKES; i += 1) {
    const speed = 0.035 + seeded(i, 1) * 0.04
    const swirl = kick * Math.sin(TWO_PI * (seconds * 0.4 + seeded(i, 5)))
    const fall = (seeded(i, 2) + seconds * speed * (1 - kick * 0.6)) % 1
    const sway =
      Math.sin(TWO_PI * (seconds * 0.07 + seeded(i, 3))) * radius * 0.05
    let x = cx + (seeded(i, 4) * 2 - 1) * radius * 0.92 + sway
    x += swirl * radius * 0.25
    const y =
      cy - radius * 0.95 + fall * radius * 1.7 - kick * swirl * radius * 0.1
    let size = 1 + seeded(i, 6) * 2.2
    if (
      pointerX >= 0 &&
      Math.hypot(x - pointerX, y - pointerY) < radius * 0.2
    ) {
      size *= 1.8
    }
    context.fillStyle = `rgba(255, 255, 255, ${0.5 + seeded(i, 7) * 0.5})`
    context.beginPath()
    context.arc(x, y, size, 0, TWO_PI)
    context.fill()
  }
  context.restore()

  // Glass rim and wooden base.
  context.strokeStyle = 'rgba(190, 220, 255, 0.55)'
  context.lineWidth = Math.max(2, width * 0.004)
  context.beginPath()
  context.arc(cx, cy, radius, 0, TWO_PI)
  context.stroke()
  context.fillStyle = '#5a3b27'
  context.beginPath()
  context.moveTo(cx - radius * 0.75, cy + radius * 0.8)
  context.lineTo(cx + radius * 0.75, cy + radius * 0.8)
  context.lineTo(cx + radius * 0.95, cy + radius * 1.15)
  context.lineTo(cx - radius * 0.95, cy + radius * 1.15)
  context.closePath()
  context.fill()
}

function renderFrame(timestamp: number): void {
  if (!context) return
  const dt = lastFrameTs ? Math.min(0.1, (timestamp - lastFrameTs) / 1000) : 0
  lastFrameTs = timestamp
  kick = Math.max(0, kick - KICK_DECAY_PER_SEC * dt)
  clock += dt
  drawScene(clock)
  animationFrameId = window.requestAnimationFrame(renderFrame)
}

function handleMotionChange(event: MediaQueryListEvent): void {
  reducedMotion = event.matches
  kick = 0
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
.snow-globe-settle {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}
</style>
