<template>
  <canvas ref="canvasRef" class="lissajous-lantern-loom" />
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'

const canvasRef = ref<HTMLCanvasElement | null>(null)

// Three lantern threads trace Lissajous curves (3:2, 4:3, 5:4 frequency pairs).
// Each thread leaves a fading trail, and the phase drifts by a whole turn per
// loop so the figure reforms exactly when the loop clock wraps.
const LOOP_SECONDS = 40
const THREADS = [
  { fx: 3, fy: 2, hue: 38 },
  { fx: 4, fy: 3, hue: 330 },
  { fx: 5, fy: 4, hue: 190 },
]
const TRAIL_POINTS = 90
const TRAIL_SPAN = 0.12
const PULSE_COOLDOWN_MS = 2500
const PULSE_DECAY_PER_SEC = 0.5
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
let pulse = 0
let lastPulseTs = 0
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
  if (now - lastPulseTs < PULSE_COOLDOWN_MS) return
  lastPulseTs = now
  pulse = 1
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

function threadPoint(
  index: number,
  t: number,
  loopPos: number,
): { x: number; y: number } {
  const thread = THREADS[index]!
  const phase = TWO_PI * loopPos * (index + 1)
  const rx = width * (0.38 - index * 0.04)
  const ry = height * (0.38 - index * 0.04)
  return {
    x: width / 2 + Math.sin(thread.fx * t + phase) * rx,
    y: height / 2 + Math.sin(thread.fy * t) * ry,
  }
}

function drawScene(seconds: number): void {
  if (!context) return
  const ctx = context
  ctx.fillStyle = '#0b0a14'
  ctx.fillRect(0, 0, width, height)

  const loopPos =
    (((seconds % LOOP_SECONDS) + LOOP_SECONDS) % LOOP_SECONDS) / LOOP_SECONDS
  const head = loopPos * TWO_PI * 6

  ctx.lineCap = 'round'
  THREADS.forEach((thread, index) => {
    for (let i = 0; i < TRAIL_POINTS; i += 1) {
      const age = i / TRAIL_POINTS
      const a = threadPoint(index, head - age * TRAIL_SPAN * TWO_PI * 3, loopPos)
      const b = threadPoint(
        index,
        head - ((i + 1) / TRAIL_POINTS) * TRAIL_SPAN * TWO_PI * 3,
        loopPos,
      )
      const alpha = (1 - age) * (0.55 + pulse * 0.35)
      ctx.strokeStyle = `hsla(${thread.hue}, 85%, 68%, ${alpha})`
      ctx.lineWidth = 1 + (1 - age) * (1.6 + pulse * 1.4)
      ctx.beginPath()
      ctx.moveTo(a.x, a.y)
      ctx.lineTo(b.x, b.y)
      ctx.stroke()
    }
  })

  THREADS.forEach((thread, index) => {
    const p = threadPoint(index, head, loopPos)
    let glow = 0
    if (pointerX >= 0) {
      glow = Math.max(
        0,
        1 - Math.hypot(p.x - pointerX, p.y - pointerY) / (width * 0.18),
      )
    }
    const halo = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, 22)
    halo.addColorStop(0, `hsla(${thread.hue}, 90%, 75%, ${0.55 + glow * 0.3})`)
    halo.addColorStop(1, `hsla(${thread.hue}, 90%, 60%, 0)`)
    ctx.fillStyle = halo
    ctx.beginPath()
    ctx.arc(p.x, p.y, 22, 0, TWO_PI)
    ctx.fill()
    ctx.fillStyle = `hsl(${thread.hue}, 90%, ${82 + glow * 10}%)`
    ctx.beginPath()
    ctx.arc(p.x, p.y, 3.5 + glow * 3, 0, TWO_PI)
    ctx.fill()
  })
}

function renderFrame(timestamp: number): void {
  if (!context) return
  const dt = lastFrameTs ? Math.min(0.1, (timestamp - lastFrameTs) / 1000) : 0
  lastFrameTs = timestamp
  pulse = Math.max(0, pulse - PULSE_DECAY_PER_SEC * dt)
  clock += dt
  drawScene(clock)
  animationFrameId = window.requestAnimationFrame(renderFrame)
}

function handleMotionChange(event: MediaQueryListEvent): void {
  reducedMotion = event.matches
  pulse = 0
  pointerX = -1
  pointerY = -1
  if (reducedMotion) drawScene(0)
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
.lissajous-lantern-loom {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}
</style>
