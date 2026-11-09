<template>
  <canvas ref="canvasRef" class="paper-boat-regatta" />
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
let drift = 0
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

// Paper boats bob along a dark stream on staggered speeds. Position is a
// closed-form function of time, so nothing per-boat is stored. Hover tilts the
// nearest boat's sail glow; a click sends a breeze that speeds them up
// briefly (rate-limited).
const BOATS = 6

function drawScene(seconds: number): void {
  if (!context) return
  const bg = context.createLinearGradient(0, 0, 0, height)
  bg.addColorStop(0, '#12202e')
  bg.addColorStop(1, '#08121a')
  context.fillStyle = bg
  context.fillRect(0, 0, width, height)

  // Gentle current lines.
  context.lineWidth = 1
  for (let l = 0; l < 7; l += 1) {
    const y = height * (0.3 + l * 0.1)
    context.strokeStyle = `rgba(140, 190, 220, ${0.06 + (l % 2) * 0.04})`
    context.beginPath()
    for (let x = 0; x <= width; x += 12) {
      const yy = y + Math.sin(x * 0.015 + seconds * 0.6 + l) * 4
      if (x === 0) context.moveTo(x, yy)
      else context.lineTo(x, yy)
    }
    context.stroke()
  }

  const unit = Math.min(width / 6, height * 0.2)
  for (let i = 0; i < BOATS; i += 1) {
    const lane = height * (0.34 + (i % 4) * 0.12)
    const speed = 0.02 + i * 0.006
    const progress = ((seconds * speed + drift * (1 + i * 0.1) + i * 0.19) % 1.2) - 0.1
    const x = progress * width
    const bob = Math.sin(seconds * 1.4 + i * 1.3)
    const y = lane + bob * unit * 0.05
    const tilt = Math.sin(seconds * 1.1 + i) * 0.08
    const dist = Math.hypot(x - pointerX, y - pointerY)
    const hover = pointerX >= 0 ? Math.max(0, 1 - dist / (unit * 1.3)) : 0
    const hue = (i * 53 + 20) % 360

    context.save()
    context.translate(x, y)
    context.rotate(tilt)
    // Wake rings.
    context.strokeStyle = `hsla(${hue}, 40%, 75%, 0.18)`
    context.lineWidth = 1.2
    context.beginPath()
    context.ellipse(0, unit * 0.12, unit * 0.55, unit * 0.1, 0, 0, TWO_PI)
    context.stroke()
    // Hull.
    context.fillStyle = `hsl(${hue}, 55%, ${72 + hover * 12}%)`
    context.beginPath()
    context.moveTo(-unit * 0.4, 0)
    context.lineTo(unit * 0.4, 0)
    context.lineTo(unit * 0.25, unit * 0.14)
    context.lineTo(-unit * 0.25, unit * 0.14)
    context.closePath()
    context.fill()
    // Sail.
    context.fillStyle = `hsla(${hue}, 60%, ${84 + hover * 10}%, ${0.88 + hover * 0.1})`
    context.beginPath()
    context.moveTo(0, -unit * 0.55)
    context.lineTo(unit * 0.28, -unit * 0.02)
    context.lineTo(-unit * 0.04, -unit * 0.02)
    context.closePath()
    context.fill()
    context.restore()
  }
}

function renderFrame(timestamp: number): void {
  if (!context) return
  const dt = lastFrameTs ? Math.min(0.1, (timestamp - lastFrameTs) / 1000) : 0
  lastFrameTs = timestamp
  strike = Math.max(0, strike - STRIKE_DECAY_PER_SEC * dt)
  clock += dt
  drift += strike * 0.04 * dt
  drawScene(clock)
  animationFrameId = window.requestAnimationFrame(renderFrame)
}

function handleMotionChange(event: MediaQueryListEvent): void {
  reducedMotion = event.matches
  strike = 0
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
.paper-boat-regatta {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}
</style>
