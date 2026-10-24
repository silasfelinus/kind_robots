<template>
  <canvas ref="canvasRef" class="wind-chime-garden" />
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'

const canvasRef = ref<HTMLCanvasElement | null>(null)

// Seven wind chimes hang from a beam. Each swings on its own period (a sum of
// two sines standing in for gusts) and, once per swing, strikes its neighbour
// and sends out a fading ring. Everything is closed-form in the clock.
const CHIMES = 7
const WIND_SECONDS = 36
const SWAY_MAX = 0.28
const BOOST_MAX = 2.4
const BOOST_COOLDOWN_MS = 3000
const BOOST_DECAY_PER_SEC = 0.5
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
let gust = 0
let lastGustTs = 0
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
  if (now - lastGustTs < BOOST_COOLDOWN_MS) return
  lastGustTs = now
  gust = 1
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

function swing(n: number, seconds: number, amp: number): number {
  const base = TWO_PI / WIND_SECONDS
  const gustWave = Math.sin(base * seconds * (1 + n * 0.5) + n * 1.7)
  const lull = 0.55 + 0.45 * Math.sin(base * seconds + n * 0.6)
  return amp * lull * gustWave
}

function drawScene(seconds: number): void {
  if (!context) return
  const bg = context.createLinearGradient(0, 0, 0, height)
  bg.addColorStop(0, '#1d2b4a')
  bg.addColorStop(1, '#0b1020')
  context.fillStyle = bg
  context.fillRect(0, 0, width, height)

  const beamY = height * 0.16
  const spacing = width / (CHIMES + 1)
  const amp = SWAY_MAX * (1 + gust * (BOOST_MAX - 1))
  context.strokeStyle = '#6a5a48'
  context.lineWidth = 6
  context.beginPath()
  context.moveTo(spacing * 0.4, beamY)
  context.lineTo(width - spacing * 0.4, beamY)
  context.stroke()

  for (let n = 0; n < CHIMES; n += 1) {
    const anchorX = spacing * (n + 1)
    const tubeLen = height * (0.3 + 0.045 * (n % 4))
    const angle = swing(n, seconds, amp)
    const endX = anchorX + Math.sin(angle) * tubeLen
    const endY = beamY + Math.cos(angle) * tubeLen

    // Strike ring: one per swing, expanding and fading from the tube's tip.
    const period = 3.2 + n * 0.45
    const ringPhase = (((seconds / period + n * 0.31) % 1) + 1) % 1
    const ringAlpha = (1 - ringPhase) * 0.35
    context.strokeStyle = `rgba(190, 230, 255, ${ringAlpha})`
    context.lineWidth = 1.5
    context.beginPath()
    context.arc(endX, endY, 6 + ringPhase * height * 0.12, 0, TWO_PI)
    context.stroke()

    let glow = 0
    if (pointerX >= 0) {
      glow = Math.max(
        0,
        1 - Math.hypot(endX - pointerX, endY - pointerY) / (height * 0.25),
      )
    }
    context.strokeStyle = 'rgba(200, 210, 230, 0.4)'
    context.lineWidth = 1
    context.beginPath()
    context.moveTo(anchorX, beamY)
    context.lineTo(endX, endY)
    context.stroke()

    const hue = 190 + n * 24
    context.strokeStyle = `hsl(${hue}, 70%, ${58 + glow * 24}%)`
    context.lineWidth = 8 + glow * 3
    context.lineCap = 'round'
    context.beginPath()
    context.moveTo(endX, endY)
    context.lineTo(
      endX + Math.sin(angle) * tubeLen * 0.28,
      endY + Math.cos(angle) * tubeLen * 0.28,
    )
    context.stroke()
  }
}

function renderFrame(timestamp: number): void {
  if (!context) return
  const dt = lastFrameTs ? Math.min(0.1, (timestamp - lastFrameTs) / 1000) : 0
  lastFrameTs = timestamp
  gust = Math.max(0, gust - BOOST_DECAY_PER_SEC * dt)
  clock += dt
  drawScene(clock)
  animationFrameId = window.requestAnimationFrame(renderFrame)
}

function handleMotionChange(event: MediaQueryListEvent): void {
  reducedMotion = event.matches
  gust = 0
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
.wind-chime-garden {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}
</style>
