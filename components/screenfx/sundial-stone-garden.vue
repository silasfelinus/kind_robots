<template>
  <canvas ref="canvasRef" class="sundial-stone-garden" />
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'

const canvasRef = ref<HTMLCanvasElement | null>(null)

const DAY_MS = 70000
const CLICK_COOLDOWN_MS = 1200
const CLICK_SKIP_FRACTION = 0.12
const POINTER_RADIUS = 120
const MAX_LIFT = 0.7
const LIFT_EASE_PER_SEC = 3
const REDUCED_DAY_FRACTION = 0.64
const TWO_PI = Math.PI * 2

interface Stone {
  x: number
  y: number
  height: number
  girth: number
  lift: number
}

// Stones sit on a loose, fixed grid in normalised (0..1) ground coordinates.
const STONE_LAYOUT: readonly [number, number, number, number][] = [
  [0.14, 0.34, 0.1, 0.022],
  [0.32, 0.26, 0.14, 0.026],
  [0.52, 0.38, 0.09, 0.02],
  [0.72, 0.28, 0.13, 0.024],
  [0.88, 0.4, 0.1, 0.02],
  [0.2, 0.62, 0.12, 0.024],
  [0.42, 0.7, 0.16, 0.028],
  [0.64, 0.64, 0.1, 0.022],
  [0.84, 0.74, 0.13, 0.025],
]

// Sky colour stops across one day: [fraction, top, bottom, ground].
const SKY_STOPS: readonly [number, string, string, string][] = [
  [0, '#0e1530', '#2a2b55', '#1a1c2e'],
  [0.12, '#3b3a6e', '#e59a6b', '#4a3b3a'],
  [0.3, '#5aa0d6', '#f4e3b5', '#c9b88a'],
  [0.5, '#4a97dc', '#cfe8f7', '#d8c795'],
  [0.7, '#5a8fd0', '#f6d9a0', '#cdb181'],
  [0.88, '#5a3c78', '#f08a5a', '#54393a'],
  [1, '#0e1530', '#2a2b55', '#1a1c2e'],
]

const stones: Stone[] = STONE_LAYOUT.map(([x, y, height, girth]) => ({
  x,
  y,
  height,
  girth,
  lift: 0,
}))

let context: CanvasRenderingContext2D | null = null
let resizeObserver: ResizeObserver | null = null
let motionQuery: MediaQueryList | null = null
let animationFrameId: number | null = null
let width = 1
let height = 1
let previousTimestamp = 0
let dayClock = 0.3
let reducedMotion = false
let lastClickTs = 0
let pointerActive = false
let pointerX = 0
let pointerY = 0

function hexToRgb(hex: string): [number, number, number] {
  const value = parseInt(hex.slice(1), 16)
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255]
}

function mixColor(a: string, b: string, t: number): string {
  const [ar, ag, ab] = hexToRgb(a)
  const [br, bg, bb] = hexToRgb(b)
  const r = Math.round(ar + (br - ar) * t)
  const g = Math.round(ag + (bg - ag) * t)
  const bl = Math.round(ab + (bb - ab) * t)
  return `rgb(${r}, ${g}, ${bl})`
}

function skyAt(fraction: number): {
  top: string
  bottom: string
  ground: string
} {
  for (let i = 1; i < SKY_STOPS.length; i += 1) {
    const next = SKY_STOPS[i]
    const prev = SKY_STOPS[i - 1]
    if (!next || !prev) continue
    if (fraction <= next[0]) {
      const t = (fraction - prev[0]) / (next[0] - prev[0] || 1)
      return {
        top: mixColor(prev[1], next[1], t),
        bottom: mixColor(prev[2], next[2], t),
        ground: mixColor(prev[3], next[3], t),
      }
    }
  }
  const last = SKY_STOPS[SKY_STOPS.length - 1]
  return {
    top: last?.[1] ?? '#000',
    bottom: last?.[2] ?? '#000',
    ground: last?.[3] ?? '#000',
  }
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
  pointerActive = Boolean(point)
  if (point) {
    pointerX = point.x
    pointerY = point.y
  }
}

function handlePointerDown(event: PointerEvent): void {
  if (reducedMotion) return
  if (!canvasPoint(event)) return
  const now = performance.now()
  if (now - lastClickTs < CLICK_COOLDOWN_MS) return
  lastClickTs = now
  dayClock = (dayClock + CLICK_SKIP_FRACTION) % 1
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

function stepLifts(dt: number): void {
  const ease = Math.min(1, LIFT_EASE_PER_SEC * dt)
  const horizon = height * 0.3
  for (const stone of stones) {
    let target = 0
    if (pointerActive) {
      const dist = Math.hypot(
        stone.x * width - pointerX,
        horizon + stone.y * (height - horizon) - pointerY,
      )
      if (dist < POINTER_RADIUS) target = MAX_LIFT * (1 - dist / POINTER_RADIUS)
    }
    stone.lift += (target - stone.lift) * ease
  }
}

function drawFrame(): void {
  if (!context) return
  const sky = skyAt(dayClock)
  const horizon = height * 0.3
  const backdrop = context.createLinearGradient(0, 0, 0, horizon)
  backdrop.addColorStop(0, sky.top)
  backdrop.addColorStop(1, sky.bottom)
  context.fillStyle = backdrop
  context.fillRect(0, 0, width, horizon)
  context.fillStyle = sky.ground
  context.fillRect(0, horizon, width, height - horizon)

  // Sun travels east to west across the day (0.25..0.75 is daylight).
  const sunAngle = (dayClock - 0.25) * TWO_PI
  const elevation = Math.sin(sunAngle)
  const daylight = Math.max(0, elevation)
  const sunX = width * (0.5 - Math.cos(sunAngle) * 0.5)
  if (elevation > -0.2) {
    const sunY = horizon - Math.max(0, elevation) * horizon * 0.85
    context.fillStyle = `rgba(255, 236, 180, ${0.4 + 0.6 * daylight})`
    context.beginPath()
    context.arc(sunX, sunY, Math.max(10, width * 0.018), 0, TWO_PI)
    context.fill()
  } else {
    context.fillStyle = 'rgba(220, 230, 255, 0.85)'
    context.beginPath()
    context.arc(
      width * (1 - sunX / width),
      horizon * 0.35,
      Math.max(8, width * 0.012),
      0,
      TWO_PI,
    )
    context.fill()
  }

  // Shadows fall away from the sun along the ground, longest at the horizons.
  const shadowDir = Math.sign(0.5 - sunX / width) || 1
  const shadowStrength = 0.12 + 0.38 * daylight
  const lengthScale = 1 / Math.max(0.18, Math.abs(elevation))
  const groundHeight = height - horizon

  const ordered = [...stones].sort((a, b) => a.y - b.y)
  for (const stone of ordered) {
    const baseX = stone.x * width
    const baseY = horizon + stone.y * groundHeight
    const stoneHeight = (stone.height + stone.lift * 0.1) * groundHeight * 1.6
    const stoneWidth = stone.girth * width
    const shadowLength = Math.min(width * 0.45, stoneHeight * lengthScale * 0.9)
    const tipX = baseX + shadowDir * shadowLength
    const tipY = baseY + shadowLength * 0.12

    context.fillStyle = `rgba(10, 12, 30, ${shadowStrength})`
    context.beginPath()
    context.moveTo(baseX - stoneWidth / 2, baseY)
    context.lineTo(baseX + stoneWidth / 2, baseY)
    context.lineTo(tipX + stoneWidth / 3, tipY)
    context.lineTo(tipX - stoneWidth / 3, tipY)
    context.closePath()
    context.fill()

    const lit = 0.35 + 0.5 * daylight + stone.lift * 0.3
    context.fillStyle = mixColor('#3a3d4f', '#e7dcc4', Math.min(1, lit))
    context.beginPath()
    context.moveTo(baseX - stoneWidth / 2, baseY)
    context.lineTo(baseX - stoneWidth / 3, baseY - stoneHeight)
    context.lineTo(baseX + stoneWidth / 3, baseY - stoneHeight)
    context.lineTo(baseX + stoneWidth / 2, baseY)
    context.closePath()
    context.fill()
  }
}

function renderFrame(timestamp: number): void {
  if (!context) return
  const elapsed = previousTimestamp ? timestamp - previousTimestamp : 16.67
  previousTimestamp = timestamp
  const delta = Math.min(50, Math.max(4, elapsed))

  if (!reducedMotion) {
    dayClock = (dayClock + delta / DAY_MS) % 1
    stepLifts(delta / 1000)
  }
  drawFrame()
  animationFrameId = window.requestAnimationFrame(renderFrame)
}

function handleMotionChange(event: MediaQueryListEvent): void {
  reducedMotion = event.matches
  if (reducedMotion) {
    dayClock = REDUCED_DAY_FRACTION
    for (const stone of stones) stone.lift = 0
  }
}

onMounted(() => {
  const canvas = canvasRef.value
  if (!canvas) return
  context = canvas.getContext('2d')
  if (!context) return

  motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
  reducedMotion = motionQuery.matches
  if (reducedMotion) dayClock = REDUCED_DAY_FRACTION
  motionQuery.addEventListener('change', handleMotionChange)

  resizeObserver = new ResizeObserver(resizeCanvas)
  resizeObserver.observe(canvas)
  window.addEventListener('pointermove', handlePointerMove, { passive: true })
  window.addEventListener('pointerdown', handlePointerDown, { passive: true })
  resizeCanvas()
  animationFrameId = window.requestAnimationFrame(renderFrame)
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
.sundial-stone-garden {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}
</style>
