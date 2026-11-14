<template>
  <canvas ref="canvasRef" class="windmill-polder-dusk" />
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'

const canvasRef = ref<HTMLCanvasElement | null>(null)

const SURGE_COOLDOWN_MS = 3000
const SURGE_DECAY_PER_SEC = 0.4
const TWO_PI = Math.PI * 2

let context: CanvasRenderingContext2D | null = null
let resizeObserver: ResizeObserver | null = null
let motionQuery: MediaQueryList | null = null
let animationFrameId: number | null = null
let lastFrameTs = 0
let clock = 0
let wind = 0
let width = 1
let height = 1
let reducedMotion = false
let surge = 0
let lastSurgeTs = 0
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
  if (now - lastSurgeTs < SURGE_COOLDOWN_MS) return
  lastSurgeTs = now
  surge = 1
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

// A Dutch polder at dusk: a row of windmills turns over striped tulip fields,
// mirrored in a straight canal. Each mill's sail angle is a closed-form
// function of a shared "wind" clock with its own speed and offset, so nothing
// per-mill is stored. Hover lights the nearest mill's window; a rate-limited
// click sends a gust that spins every sail faster for a few seconds.
const TULIP_COLORS = ['#e2475b', '#f2c14e', '#f08bb4', '#f7f1e3', '#b45fd1']

function hash(n: number): number {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453
  return s - Math.floor(s)
}

function drawBackdrop(horizon: number): void {
  if (!context) return
  const sky = context.createLinearGradient(0, 0, 0, horizon)
  sky.addColorStop(0, '#1f2350')
  sky.addColorStop(0.55, '#8a4d72')
  sky.addColorStop(1, '#f2a65a')
  context.fillStyle = sky
  context.fillRect(0, 0, width, horizon)

  const sunX = width * 0.3
  const sunR = Math.min(width, height) * 0.07
  const glow = context.createRadialGradient(
    sunX,
    horizon,
    0,
    sunX,
    horizon,
    sunR * 7,
  )
  glow.addColorStop(0, 'rgba(255, 210, 140, 0.55)')
  glow.addColorStop(1, 'rgba(255, 210, 140, 0)')
  context.fillStyle = glow
  context.fillRect(0, 0, width, horizon)
  context.fillStyle = '#ffd38a'
  context.beginPath()
  context.arc(sunX, horizon, sunR, Math.PI, TWO_PI)
  context.fill()

  // Slow streaks of cloud drifting across the dusk.
  for (let k = 0; k < 6; k += 1) {
    const w = width * (0.15 + hash(k + 20) * 0.2)
    const span = width + w
    const x = ((hash(k + 21) * span + clock * (6 + k * 2)) % span) - w
    const y = horizon * (0.15 + hash(k + 22) * 0.5)
    context.fillStyle = `rgba(255, 190, 170, ${0.12 + hash(k + 23) * 0.12})`
    context.beginPath()
    context.ellipse(x + w / 2, y, w / 2, 4 + hash(k + 24) * 6, 0, 0, TWO_PI)
    context.fill()
  }
}

function drawFields(horizon: number, canalTop: number): void {
  if (!context) return
  // Polder grass under everything, then tulip rows converging on the horizon.
  context.fillStyle = '#2d4a2a'
  context.fillRect(0, horizon, width, canalTop - horizon)
  const rows = 9
  const vanishX = width * 0.5
  for (let r = -6; r < rows + 6; r += 1) {
    const x0 = (width * (r - 0.5)) / (rows - 1) - width * 0.1
    const x1 = (width * (r + 0.5)) / (rows - 1) - width * 0.1
    context.fillStyle = TULIP_COLORS[(r + 30) % TULIP_COLORS.length]!
    context.globalAlpha = 0.85
    context.beginPath()
    context.moveTo(vanishX + (x0 - vanishX) * 0.08, horizon)
    context.lineTo(vanishX + (x1 - vanishX) * 0.08, horizon)
    context.lineTo(x1 * 1.4 - width * 0.2, canalTop)
    context.lineTo(x0 * 1.4 - width * 0.2, canalTop)
    context.closePath()
    context.fill()
    context.globalAlpha = 1
    context.fillStyle = '#2d4a2a'
    context.beginPath()
    context.moveTo(vanishX + (x1 - vanishX) * 0.08, horizon)
    context.lineTo(vanishX + (x1 - vanishX) * 0.09, horizon)
    context.lineTo(x1 * 1.4 - width * 0.2 + 6, canalTop)
    context.lineTo(x1 * 1.4 - width * 0.2, canalTop)
    context.closePath()
    context.fill()
  }
  // Dusk shading over the fields.
  const shade = context.createLinearGradient(0, horizon, 0, canalTop)
  shade.addColorStop(0, 'rgba(40, 30, 60, 0.55)')
  shade.addColorStop(1, 'rgba(40, 30, 60, 0.2)')
  context.fillStyle = shade
  context.fillRect(0, horizon, width, canalTop - horizon)
}

interface Mill {
  x: number
  base: number
  size: number
  angle: number
  lit: number
}

function drawMill(mill: Mill): void {
  if (!context) return
  const { x, base, size, angle, lit } = mill
  const towerH = size * 1.1
  const hubY = base - towerH
  // Tapered tower and cap.
  context.fillStyle = '#2b2233'
  context.beginPath()
  context.moveTo(x - size * 0.28, base)
  context.lineTo(x + size * 0.28, base)
  context.lineTo(x + size * 0.16, hubY + size * 0.05)
  context.lineTo(x - size * 0.16, hubY + size * 0.05)
  context.closePath()
  context.fill()
  context.beginPath()
  context.moveTo(x - size * 0.2, hubY + size * 0.06)
  context.quadraticCurveTo(
    x,
    hubY - size * 0.2,
    x + size * 0.2,
    hubY + size * 0.06,
  )
  context.fill()
  // Window, warm when hovered.
  const windowAlpha = 0.35 + lit * 0.6
  context.fillStyle = `rgba(255, 200, 110, ${windowAlpha})`
  context.fillRect(
    x - size * 0.05,
    base - towerH * 0.45,
    size * 0.1,
    size * 0.14,
  )
  if (lit > 0) {
    const halo = context.createRadialGradient(
      x,
      base - towerH * 0.38,
      0,
      x,
      base - towerH * 0.38,
      size * 0.5,
    )
    halo.addColorStop(0, `rgba(255, 200, 110, ${0.35 * lit})`)
    halo.addColorStop(1, 'rgba(255, 200, 110, 0)')
    context.fillStyle = halo
    context.fillRect(x - size * 0.5, base - towerH, size, towerH)
  }
  // Four lattice sails around the hub.
  context.save()
  context.translate(x, hubY)
  context.rotate(angle)
  for (let s = 0; s < 4; s += 1) {
    context.rotate(Math.PI / 2)
    context.fillStyle = '#3a2d3e'
    context.fillRect(-size * 0.025, 0, size * 0.05, size * 0.95)
    context.fillStyle = 'rgba(240, 220, 200, 0.75)'
    context.fillRect(size * 0.03, size * 0.18, size * 0.17, size * 0.75)
    context.strokeStyle = 'rgba(58, 45, 62, 0.9)'
    context.lineWidth = 1
    for (let k = 1; k < 5; k += 1) {
      const y = size * (0.18 + k * 0.15)
      context.beginPath()
      context.moveTo(size * 0.03, y)
      context.lineTo(size * 0.2, y)
      context.stroke()
    }
  }
  context.restore()
  context.fillStyle = '#1b151f'
  context.beginPath()
  context.arc(x, hubY, size * 0.05, 0, TWO_PI)
  context.fill()
}

function drawScene(windTime: number): void {
  if (!context) return
  const horizon = height * 0.5
  const canalTop = height * 0.8
  drawBackdrop(horizon)
  drawFields(horizon, canalTop)

  const count = width < 600 ? 3 : 5
  const mills: Mill[] = []
  let nearest = -1
  let nearestDist = Infinity
  for (let i = 0; i < count; i += 1) {
    const depth = hash(i + 3)
    const size =
      Math.min(width / (count + 1), height * 0.35) * (0.4 + depth * 0.3)
    const x = (width / (count + 1)) * (i + 1) + (hash(i + 4) - 0.5) * size * 0.4
    const base = horizon + (canalTop - horizon) * (0.1 + depth * 0.5)
    const speed = 0.5 + hash(i + 6) * 0.5
    const angle = windTime * speed + hash(i + 7) * TWO_PI
    const d = Math.hypot(x - pointerX, base - size * 0.6 - pointerY)
    if (pointerX >= 0 && d < size && d < nearestDist) {
      nearest = i
      nearestDist = d
    }
    mills.push({ x, base, size, angle, lit: 0 })
  }
  if (nearest >= 0) mills[nearest]!.lit = 1
  mills.sort((a, b) => a.base - b.base)
  for (const mill of mills) drawMill(mill)

  // Canal: a darker mirror of the sky with shimmering ripples.
  const canal = context.createLinearGradient(0, canalTop, 0, height)
  canal.addColorStop(0, '#d78a5e')
  canal.addColorStop(0.4, '#5b3b5f')
  canal.addColorStop(1, '#1a1a3a')
  context.fillStyle = canal
  context.fillRect(0, canalTop, width, height - canalTop)
  context.fillStyle = 'rgba(35, 25, 45, 0.8)'
  context.fillRect(0, canalTop - 3, width, 4)
  for (let k = 0; k < 24; k += 1) {
    const y = canalTop + 6 + hash(k + 50) * (height - canalTop - 8)
    const w = 20 + hash(k + 51) * 60
    const x = (hash(k + 52) * width + Math.sin(clock * 0.8 + k) * 8) % width
    const a = 0.1 + 0.15 * (0.5 + 0.5 * Math.sin(clock * 1.5 + k * 1.7))
    context.fillStyle = `rgba(255, 210, 160, ${a})`
    context.fillRect(x, y, w, 1.5)
  }
  // Gust streaks while the wind is up.
  if (surge > 0.02) {
    context.strokeStyle = `rgba(255, 240, 225, ${surge * 0.35})`
    context.lineWidth = 1.2
    for (let k = 0; k < 12; k += 1) {
      const y = height * (0.1 + hash(k + 60) * 0.6)
      const len = width * (0.08 + hash(k + 61) * 0.1)
      const x = ((hash(k + 62) * width + clock * 600) % (width + len)) - len
      context.beginPath()
      context.moveTo(x, y)
      context.lineTo(x + len, y - len * 0.04)
      context.stroke()
    }
  }
}

function renderFrame(timestamp: number): void {
  if (!context) return
  const dt = lastFrameTs ? Math.min(0.1, (timestamp - lastFrameTs) / 1000) : 0
  lastFrameTs = timestamp
  surge = Math.max(0, surge - SURGE_DECAY_PER_SEC * dt)
  clock += dt
  wind += dt * (1 + surge * 3)
  drawScene(wind)
  animationFrameId = window.requestAnimationFrame(renderFrame)
}

function handleMotionChange(event: MediaQueryListEvent): void {
  reducedMotion = event.matches
  surge = 0
  pointerX = -1
  pointerY = -1
  if (reducedMotion) {
    if (animationFrameId !== null) window.cancelAnimationFrame(animationFrameId)
    animationFrameId = null
    drawScene(3)
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
    if (reducedMotion) drawScene(3)
  })
  resizeObserver.observe(canvas)
  window.addEventListener('pointermove', handlePointerMove, { passive: true })
  window.addEventListener('pointerdown', handlePointerDown, { passive: true })
  resizeCanvas()
  if (reducedMotion) drawScene(3)
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
.windmill-polder-dusk {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}
</style>
