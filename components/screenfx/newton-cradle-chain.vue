<template>
  <canvas ref="canvasRef" class="newton-cradle-chain" />
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'

const canvasRef = ref<HTMLCanvasElement | null>(null)

// Two rows of Newton's cradles pass momentum end to end. Swing angle is a
// closed-form function of the clock: the lifted balls swing out and back on
// one side, then the opposite side answers, and how many balls travel steps
// through 1, 2, 3 each full cycle.
const BALLS = 7
const CRADLES = 2
const SWING_SECONDS = 2.4
const MAX_ANGLE = 0.9
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

// Angle of ball i at time `seconds`, in radians (negative swings left).
function ballAngle(i: number, seconds: number, cradle: number): number {
  const cycle = seconds / SWING_SECONDS
  const whole = Math.floor(cycle)
  const moving = 1 + ((whole + cradle) % 3) + (boost > 0.5 ? 1 : 0)
  const count = Math.min(moving, BALLS - 1)
  const leftSide = cycle - whole < 0.5
  const arc = Math.sin(TWO_PI * (cycle - whole))
  if (leftSide && i < count) return -MAX_ANGLE * Math.max(0, arc)
  if (!leftSide && i >= BALLS - count) return MAX_ANGLE * Math.max(0, -arc)
  return 0
}

function drawCradle(
  seconds: number,
  cradle: number,
  topY: number,
  size: number,
): void {
  if (!context) return
  const spacing = size * 2.02
  const startX = width / 2 - (spacing * (BALLS - 1)) / 2
  const stringLen = size * 5
  context.strokeStyle = 'rgba(220, 230, 245, 0.7)'
  context.lineWidth = 3
  context.beginPath()
  context.moveTo(startX - size * 1.4, topY)
  context.lineTo(startX + spacing * (BALLS - 1) + size * 1.4, topY)
  context.stroke()

  for (let i = 0; i < BALLS; i += 1) {
    const angle = ballAngle(i, seconds + cradle * 0.7, cradle)
    const pivotX = startX + spacing * i
    const bx = pivotX + Math.sin(angle) * stringLen
    const by = topY + Math.cos(angle) * stringLen
    let glow = Math.min(1, Math.abs(angle) / MAX_ANGLE)
    if (pointerX >= 0) {
      glow = Math.max(
        glow,
        1 - Math.hypot(bx - pointerX, by - pointerY) / (height * 0.2),
      )
    }
    context.strokeStyle = 'rgba(220, 230, 245, 0.55)'
    context.lineWidth = 1
    context.beginPath()
    context.moveTo(pivotX, topY)
    context.lineTo(bx, by)
    context.stroke()

    const gradient = context.createRadialGradient(
      bx - size * 0.3,
      by - size * 0.3,
      size * 0.1,
      bx,
      by,
      size,
    )
    gradient.addColorStop(
      0,
      `hsl(${200 + cradle * 70}, 30%, ${85 + glow * 10}%)`,
    )
    gradient.addColorStop(
      1,
      `hsl(${210 + cradle * 70}, 35%, ${32 + glow * 28}%)`,
    )
    context.fillStyle = gradient
    context.beginPath()
    context.arc(bx, by, size, 0, TWO_PI)
    context.fill()
  }
}

function drawScene(seconds: number): void {
  if (!context) return
  const bg = context.createLinearGradient(0, 0, 0, height)
  bg.addColorStop(0, '#141b2d')
  bg.addColorStop(1, '#2a2440')
  context.fillStyle = bg
  context.fillRect(0, 0, width, height)

  const size = Math.min(width / (BALLS * 2.4), height * 0.045)
  for (let c = 0; c < CRADLES; c += 1) {
    drawCradle(seconds, c, height * (0.12 + c * 0.45), size)
  }
}

function renderFrame(timestamp: number): void {
  if (!context) return
  const dt = lastFrameTs ? Math.min(0.1, (timestamp - lastFrameTs) / 1000) : 0
  lastFrameTs = timestamp
  boost = Math.max(0, boost - BOOST_DECAY_PER_SEC * dt)
  clock += dt
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
.newton-cradle-chain {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}
</style>
