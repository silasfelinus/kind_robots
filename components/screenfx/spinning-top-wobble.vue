<template>
  <canvas ref="canvasRef" class="spinning-top-wobble" />
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'

const canvasRef = ref<HTMLCanvasElement | null>(null)

// Painted wooden tops spin on a dark tabletop. Each top lives a closed-form
// life: a quick spin-up, a long steady spin, then a growing wobble before it
// is flicked up again. Phase is a pure function of time, so nothing per-top is
// stored. Hover lights the nearest top; a click flicks every top into a
// rate-limited extra-fast spin that fades away.
const TOPS = 5
const KICK_COOLDOWN_MS = 3000
const KICK_DECAY_PER_SEC = 0.4
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
let spinBoost = 0
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
  spinBoost = 1
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

// Life cycle of one top: returns spin 0..1 and wobble 0..1 for a time.
function life(
  seconds: number,
  index: number,
): { spin: number; wobble: number } {
  const period = 16 + index * 2.3
  const t = ((seconds + index * 5.7) % period) / period
  if (t < 0.1) return { spin: t / 0.1, wobble: 0 }
  if (t < 0.7) return { spin: 1, wobble: 0.04 }
  const k = (t - 0.7) / 0.3
  return { spin: 1 - k * 0.75, wobble: 0.04 + k * k * 0.96 }
}

function drawScene(seconds: number): void {
  if (!context) return
  const bg = context.createLinearGradient(0, 0, 0, height)
  bg.addColorStop(0, '#15121f')
  bg.addColorStop(1, '#0b0912')
  context.fillStyle = bg
  context.fillRect(0, 0, width, height)

  const tableY = height * 0.6
  const table = context.createLinearGradient(0, tableY, 0, height)
  table.addColorStop(0, 'rgba(120, 78, 44, 0.45)')
  table.addColorStop(1, 'rgba(40, 24, 14, 0.15)')
  context.fillStyle = table
  context.fillRect(0, tableY, width, height - tableY)

  const unit = Math.min(width / (TOPS + 1), height * 0.3)
  for (let i = 0; i < TOPS; i += 1) {
    const cx = (width * (i + 1)) / (TOPS + 1)
    const baseY = tableY + height * (0.1 + (i % 2) * 0.07)
    const { spin, wobble } = life(seconds, i)
    const rate = spin * (1 + spinBoost * 1.2)
    const phase = seconds * rate * 9 + i * 1.7
    const lean = Math.sin(seconds * 3.1 + i) * wobble * 0.5
    const dist = Math.hypot(cx - pointerX, baseY - unit * 0.5 - pointerY)
    const hover = pointerX >= 0 ? Math.max(0, 1 - dist / (unit * 1.2)) : 0
    const hue = (i * 62 + 8) % 360

    context.save()
    context.translate(cx, baseY)

    // Shadow on the table.
    context.fillStyle = 'rgba(0, 0, 0, 0.35)'
    context.beginPath()
    context.ellipse(
      unit * 0.05,
      unit * 0.04,
      unit * 0.32,
      unit * 0.07,
      0,
      0,
      TWO_PI,
    )
    context.fill()

    context.rotate(lean)
    const bodyW = unit * 0.34 * (0.55 + spin * 0.45)
    const bodyH = unit * 0.5
    // Spindle handle and tip.
    context.strokeStyle = '#d8c9a4'
    context.lineWidth = Math.max(2, unit * 0.04)
    context.beginPath()
    context.moveTo(0, -bodyH * 1.25)
    context.lineTo(0, -bodyH * 0.55)
    context.stroke()
    // Body: two cones.
    context.fillStyle = `hsl(${hue}, ${55 + hover * 25}%, ${48 + hover * 18}%)`
    context.beginPath()
    context.moveTo(-bodyW, -bodyH * 0.55)
    context.lineTo(bodyW, -bodyH * 0.55)
    context.lineTo(0, 0)
    context.closePath()
    context.fill()
    // Painted band that slides sideways as the top turns.
    const stripe = Math.sin(phase) * bodyW * 0.7
    context.fillStyle = `hsla(${hue + 160}, 70%, 80%, 0.8)`
    context.fillRect(
      stripe - bodyW * 0.08,
      -bodyH * 0.55,
      bodyW * 0.16,
      bodyH * 0.4,
    )
    // Spin blur ring.
    context.strokeStyle = `rgba(255, 245, 220, ${0.1 + spin * 0.25 + hover * 0.3})`
    context.lineWidth = 1.5
    context.beginPath()
    context.ellipse(0, -bodyH * 0.55, bodyW * 1.1, bodyW * 0.22, 0, 0, TWO_PI)
    context.stroke()
    context.restore()
  }
}

function renderFrame(timestamp: number): void {
  if (!context) return
  const dt = lastFrameTs ? Math.min(0.1, (timestamp - lastFrameTs) / 1000) : 0
  lastFrameTs = timestamp
  spinBoost = Math.max(0, spinBoost - KICK_DECAY_PER_SEC * dt)
  clock += dt
  drawScene(clock)
  animationFrameId = window.requestAnimationFrame(renderFrame)
}

function handleMotionChange(event: MediaQueryListEvent): void {
  reducedMotion = event.matches
  spinBoost = 0
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
.spinning-top-wobble {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}
</style>
