<template>
  <canvas ref="canvasRef" class="harmonograph-sand-table" />
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'

const canvasRef = ref<HTMLCanvasElement | null>(null)
let context: CanvasRenderingContext2D | null = null
let traceCanvas: HTMLCanvasElement | null = null
let traceContext: CanvasRenderingContext2D | null = null
let resizeObserver: ResizeObserver | null = null
let motionQuery: MediaQueryList | null = null
let animationFrameId: number | null = null
let width = 1
let height = 1
let dpr = 1
let reducedMotion = false
let cycleStartedAt = 0
let lastTraceAt = 0
let segmentCount = 0
let rakeStartedAt: number | null = null
let forcedSweepUsed = false
let phaseSeed = Math.random() * Math.PI * 2
let pointerNudge = 0

const MAX_SEGMENTS = 7200
const TRACE_INTERVAL_MS = 9
const RAKE_DURATION_MS = 2200
const CYCLE_LIMIT_MS = 26000
const pointer = { x: 0, y: 0, active: false }

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

function harmonographPoint(elapsed: number): { x: number; y: number } {
  const t = elapsed / 1000
  const damping = Math.exp(-t * 0.055)
  const drift = pointerNudge * 0.035
  const xWave = Math.sin(t * (2.13 + drift) + phaseSeed)
  const yWave = Math.sin(t * (2.87 - drift) + phaseSeed * 0.63 + 0.8)
  return {
    x: width / 2 + xWave * width * 0.38 * damping,
    y: height / 2 + yWave * height * 0.38 * damping,
  }
}

function clearTrace(): void {
  traceContext?.clearRect(0, 0, width, height)
  segmentCount = 0
  lastTraceAt = 0
}

function resetCycle(timestamp: number): void {
  clearTrace()
  cycleStartedAt = timestamp
  phaseSeed = Math.random() * Math.PI * 2
  pointerNudge = 0
  rakeStartedAt = null
  forcedSweepUsed = false
}

function addTrace(timestamp: number): void {
  if (!traceContext || rakeStartedAt !== null) return
  if (timestamp - lastTraceAt < TRACE_INTERVAL_MS) return
  const elapsed = timestamp - cycleStartedAt
  const current = harmonographPoint(elapsed)
  const previous = harmonographPoint(Math.max(0, elapsed - TRACE_INTERVAL_MS))
  traceContext.strokeStyle = 'rgba(84, 59, 38, 0.72)'
  traceContext.lineWidth = 1.15
  traceContext.beginPath()
  traceContext.moveTo(previous.x, previous.y)
  traceContext.lineTo(current.x, current.y)
  traceContext.stroke()
  lastTraceAt = timestamp
  segmentCount += 1
  if (segmentCount >= MAX_SEGMENTS || elapsed >= CYCLE_LIMIT_MS)
    rakeStartedAt = timestamp
}

function drawTable(ctx: CanvasRenderingContext2D, timestamp: number): void {
  ctx.clearRect(0, 0, width, height)
  const sand = ctx.createRadialGradient(
    width / 2,
    height / 2,
    0,
    width / 2,
    height / 2,
    Math.max(width, height) * 0.7,
  )
  sand.addColorStop(0, 'rgba(229, 207, 164, 0.46)')
  sand.addColorStop(1, 'rgba(118, 86, 54, 0.28)')
  ctx.fillStyle = sand
  ctx.fillRect(0, 0, width, height)

  if (traceCanvas) ctx.drawImage(traceCanvas, 0, 0, width, height)

  if (rakeStartedAt !== null) {
    const progress = clamp((timestamp - rakeStartedAt) / RAKE_DURATION_MS, 0, 1)
    const x = -width * 0.15 + progress * width * 1.3
    ctx.fillStyle = 'rgba(93, 62, 38, 0.68)'
    ctx.fillRect(x, 0, Math.max(8, width * 0.018), height)
    if (traceContext) traceContext.clearRect(0, 0, x + width * 0.03, height)
    if (progress >= 1) resetCycle(timestamp)
  }

  const elapsed = timestamp - cycleStartedAt
  const stylus = harmonographPoint(Math.max(0, elapsed))
  ctx.fillStyle = 'rgba(38, 31, 27, 0.72)'
  ctx.beginPath()
  ctx.arc(stylus.x, stylus.y, reducedMotion ? 3 : 4, 0, Math.PI * 2)
  ctx.fill()

  if (reducedMotion) {
    ctx.fillStyle = `rgba(255, 244, 218, ${0.018 + Math.sin(timestamp * 0.0002) * 0.008})`
    ctx.fillRect(0, 0, width, height)
  }
}

function renderFrame(timestamp: number): void {
  if (!context) return
  if (!cycleStartedAt) cycleStartedAt = timestamp
  if (!reducedMotion) addTrace(timestamp)
  drawTable(context, timestamp)
  animationFrameId = window.requestAnimationFrame(renderFrame)
}

function eventPoint(
  event: PointerEvent | MouseEvent,
): { x: number; y: number } | null {
  const canvas = canvasRef.value
  if (!canvas) return null
  const rect = canvas.getBoundingClientRect()
  if (rect.width <= 0 || rect.height <= 0) return null
  return {
    x: ((event.clientX - rect.left) / rect.width) * width,
    y: ((event.clientY - rect.top) / rect.height) * height,
  }
}

function onPointerMove(event: PointerEvent): void {
  if (reducedMotion) return
  const point = eventPoint(event)
  if (!point) return
  pointer.x = point.x
  pointer.y = point.y
  pointer.active = true
  const distance = Math.hypot(point.x - width / 2, point.y - height / 2)
  pointerNudge = clamp(1 - distance / Math.max(width, height), 0, 1)
}

function onPointerLeave(): void {
  pointer.active = false
  pointerNudge = 0
}

function onClick(): void {
  if (reducedMotion || rakeStartedAt !== null || forcedSweepUsed) return
  forcedSweepUsed = true
  rakeStartedAt = performance.now()
}

function configureCanvas(): void {
  const canvas = canvasRef.value
  if (!canvas) return
  const rect = canvas.getBoundingClientRect()
  width = Math.max(1, Math.round(rect.width))
  height = Math.max(1, Math.round(rect.height))
  dpr = Math.min(window.devicePixelRatio || 1, 2)
  canvas.width = Math.round(width * dpr)
  canvas.height = Math.round(height * dpr)
  context = canvas.getContext('2d')
  context?.setTransform(dpr, 0, 0, dpr, 0, 0)

  traceCanvas = document.createElement('canvas')
  traceCanvas.width = width
  traceCanvas.height = height
  traceContext = traceCanvas.getContext('2d')
  cycleStartedAt = performance.now()
  clearTrace()

  if (reducedMotion && traceContext) {
    traceContext.strokeStyle = 'rgba(84, 59, 38, 0.72)'
    traceContext.lineWidth = 1.15
    traceContext.beginPath()
    for (let i = 0; i <= 900; i += 1) {
      const point = harmonographPoint(i * 14)
      if (i === 0) traceContext.moveTo(point.x, point.y)
      else traceContext.lineTo(point.x, point.y)
    }
    traceContext.stroke()
  }
}

function onMotionChange(event: MediaQueryListEvent): void {
  reducedMotion = event.matches
  configureCanvas()
}

onMounted(() => {
  motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
  reducedMotion = motionQuery.matches
  motionQuery.addEventListener('change', onMotionChange)
  configureCanvas()
  resizeObserver = new ResizeObserver(configureCanvas)
  if (canvasRef.value) resizeObserver.observe(canvasRef.value)
  window.addEventListener('pointermove', onPointerMove, { passive: true })
  window.addEventListener('pointerleave', onPointerLeave)
  window.addEventListener('click', onClick, { passive: true })
  animationFrameId = window.requestAnimationFrame(renderFrame)
})

onBeforeUnmount(() => {
  if (animationFrameId !== null) window.cancelAnimationFrame(animationFrameId)
  resizeObserver?.disconnect()
  motionQuery?.removeEventListener('change', onMotionChange)
  window.removeEventListener('pointermove', onPointerMove)
  window.removeEventListener('pointerleave', onPointerLeave)
  window.removeEventListener('click', onClick)
  traceCanvas = null
  traceContext = null
  context = null
})
</script>

<style scoped>
.harmonograph-sand-table {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}
</style>
