<template>
  <canvas ref="canvasRef" class="hot-air-balloon-dawn" />
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'

const canvasRef = ref<HTMLCanvasElement | null>(null)

const THERMAL_COOLDOWN_MS = 3000
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
let lift = 0
let lastThermalTs = 0
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
  if (now - lastThermalTs < THERMAL_COOLDOWN_MS) return
  lastThermalTs = now
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

// Hot-air balloons drift across rolling hills at dawn. Each balloon's position
// is a closed-form function of the clock (a slow wrap-around drift plus a
// gentle bob), so nothing per-balloon is stored. Hover flares the nearest
// balloon's burner; a click sends a rate-limited thermal that lifts every
// balloon briefly before it eases back down.
const BALLOONS = 9
const DRIFT = 0.012

function hash(n: number): number {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453
  return s - Math.floor(s)
}

function drawHills(
  base: number,
  amp: number,
  freq: number,
  phase: number,
  color: string,
): void {
  if (!context) return
  context.fillStyle = color
  context.beginPath()
  context.moveTo(0, height)
  for (let x = 0; x <= width; x += 8) {
    const t = x / width
    const y =
      height * base -
      Math.sin(t * freq + phase) * height * amp -
      Math.sin(t * freq * 2.3 + phase * 1.7) * height * amp * 0.35
    context.lineTo(x, y)
  }
  context.lineTo(width, height)
  context.closePath()
  context.fill()
}

function drawScene(seconds: number): void {
  if (!context) return
  const sky = context.createLinearGradient(0, 0, 0, height)
  sky.addColorStop(0, '#2c3a6b')
  sky.addColorStop(0.45, '#c97b8e')
  sky.addColorStop(0.8, '#f6c28b')
  sky.addColorStop(1, '#ffe6b0')
  context.fillStyle = sky
  context.fillRect(0, 0, width, height)

  // Rising sun glow behind the far hills.
  const sunX = width * 0.68
  const sunY = height * 0.74
  const sunR = Math.min(width, height) * 0.09
  const glow = context.createRadialGradient(sunX, sunY, 0, sunX, sunY, sunR * 5)
  glow.addColorStop(0, 'rgba(255, 236, 180, 0.85)')
  glow.addColorStop(0.2, 'rgba(255, 210, 150, 0.35)')
  glow.addColorStop(1, 'rgba(255, 200, 150, 0)')
  context.fillStyle = glow
  context.fillRect(0, 0, width, height)
  context.fillStyle = '#fff1c9'
  context.beginPath()
  context.arc(sunX, sunY, sunR, 0, TWO_PI)
  context.fill()

  drawHills(0.82, 0.05, 5, 0.4, '#8a6f8f')

  // Balloons: far ones are smaller and paler, drawn first.
  const order = Array.from({ length: BALLOONS }, (_, i) => i).sort(
    (a, b) => hash(a + 7) - hash(b + 7),
  )
  for (const i of order) {
    const depth = 0.45 + hash(i + 7) * 0.55
    const speed = DRIFT * (0.6 + depth)
    const t = (hash(i) + seconds * speed) % 1
    const x = -0.15 * width + t * width * 1.3
    const baseY = height * (0.2 + hash(i + 3) * 0.4)
    const y =
      baseY +
      Math.sin(seconds * 0.5 + i * 1.7) * height * 0.015 -
      lift * height * 0.12 * depth
    const r = Math.min(width, height) * 0.05 * depth
    const hue = Math.floor(hash(i + 11) * 360)
    const dist = Math.hypot(x - pointerX, y + r * 1.6 - pointerY)
    const hover = pointerX >= 0 ? Math.max(0, 1 - dist / (r * 3)) : 0
    const flare = Math.max(hover, lift * 0.8)
    const fade = 0.55 + depth * 0.45

    context.save()
    context.globalAlpha = fade
    context.translate(x, y)

    // Envelope: a teardrop with vertical gores.
    context.beginPath()
    context.moveTo(0, r * 1.25)
    context.bezierCurveTo(-r * 1.3, r * 0.4, -r * 1.15, -r * 1.1, 0, -r * 1.1)
    context.bezierCurveTo(r * 1.15, -r * 1.1, r * 1.3, r * 0.4, 0, r * 1.25)
    context.closePath()
    const fill = context.createLinearGradient(-r, 0, r, 0)
    fill.addColorStop(0, `hsl(${hue}, 60%, 42%)`)
    fill.addColorStop(0.55, `hsl(${hue}, 75%, ${62 + flare * 10}%)`)
    fill.addColorStop(1, `hsl(${(hue + 30) % 360}, 65%, 48%)`)
    context.fillStyle = fill
    context.fill()
    context.save()
    context.clip()
    context.strokeStyle = 'rgba(255, 255, 255, 0.22)'
    context.lineWidth = Math.max(1, r * 0.04)
    for (let g = -2; g <= 2; g += 1) {
      context.beginPath()
      context.moveTo(0, -r * 1.1)
      context.quadraticCurveTo(g * r * 0.55, 0, 0, r * 1.25)
      context.stroke()
    }
    context.restore()

    // Ropes and basket.
    context.strokeStyle = 'rgba(60, 40, 40, 0.7)'
    context.lineWidth = 1
    context.beginPath()
    context.moveTo(-r * 0.3, r * 1.15)
    context.lineTo(-r * 0.2, r * 1.6)
    context.moveTo(r * 0.3, r * 1.15)
    context.lineTo(r * 0.2, r * 1.6)
    context.stroke()
    context.fillStyle = '#6b4a2e'
    context.fillRect(-r * 0.22, r * 1.6, r * 0.44, r * 0.3)

    // Burner flame, brighter on hover or thermal.
    if (flare > 0.02) {
      const flame = context.createRadialGradient(
        0,
        r * 1.3,
        0,
        0,
        r * 1.3,
        r * 0.6,
      )
      flame.addColorStop(0, `rgba(255, 240, 180, ${flare})`)
      flame.addColorStop(0.4, `rgba(255, 150, 60, ${flare * 0.7})`)
      flame.addColorStop(1, 'rgba(255, 120, 40, 0)')
      context.fillStyle = flame
      context.beginPath()
      context.arc(0, r * 1.3, r * 0.6, 0, TWO_PI)
      context.fill()
    }
    context.restore()
  }

  drawHills(0.9, 0.04, 3.2, 1.9, '#5b4566')
  drawHills(0.97, 0.035, 2.1, 3.1, '#3a2d47')
}

function renderFrame(timestamp: number): void {
  if (!context) return
  const dt = lastFrameTs ? Math.min(0.1, (timestamp - lastFrameTs) / 1000) : 0
  lastFrameTs = timestamp
  strike = Math.max(0, strike - STRIKE_DECAY_PER_SEC * dt)
  clock += dt
  lift = Math.sin(strike * Math.PI * 0.5)
  drawScene(clock)
  animationFrameId = window.requestAnimationFrame(renderFrame)
}

function handleMotionChange(event: MediaQueryListEvent): void {
  reducedMotion = event.matches
  strike = 0
  lift = 0
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
.hot-air-balloon-dawn {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}
</style>
