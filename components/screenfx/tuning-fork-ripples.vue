<template>
  <canvas ref="canvasRef" class="tuning-fork-ripples" />
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'

const canvasRef = ref<HTMLCanvasElement | null>(null)

// Tuning forks stand in a dark pond. Each fork is struck on its own repeating
// cycle: the tines shiver, fade, and send ripples across the water. Phase is a
// pure function of time, so nothing per-fork is stored. Hover warms the
// nearest fork; a click strikes every fork at once (rate-limited).
const FORKS = 5
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

// One fork's ring: time since its last strike, a repeating closed-form cycle.
function ringAge(seconds: number, index: number): number {
  const period = 7 + index * 1.4
  return (seconds + index * 2.9) % period
}

function drawScene(seconds: number): void {
  if (!context) return
  const bg = context.createLinearGradient(0, 0, 0, height)
  bg.addColorStop(0, '#0f1a24')
  bg.addColorStop(1, '#070d14')
  context.fillStyle = bg
  context.fillRect(0, 0, width, height)

  const unit = Math.min(width / (FORKS + 1), height * 0.3)
  for (let i = 0; i < FORKS; i += 1) {
    const cx = (width * (i + 1)) / (FORKS + 1)
    const baseY = height * (0.62 + (i % 2) * 0.08)
    const age = ringAge(seconds, i)
    const struck = Math.max(0, 1 - age / 5) + strike * Math.exp(-age * 0.2)
    const amp = Math.min(1.4, struck)
    const freq = 9 + i * 1.6
    const dist = Math.hypot(cx - pointerX, baseY - unit * 0.6 - pointerY)
    const hover = pointerX >= 0 ? Math.max(0, 1 - dist / (unit * 1.2)) : 0
    const hue = (i * 47 + 170) % 360

    // Expanding ripple rings on the water around the fork's foot.
    for (let r = 0; r < 4; r += 1) {
      const rAge = age - r * 0.6
      if (rAge <= 0 || rAge > 4.5) continue
      const fade = 1 - rAge / 4.5
      context.strokeStyle = `hsla(${hue}, 70%, 70%, ${fade * 0.45 + hover * 0.2})`
      context.lineWidth = 1.5
      context.beginPath()
      context.ellipse(
        cx,
        baseY,
        unit * (0.15 + rAge * 0.32),
        unit * (0.15 + rAge * 0.32) * 0.28,
        0,
        0,
        TWO_PI,
      )
      context.stroke()
    }

    // Fork: handle plus two tines that shiver in opposite directions.
    const shiver = Math.sin(seconds * freq) * amp * unit * 0.025
    const tineGap = unit * 0.07
    const tineTop = baseY - unit * 0.95
    const stemTop = baseY - unit * 0.45
    context.strokeStyle = `hsl(${hue}, ${20 + hover * 40}%, ${72 + hover * 15}%)`
    context.lineWidth = Math.max(2, unit * 0.04)
    context.lineCap = 'round'
    context.beginPath()
    context.moveTo(cx, baseY)
    context.lineTo(cx, stemTop)
    context.stroke()
    for (const side of [-1, 1]) {
      context.beginPath()
      context.moveTo(cx, stemTop)
      context.quadraticCurveTo(
        cx + side * (tineGap + shiver * side * 0.5),
        stemTop - unit * 0.1,
        cx + side * (tineGap + shiver * side),
        tineTop,
      )
      context.stroke()
      // Soft glow while a tine is humming.
      context.fillStyle = `hsla(${hue}, 80%, 75%, ${Math.min(0.6, amp * 0.3 + hover * 0.3)})`
      context.beginPath()
      context.arc(
        cx + side * (tineGap + shiver * side),
        tineTop,
        unit * 0.05 * (0.5 + amp),
        0,
        TWO_PI,
      )
      context.fill()
    }
  }
}

function renderFrame(timestamp: number): void {
  if (!context) return
  const dt = lastFrameTs ? Math.min(0.1, (timestamp - lastFrameTs) / 1000) : 0
  lastFrameTs = timestamp
  strike = Math.max(0, strike - STRIKE_DECAY_PER_SEC * dt)
  clock += dt
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
.tuning-fork-ripples {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}
</style>
