<template>
  <canvas ref="canvasRef" class="kite-festival-sky" />
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'

const canvasRef = ref<HTMLCanvasElement | null>(null)

// Six diamond kites ride slow thermals above a hillside. Each kite's position
// is a closed-form Lissajous drift of the clock, its string bows toward the
// ground anchor, and its tail is a ribbon of bows trailing a lagged path.
const KITES = 6
const TAIL_BOWS = 7
const DRIFT_SECONDS = 48
const LIFT_MAX = 2.2
const LIFT_COOLDOWN_MS = 3000
const LIFT_DECAY_PER_SEC = 0.5
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
let lift = 0
let lastLiftTs = 0
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
  if (now - lastLiftTs < LIFT_COOLDOWN_MS) return
  lastLiftTs = now
  lift = 1
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

function kitePosition(
  n: number,
  seconds: number,
  anchorX: number,
): { x: number; y: number } {
  const base = TWO_PI / DRIFT_SECONDS
  const rise = 1 + lift * (LIFT_MAX - 1) * 0.25
  const x =
    anchorX + Math.sin(base * seconds * (1 + n * 0.25) + n * 1.9) * width * 0.09
  const y =
    height *
    (0.3 + 0.06 * (n % 3) - 0.05 * (rise - 1)) *
    (1 + 0.12 * Math.sin(base * seconds * 2 + n * 0.8))
  return { x, y }
}

function drawKite(
  x: number,
  y: number,
  size: number,
  tilt: number,
  hue: number,
  glow: number,
): void {
  if (!context) return
  context.save()
  context.translate(x, y)
  context.rotate(tilt)
  context.fillStyle = `hsl(${hue}, 75%, ${58 + glow * 20}%)`
  context.beginPath()
  context.moveTo(0, -size)
  context.lineTo(size * 0.62, -size * 0.1)
  context.lineTo(0, size * 1.1)
  context.lineTo(-size * 0.62, -size * 0.1)
  context.closePath()
  context.fill()
  context.strokeStyle = 'rgba(255, 255, 255, 0.55)'
  context.lineWidth = 1
  context.beginPath()
  context.moveTo(0, -size)
  context.lineTo(0, size * 1.1)
  context.moveTo(-size * 0.62, -size * 0.1)
  context.lineTo(size * 0.62, -size * 0.1)
  context.stroke()
  context.restore()
}

function drawScene(seconds: number): void {
  if (!context) return
  const sky = context.createLinearGradient(0, 0, 0, height)
  sky.addColorStop(0, '#3b6fb6')
  sky.addColorStop(0.7, '#f3c98b')
  sky.addColorStop(1, '#f7e1b5')
  context.fillStyle = sky
  context.fillRect(0, 0, width, height)

  const hillY = height * 0.88
  context.fillStyle = '#3f6b3a'
  context.beginPath()
  context.moveTo(0, height)
  context.lineTo(0, hillY)
  context.quadraticCurveTo(width * 0.5, hillY - height * 0.1, width, hillY)
  context.lineTo(width, height)
  context.closePath()
  context.fill()

  const spacing = width / (KITES + 1)
  for (let n = 0; n < KITES; n += 1) {
    const anchorX = spacing * (n + 1)
    const anchorY =
      hillY - height * 0.04 * Math.sin((anchorX / width) * Math.PI)
    const kite = kitePosition(n, seconds, anchorX)
    const lag = kitePosition(n, seconds - 0.8, anchorX)
    const tilt = Math.atan2(kite.x - lag.x, 40) * 2.5

    context.strokeStyle = 'rgba(255, 255, 255, 0.55)'
    context.lineWidth = 1
    context.beginPath()
    context.moveTo(anchorX, anchorY)
    context.quadraticCurveTo(
      (anchorX + kite.x) / 2 + (lag.x - kite.x) * 3,
      (anchorY + kite.y) / 2 + height * 0.06,
      kite.x,
      kite.y,
    )
    context.stroke()

    const size = Math.min(width, height) * 0.055
    for (let b = 1; b <= TAIL_BOWS; b += 1) {
      const past = kitePosition(n, seconds - b * 0.35, anchorX)
      const tx = past.x + Math.sin(seconds * 2 + b + n) * 4
      const ty = kite.y + size * 1.1 + b * size * 0.55
      context.fillStyle = b % 2 ? '#ffffff' : '#ff6f91'
      context.beginPath()
      context.arc(tx + (kite.x - past.x) * 0.2, ty, 3, 0, TWO_PI)
      context.fill()
    }

    let glow = 0
    if (pointerX >= 0) {
      glow = Math.max(
        0,
        1 - Math.hypot(kite.x - pointerX, kite.y - pointerY) / (height * 0.25),
      )
    }
    drawKite(kite.x, kite.y, size * (1 + glow * 0.15), tilt, 10 + n * 55, glow)
  }
}

function renderFrame(timestamp: number): void {
  if (!context) return
  const dt = lastFrameTs ? Math.min(0.1, (timestamp - lastFrameTs) / 1000) : 0
  lastFrameTs = timestamp
  lift = Math.max(0, lift - LIFT_DECAY_PER_SEC * dt)
  clock += dt
  drawScene(clock)
  animationFrameId = window.requestAnimationFrame(renderFrame)
}

function handleMotionChange(event: MediaQueryListEvent): void {
  reducedMotion = event.matches
  lift = 0
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
.kite-festival-sky {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}
</style>
