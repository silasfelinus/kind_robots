<template>
  <canvas ref="canvasRef" class="frozen-pond-skaters" />
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'

const canvasRef = ref<HTMLCanvasElement | null>(null)

const TWIRL_COOLDOWN_MS = 3000
const TWIRL_DURATION = 3.5 // seconds a click-launched twirl wave lasts
const TWO_PI = Math.PI * 2
const LIGHT_COLORS = ['#ffd27a', '#ff9e8a', '#9fd8ff', '#c6f5a6', '#f5b8ff']

let context: CanvasRenderingContext2D | null = null
let resizeObserver: ResizeObserver | null = null
let motionQuery: MediaQueryList | null = null
let animationFrameId: number | null = null
let lastFrameTs = 0
let clock = 0
let width = 1
let height = 1
let reducedMotion = false
let twirlStart = -100
let twirlX = 0
let twirlY = 0
let lastTwirlTs = 0
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
  const point = canvasPoint(event)
  if (!point) return
  const now = performance.now()
  if (now - lastTwirlTs < TWIRL_COOLDOWN_MS) return
  lastTwirlTs = now
  twirlStart = clock
  twirlX = point.x
  twirlY = point.y
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

// A frozen village pond at night under strings of festival lights. Skaters
// glide along closed-form figure-eight and oval loops, each leaving a fading
// scratch trail sampled from its own past path (nothing is stored per frame).
// Hover makes the nearest skater break into a spin; a rate-limited click sends
// a twirl wave rolling outward across the ice, spinning each skater it passes.

function hash(n: number): number {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453
  return s - Math.floor(s)
}

type Pond = { cx: number; cy: number; rx: number; ry: number }

function pondGeometry(): Pond {
  const narrow = width < 600
  return {
    cx: width * 0.5,
    cy: height * (narrow ? 0.66 : 0.64),
    rx: width * (narrow ? 0.46 : 0.42),
    ry: height * (narrow ? 0.25 : 0.27),
  }
}

// Position on the ice for skater k at time t, in pond-unit coordinates
// (-1..1 on each axis), as a closed-form loop.
function skaterUnit(k: number, t: number): { u: number; v: number } {
  const speed = 0.16 + hash(k * 3.1) * 0.12
  const phase = hash(k * 7.7) * TWO_PI
  const a = 0.35 + hash(k * 5.3) * 0.45
  const b = 0.3 + hash(k * 9.1) * 0.4
  const ox = (hash(k * 2.9) - 0.5) * 0.35
  const oy = (hash(k * 4.3) - 0.5) * 0.3
  const s = t * speed + phase
  if (k % 2 === 0) {
    // Figure-eight (lemniscate-like) loop.
    return { u: ox + a * Math.sin(s), v: oy + b * Math.sin(2 * s) * 0.5 }
  }
  return { u: ox + a * Math.cos(s), v: oy + b * Math.sin(s) * 0.75 }
}

function toScreen(pond: Pond, u: number, v: number): { x: number; y: number } {
  return { x: pond.cx + u * pond.rx * 0.85, y: pond.cy + v * pond.ry * 0.8 }
}

function drawBackdrop(pond: Pond): void {
  if (!context) return
  const sky = context.createLinearGradient(0, 0, 0, height)
  sky.addColorStop(0, '#0b1230')
  sky.addColorStop(0.5, '#1b2550')
  sky.addColorStop(1, '#2a3460')
  context.fillStyle = sky
  context.fillRect(0, 0, width, height)

  // Stars.
  context.fillStyle = 'rgba(255, 255, 255, 0.8)'
  for (let i = 0; i < 70; i += 1) {
    const x = hash(i * 1.3) * width
    const y = hash(i * 2.1) * height * 0.35
    const tw = 0.4 + 0.6 * Math.abs(Math.sin(clock * 0.8 + i))
    context.globalAlpha = tw * 0.8
    context.fillRect(x, y, 1.4, 1.4)
  }
  context.globalAlpha = 1

  // Distant pine silhouettes along the horizon.
  const horizon = pond.cy - pond.ry * 1.25
  context.fillStyle = '#0d1a2b'
  const treeCount = Math.ceil(width / 38)
  for (let i = 0; i < treeCount; i += 1) {
    const x = (i + hash(i * 6.1) * 0.6) * 38
    const h = 40 + hash(i * 8.3) * 60
    context.beginPath()
    context.moveTo(x - h * 0.28, horizon + 4)
    context.lineTo(x, horizon - h)
    context.lineTo(x + h * 0.28, horizon + 4)
    context.closePath()
    context.fill()
  }

  // Snowy banks.
  context.fillStyle = '#d9e4f2'
  context.fillRect(0, horizon, width, height - horizon)
  const bank = context.createLinearGradient(0, horizon, 0, height)
  bank.addColorStop(0, 'rgba(160, 180, 220, 0.5)')
  bank.addColorStop(1, 'rgba(110, 130, 180, 0.6)')
  context.fillStyle = bank
  context.fillRect(0, horizon, width, height - horizon)

  // The ice itself.
  const ice = context.createRadialGradient(
    pond.cx,
    pond.cy - pond.ry * 0.3,
    pond.ry * 0.1,
    pond.cx,
    pond.cy,
    pond.rx,
  )
  ice.addColorStop(0, '#cfe6f5')
  ice.addColorStop(0.6, '#93b9d8')
  ice.addColorStop(1, '#6a8fb8')
  context.fillStyle = ice
  context.beginPath()
  context.ellipse(pond.cx, pond.cy, pond.rx, pond.ry, 0, 0, TWO_PI)
  context.fill()
  context.strokeStyle = 'rgba(255, 255, 255, 0.85)'
  context.lineWidth = 3
  context.stroke()
}

function drawLights(pond: Pond): void {
  if (!context) return
  const top = pond.cy - pond.ry * 1.25 - height * 0.12
  const strands = 3
  for (let s = 0; s < strands; s += 1) {
    const x0 = (s / strands) * width
    const x1 = ((s + 1) / strands) * width
    const y0 = top + (s % 2) * 10
    const sag = height * 0.06
    context.strokeStyle = 'rgba(30, 30, 40, 0.8)'
    context.lineWidth = 1
    context.beginPath()
    context.moveTo(x0, y0)
    context.quadraticCurveTo((x0 + x1) / 2, y0 + sag * 2, x1, y0)
    context.stroke()
    const bulbs = 9
    for (let b = 1; b < bulbs; b += 1) {
      const f = b / bulbs
      const x =
        (1 - f) * (1 - f) * x0 + 2 * f * (1 - f) * ((x0 + x1) / 2) + f * f * x1
      const y =
        (1 - f) * (1 - f) * y0 + 2 * f * (1 - f) * (y0 + sag * 2) + f * f * y0
      const color =
        LIGHT_COLORS[(s * bulbs + b) % LIGHT_COLORS.length] ?? '#ffd27a'
      const glow = 0.6 + 0.4 * Math.sin(clock * 1.5 + s * 2 + b)
      context.globalAlpha = 0.25 * glow
      context.fillStyle = color
      context.beginPath()
      context.arc(x, y + 4, 9, 0, TWO_PI)
      context.fill()
      context.globalAlpha = 1
      context.beginPath()
      context.arc(x, y + 4, 3, 0, TWO_PI)
      context.fill()
      // Reflection on the ice, if the bulb sits above the pond.
      if (Math.abs(x - pond.cx) < pond.rx * 0.8) {
        context.globalAlpha = 0.12 * glow
        context.fillRect(x - 1.5, pond.cy - pond.ry * 0.6, 3, pond.ry * 0.9)
        context.globalAlpha = 1
      }
    }
  }
}

function twirlAmount(x: number, y: number): number {
  const age = clock - twirlStart
  if (age < 0 || age > TWIRL_DURATION) return 0
  const radius = age * Math.max(width, height) * 0.35
  const d = Math.hypot(x - twirlX, y - twirlY)
  const band = Math.abs(d - radius)
  const reach = Math.max(width, height) * 0.08
  if (band > reach) return 0
  return (1 - band / reach) * (1 - age / TWIRL_DURATION)
}

function drawTrail(pond: Pond, k: number): void {
  if (!context) return
  context.lineWidth = 1.2
  const steps = 26
  let prev = toScreen(pond, skaterUnit(k, clock).u, skaterUnit(k, clock).v)
  for (let i = 1; i <= steps; i += 1) {
    const p = skaterUnit(k, clock - i * 0.22)
    const pt = toScreen(pond, p.u, p.v)
    context.strokeStyle = `rgba(255, 255, 255, ${0.5 * (1 - i / steps)})`
    context.beginPath()
    context.moveTo(prev.x, prev.y)
    context.lineTo(pt.x, pt.y)
    context.stroke()
    prev = pt
  }
}

function drawSkater(
  x: number,
  y: number,
  size: number,
  heading: number,
  spin: number,
  k: number,
): void {
  if (!context) return
  const scarf = LIGHT_COLORS[k % LIGHT_COLORS.length] ?? '#ff9e8a'
  // Spin squashes the body horizontally like a figure turning in place;
  // `spin` is 0..1 and blends from a steady glide into a fast pirouette.
  const turn = 1 - spin * (1 - Math.abs(Math.cos(clock * 9 + k)))
  const lean = Math.sin(heading) * 0.15
  context.save()
  context.translate(x, y)

  // Shadow on the ice.
  context.fillStyle = 'rgba(30, 50, 90, 0.25)'
  context.beginPath()
  context.ellipse(0, 0, size * 0.5, size * 0.14, 0, 0, TWO_PI)
  context.fill()

  context.rotate(lean)
  context.scale(Math.max(0.2, turn), 1)
  // Legs and skates.
  context.strokeStyle = '#1d2238'
  context.lineWidth = Math.max(1.5, size * 0.12)
  context.beginPath()
  context.moveTo(-size * 0.12, -size * 0.9)
  context.lineTo(-size * 0.18, 0)
  context.moveTo(size * 0.12, -size * 0.9)
  context.lineTo(size * 0.2, -size * 0.05)
  context.stroke()
  context.strokeStyle = '#e8eef8'
  context.lineWidth = 1
  context.beginPath()
  context.moveTo(-size * 0.32, 0)
  context.lineTo(-size * 0.04, 0)
  context.moveTo(size * 0.06, -size * 0.04)
  context.lineTo(size * 0.34, -size * 0.04)
  context.stroke()
  // Coat.
  const coat = `hsl(${Math.floor(hash(k * 11.7) * 360)}, 55%, 42%)`
  context.fillStyle = coat
  context.beginPath()
  context.moveTo(-size * 0.28, -size * 0.85)
  context.lineTo(-size * 0.2, -size * 1.65)
  context.lineTo(size * 0.2, -size * 1.65)
  context.lineTo(size * 0.28, -size * 0.85)
  context.closePath()
  context.fill()
  // Arms out for balance, wider while spinning.
  const reach = size * (0.45 + 0.25 * spin)
  context.strokeStyle = coat
  context.lineWidth = Math.max(1.5, size * 0.1)
  context.beginPath()
  context.moveTo(-size * 0.18, -size * 1.5)
  context.lineTo(-reach, -size * 1.25)
  context.moveTo(size * 0.18, -size * 1.5)
  context.lineTo(reach, -size * 1.25)
  context.stroke()
  // Scarf and head.
  context.fillStyle = scarf
  context.fillRect(-size * 0.2, -size * 1.72, size * 0.4, size * 0.12)
  context.fillRect(size * 0.08, -size * 1.7, size * 0.1, size * 0.35)
  context.fillStyle = '#f2d2b6'
  context.beginPath()
  context.arc(0, -size * 1.9, size * 0.2, 0, TWO_PI)
  context.fill()
  context.fillStyle = scarf
  context.beginPath()
  context.arc(0, -size * 1.95, size * 0.2, Math.PI, TWO_PI)
  context.fill()
  context.beginPath()
  context.arc(0, -size * 2.2, size * 0.07, 0, TWO_PI)
  context.fill()
  context.restore()
}

function drawSnow(): void {
  if (!context) return
  context.fillStyle = 'rgba(255, 255, 255, 0.85)'
  const flakes = width < 600 ? 40 : 80
  for (let i = 0; i < flakes; i += 1) {
    const fall = 18 + hash(i * 3.7) * 22
    const y = ((hash(i * 5.9) * height + clock * fall) % (height + 10)) - 5
    const x =
      (((hash(i * 1.9) * width + Math.sin(clock * 0.6 + i) * 14) % width) +
        width) %
      width
    context.beginPath()
    context.arc(x, y, 0.8 + hash(i * 2.3) * 1.6, 0, TWO_PI)
    context.fill()
  }
}

function drawScene(): void {
  if (!context) return
  const pond = pondGeometry()
  drawBackdrop(pond)
  drawLights(pond)

  const narrow = width < 600
  const count = narrow ? 5 : 8
  const size = Math.max(10, Math.min(width, height) * (narrow ? 0.05 : 0.055))

  const skaters: { k: number; x: number; y: number; heading: number }[] = []
  for (let k = 0; k < count; k += 1) {
    const now = skaterUnit(k, clock)
    const ahead = skaterUnit(k, clock + 0.05)
    const p = toScreen(pond, now.u, now.v)
    skaters.push({
      k,
      x: p.x,
      y: p.y,
      heading: Math.atan2(ahead.v - now.v, ahead.u - now.u),
    })
  }

  let nearest = -1
  if (pointerX >= 0) {
    let best = size * 6
    for (const s of skaters) {
      const d = Math.hypot(s.x - pointerX, s.y - size - pointerY)
      if (d < best) {
        best = d
        nearest = s.k
      }
    }
  }

  for (const s of skaters) drawTrail(pond, s.k)
  // Draw back-to-front so nearer skaters overlap farther ones.
  skaters.sort((a, b) => a.y - b.y)
  for (const s of skaters) {
    let spin = twirlAmount(s.x, s.y)
    if (s.k === nearest) spin = Math.max(spin, 0.8)
    const depth = 0.75 + 0.25 * ((s.y - (pond.cy - pond.ry)) / (pond.ry * 2))
    drawSkater(s.x, s.y, size * depth, s.heading, spin, s.k)
  }
  drawSnow()
}

function renderFrame(timestamp: number): void {
  if (!context) return
  const dt = lastFrameTs ? Math.min(0.1, (timestamp - lastFrameTs) / 1000) : 0
  lastFrameTs = timestamp
  clock += dt
  drawScene()
  animationFrameId = window.requestAnimationFrame(renderFrame)
}

function drawStill(): void {
  clock = 12
  twirlStart = -100
  drawScene()
}

function handleMotionChange(event: MediaQueryListEvent): void {
  reducedMotion = event.matches
  pointerX = -1
  pointerY = -1
  if (reducedMotion) {
    if (animationFrameId !== null) window.cancelAnimationFrame(animationFrameId)
    animationFrameId = null
    drawStill()
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
    if (reducedMotion) drawStill()
  })
  resizeObserver.observe(canvas)
  window.addEventListener('pointermove', handlePointerMove, { passive: true })
  window.addEventListener('pointerdown', handlePointerDown, { passive: true })
  resizeCanvas()
  if (reducedMotion) drawStill()
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
.frozen-pond-skaters {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}
</style>
