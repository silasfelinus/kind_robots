<template>
  <canvas ref="canvasRef" class="orbital-resonance-chords" />
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'

const canvasRef = ref<HTMLCanvasElement | null>(null)

// Six moons circle a small sun in whole-number resonance (1:2:3:4:5:6 laps per
// loop). Chords join neighbouring moons, so the web of lines reforms into the
// same figure every loop. Positions are closed-form in the loop clock.
const LOOP_SECONDS = 48
const MOONS = 6
const TRAIL_STEPS = 14
const TRAIL_SPAN = 0.9
const SPEED_BOOST_MAX = 3
const BOOST_COOLDOWN_MS = 3000
const BOOST_DECAY_PER_SEC = 0.6
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
let boost = 0
let lastBoostTs = 0
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
  if (now - lastBoostTs < BOOST_COOLDOWN_MS) return
  lastBoostTs = now
  boost = 1
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

function moonPosition(
  n: number,
  loopPos: number,
  radius: number,
): { x: number; y: number } {
  const orbit = radius * (0.3 + (n / (MOONS - 1)) * 0.7)
  const angle = TWO_PI * (n + 1) * loopPos + n * 1.1
  return {
    x: width / 2 + Math.cos(angle) * orbit,
    y: height / 2 + Math.sin(angle) * orbit,
  }
}

function drawScene(seconds: number): void {
  if (!context) return
  const bg = context.createRadialGradient(
    width / 2,
    height / 2,
    0,
    width / 2,
    height / 2,
    Math.max(width, height) * 0.7,
  )
  bg.addColorStop(0, '#16213e')
  bg.addColorStop(1, '#070b18')
  context.fillStyle = bg
  context.fillRect(0, 0, width, height)

  const radius = Math.min(width, height) * 0.44
  const loopPos =
    (((seconds % LOOP_SECONDS) + LOOP_SECONDS) % LOOP_SECONDS) / LOOP_SECONDS

  context.lineWidth = 1
  context.strokeStyle = 'rgba(160, 190, 255, 0.08)'
  for (let n = 0; n < MOONS; n += 1) {
    context.beginPath()
    context.arc(
      width / 2,
      height / 2,
      radius * (0.3 + (n / (MOONS - 1)) * 0.7),
      0,
      TWO_PI,
    )
    context.stroke()
  }

  // Chords from earlier instants fade out behind the current one.
  for (let s = TRAIL_STEPS; s >= 0; s -= 1) {
    const past = loopPos - (s / TRAIL_STEPS) * (TRAIL_SPAN / LOOP_SECONDS) * 4
    const alpha = (1 - s / (TRAIL_STEPS + 1)) * (s === 0 ? 0.55 : 0.18)
    context.strokeStyle = `rgba(120, 220, 255, ${alpha})`
    context.beginPath()
    for (let n = 0; n < MOONS; n += 1) {
      const p = moonPosition(n, past, radius)
      if (n === 0) context.moveTo(p.x, p.y)
      else context.lineTo(p.x, p.y)
    }
    context.stroke()
  }

  for (let n = 0; n < MOONS; n += 1) {
    const p = moonPosition(n, loopPos, radius)
    let glow = 0
    if (pointerX >= 0) {
      glow = Math.max(
        0,
        1 - Math.hypot(p.x - pointerX, p.y - pointerY) / (radius * 0.5),
      )
    }
    const hue = 190 + n * 28
    context.fillStyle = `hsl(${hue}, 80%, ${62 + glow * 20}%)`
    context.beginPath()
    context.arc(p.x, p.y, 4 + n * 0.6 + glow * 4, 0, TWO_PI)
    context.fill()
  }

  context.fillStyle = '#ffd36b'
  context.beginPath()
  context.arc(width / 2, height / 2, radius * 0.06, 0, TWO_PI)
  context.fill()
}

function renderFrame(timestamp: number): void {
  if (!context) return
  const dt = lastFrameTs ? Math.min(0.1, (timestamp - lastFrameTs) / 1000) : 0
  lastFrameTs = timestamp
  boost = Math.max(0, boost - BOOST_DECAY_PER_SEC * dt)
  clock += dt * (1 + boost * (SPEED_BOOST_MAX - 1))
  drawScene(clock)
  animationFrameId = window.requestAnimationFrame(renderFrame)
}

function handleMotionChange(event: MediaQueryListEvent): void {
  reducedMotion = event.matches
  boost = 0
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
.orbital-resonance-chords {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}
</style>
