<template>
  <canvas ref="canvasRef" class="weathervane-hilltop" />
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'

const canvasRef = ref<HTMLCanvasElement | null>(null)

const GUST_COOLDOWN_MS = 2500
const GUST_SECONDS = 3.5 // a click-triggered gust swells, then dies away
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
let gustStart = -100
let lastGustTs = 0
let pointerX = -1
let pointerY = -1

// A grassy hilltop at golden hour with a rooster weathervane on a post.
// The wind is a closed-form function of time: a slow prevailing breeze
// whose direction wanders, plus gentle gusts. Grass blades, a windsock,
// a dandelion-seed haze and the clouds all read that same wind, and the
// vane swings toward it with a damped spring computed per frame from the
// current wind angle (nothing accumulates except the vane's own state).
// Hovering pushes a little local breeze away from the pointer through the
// grass; a rate-limited click sends one strong gust that spins the vane.

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
  if (now - lastGustTs < GUST_COOLDOWN_MS) return
  lastGustTs = now
  gustStart = clock
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

function hash(n: number): number {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453
  return s - Math.floor(s)
}

function gustBoost(): number {
  const age = clock - gustStart
  if (age < 0 || age >= GUST_SECONDS) return 0
  // Quick swell, slow fade.
  return (
    Math.sin(Math.min(1, age / 0.5) * (Math.PI / 2)) *
    (1 - age / GUST_SECONDS) ** 1.5
  )
}

// Prevailing wind angle (radians, 0 = blowing toward +x on screen) and
// strength in 0..1, both smooth functions of time.
function windAngle(t: number): number {
  return (
    Math.sin(t * 0.045) * 1.6 +
    Math.sin(t * 0.11 + 1.3) * 0.5 +
    Math.sin(t * 0.27 + 4.1) * 0.12
  )
}

function windStrength(t: number): number {
  const base = 0.35 + 0.2 * Math.sin(t * 0.07 + 2) + 0.12 * Math.sin(t * 0.31)
  return Math.min(1.4, Math.max(0.12, base) + gustBoost() * 0.9)
}

// The vane is a damped spring chasing the wind's heading; a gust adds spin.
let vaneAngle = 0
let vaneVelocity = 0

function stepVane(dt: number): void {
  const target = windAngle(clock)
  let diff = target - vaneAngle
  diff = Math.atan2(Math.sin(diff), Math.cos(diff))
  const strength = windStrength(clock)
  vaneVelocity += diff * (2.2 + strength * 3) * dt
  vaneVelocity += gustBoost() * 9 * dt
  vaneVelocity *= Math.exp(-dt * 1.6)
  vaneAngle = (vaneAngle + vaneVelocity * dt) % TWO_PI
}

type Layout = {
  horizon: number
  postX: number
  postTop: number
  postBase: number
  scale: number
}

function layout(): Layout {
  const narrow = width < 600
  const horizon = height * 0.62
  const postX = width * (narrow ? 0.5 : 0.58)
  const scale = Math.min(width, height) * (narrow ? 0.0021 : 0.0018)
  const postBase = hillY(postX) + 4
  const postTop = postBase - Math.min(height * 0.42, 260 * scale * 2.2)
  return { horizon, postX, postTop, postBase, scale }
}

function hillY(x: number): number {
  // The near hill crests a little right of centre.
  const u = x / width
  return height * (0.66 - 0.1 * Math.exp(-((u - 0.58) ** 2) / 0.09))
}

function drawSky(): void {
  if (!context) return
  const sky = context.createLinearGradient(0, 0, 0, height * 0.7)
  sky.addColorStop(0, '#4b5f8f')
  sky.addColorStop(0.45, '#d59a7c')
  sky.addColorStop(1, '#f6c977')
  context.fillStyle = sky
  context.fillRect(0, 0, width, height)

  // A low sun near the horizon on the left.
  const sunX = width * 0.2
  const sunY = height * 0.52
  const sunR = Math.min(width, height) * 0.06
  const halo = context.createRadialGradient(sunX, sunY, 0, sunX, sunY, sunR * 6)
  halo.addColorStop(0, 'rgba(255, 236, 180, 0.55)')
  halo.addColorStop(1, 'rgba(255, 236, 180, 0)')
  context.fillStyle = halo
  context.fillRect(sunX - sunR * 6, sunY - sunR * 6, sunR * 12, sunR * 12)
  context.fillStyle = '#fff1c6'
  context.beginPath()
  context.arc(sunX, sunY, sunR, 0, TWO_PI)
  context.fill()
}

function drawClouds(): void {
  if (!context) return
  // Clouds drift with the wind's horizontal component; position is the
  // integral of a smooth function, approximated in closed form by a steady
  // drift plus a bounded sway so it never accumulates.
  const count = width < 600 ? 4 : 7
  const drift = clock * 9
  for (let c = 0; c < count; c += 1) {
    const span = width + 320
    const sway = Math.sin(windAngle(clock)) * 30
    const x =
      ((hash(c * 2.3) * span + drift * (0.6 + hash(c) * 0.6) + sway) % span) -
      160
    const y = height * (0.08 + hash(c * 5.1) * 0.3)
    const w = 70 + hash(c * 7.7) * 110
    context.fillStyle = `rgba(255, 228, 214, ${0.35 + hash(c * 3.3) * 0.25})`
    for (let p = 0; p < 4; p += 1) {
      context.beginPath()
      context.ellipse(
        x + (p - 1.5) * w * 0.28,
        y + Math.sin(p * 2.1) * 6,
        w * 0.32,
        w * 0.14,
        0,
        0,
        TWO_PI,
      )
      context.fill()
    }
  }
}

function drawHills(l: Layout): void {
  if (!context) return
  // Far ridge.
  context.fillStyle = '#7a6a7a'
  context.beginPath()
  context.moveTo(0, height)
  for (let x = 0; x <= width; x += 12) {
    const y =
      l.horizon -
      30 -
      Math.sin(x * 0.006 + 1) * 22 -
      hash(Math.floor(x / 60)) * 6
    context.lineTo(x, y)
  }
  context.lineTo(width, height)
  context.closePath()
  context.fill()

  // Near hill.
  const grass = context.createLinearGradient(0, height * 0.55, 0, height)
  grass.addColorStop(0, '#9ea64e')
  grass.addColorStop(1, '#3f5a2a')
  context.fillStyle = grass
  context.beginPath()
  context.moveTo(0, height)
  for (let x = 0; x <= width; x += 8) context.lineTo(x, hillY(x))
  context.lineTo(width, height)
  context.closePath()
  context.fill()
}

function localBreeze(x: number, y: number): number {
  if (pointerX < 0) return 0
  const dx = x - pointerX
  const dy = y - pointerY
  const d2 = dx * dx + dy * dy
  const reach = 120
  if (d2 > reach * reach * 4) return 0
  // Push blades away from the pointer horizontally.
  return Math.sign(dx) * Math.exp(-d2 / (reach * reach)) * 0.9
}

function drawGrass(): void {
  if (!context) return
  const angle = windAngle(clock)
  const strength = windStrength(clock)
  const lean = Math.cos(angle) * strength
  const blades = width < 600 ? 140 : 280
  context.lineCap = 'round'
  for (let b = 0; b < blades; b += 1) {
    const x = hash(b * 1.31) * width
    const depth = hash(b * 2.71)
    const y = hillY(x) + 6 + depth * (height - hillY(x)) * 0.9
    const h = 10 + depth * 26
    const ripple = Math.sin(clock * 2.2 - x * 0.025 + hash(b) * 2) * 0.35
    const bend = (lean * (0.7 + ripple) + localBreeze(x, y)) * h * 0.7
    const shade = 70 + Math.floor(depth * 50)
    context.strokeStyle = `rgb(${shade + 40}, ${shade + 80}, ${shade - 20})`
    context.lineWidth = 1 + depth * 1.4
    context.beginPath()
    context.moveTo(x, y)
    context.quadraticCurveTo(
      x + bend * 0.3,
      y - h * 0.6,
      x + bend,
      y - h + Math.abs(bend) * 0.3,
    )
    context.stroke()
  }
}

function drawPost(l: Layout): void {
  if (!context) return
  const s = l.scale
  context.strokeStyle = '#2d2420'
  context.lineWidth = Math.max(3, 7 * s)
  context.beginPath()
  context.moveTo(l.postX, l.postBase)
  context.lineTo(l.postX, l.postTop)
  context.stroke()

  // Compass arms N/E/S/W, drawn in a tilted plane so they read as a cross.
  const armY = l.postTop + 26 * s
  const armR = 46 * s
  context.lineWidth = Math.max(1.5, 3 * s)
  context.strokeStyle = '#3a2d25'
  context.fillStyle = '#3a2d25'
  context.font = `bold ${Math.max(10, Math.round(14 * s))}px serif`
  context.textAlign = 'center'
  context.textBaseline = 'middle'
  const labels = ['E', 'S', 'W', 'N']
  for (let k = 0; k < 4; k += 1) {
    const a = (k * Math.PI) / 2
    const ex = l.postX + Math.cos(a) * armR
    const ey = armY + Math.sin(a) * armR * 0.3
    context.beginPath()
    context.moveTo(l.postX, armY)
    context.lineTo(ex, ey)
    context.stroke()
    context.fillText(
      labels[k] ?? '',
      l.postX + Math.cos(a) * armR * 1.25,
      armY + Math.sin(a) * armR * 0.38,
    )
  }
}

function drawRooster(l: Layout): void {
  if (!context) return
  const s = l.scale
  const cy = l.postTop - 4 * s
  // The rooster is a flat silhouette rotating about the vertical post.
  // Its apparent width is cos(vaneAngle); the sign tells which way it faces.
  const facing = Math.cos(vaneAngle)
  const squash = Math.max(0.08, Math.abs(facing))
  const dir = facing >= 0 ? 1 : -1
  context.save()
  context.translate(l.postX, cy)
  context.scale(squash * dir * s, s)
  context.fillStyle = '#1f1714'
  context.beginPath()
  // Arrow shaft and tail feathers.
  context.moveTo(-70, 0)
  context.lineTo(70, 0)
  context.lineTo(70, 4)
  context.lineTo(-70, 4)
  context.closePath()
  context.fill()
  context.beginPath()
  context.moveTo(78, 2)
  context.lineTo(62, -8)
  context.lineTo(62, 12)
  context.closePath()
  context.fill()
  context.beginPath()
  context.moveTo(-70, 2)
  context.lineTo(-86, -14)
  context.lineTo(-78, 2)
  context.lineTo(-86, 18)
  context.closePath()
  context.fill()
  // Rooster body standing on the shaft.
  context.beginPath()
  context.moveTo(-34, 0)
  context.quadraticCurveTo(-56, -40, -40, -70) // tail sweep
  context.quadraticCurveTo(-28, -46, -16, -40)
  context.quadraticCurveTo(-4, -30, 12, -36)
  context.lineTo(18, -58) // neck
  context.quadraticCurveTo(22, -72, 32, -66) // head
  context.lineTo(42, -62) // beak
  context.lineTo(32, -58)
  context.quadraticCurveTo(30, -40, 26, -28)
  context.quadraticCurveTo(14, -6, 0, -4)
  context.lineTo(6, 0) // legs
  context.closePath()
  context.fill()
  // Comb.
  context.beginPath()
  context.arc(24, -72, 4, Math.PI, TWO_PI)
  context.arc(31, -72, 3.5, Math.PI, TWO_PI)
  context.fill()
  context.restore()

  // Warm rim light on the side facing the sun.
  context.fillStyle = 'rgba(255, 210, 140, 0.4)'
  context.beginPath()
  context.arc(l.postX, l.postTop, 3 * s, 0, TWO_PI)
  context.fill()
}

function drawWindsock(l: Layout): void {
  if (!context) return
  const s = l.scale
  const x = l.postX - (width < 600 ? width * 0.3 : width * 0.32)
  const base = hillY(x) + 4
  const top = base - 120 * s
  context.strokeStyle = '#3a2d25'
  context.lineWidth = Math.max(2, 4 * s)
  context.beginPath()
  context.moveTo(x, base)
  context.lineTo(x, top)
  context.stroke()
  const strength = windStrength(clock)
  const dir = Math.cos(windAngle(clock)) >= 0 ? 1 : -1
  const lift = Math.min(1, strength * 1.1) // full wind holds it straight out
  const segments = 5
  const segLen = 16 * s
  for (let k = 0; k < segments; k += 1) {
    const droop = (1 - lift) * (k + 1) * 6 * s
    const flutter = Math.sin(clock * 9 + k * 1.2) * 2 * s * strength
    const x0 = x + dir * k * segLen * (0.6 + lift * 0.4)
    const x1 = x + dir * (k + 1) * segLen * (0.6 + lift * 0.4)
    const r0 = 9 * s * (1 - k * 0.1)
    const r1 = 9 * s * (1 - (k + 1) * 0.1)
    context.fillStyle = k % 2 === 0 ? '#e1573a' : '#f4ede0'
    context.beginPath()
    context.moveTo(x0, top - r0 + k * 6 * s * (1 - lift) + flutter)
    context.lineTo(x1, top - r1 + droop + flutter)
    context.lineTo(x1, top + r1 + droop + flutter)
    context.lineTo(x0, top + r0 + k * 6 * s * (1 - lift) + flutter)
    context.closePath()
    context.fill()
  }
}

function drawSeeds(): void {
  if (!context) return
  // Dandelion seeds carried along the wind's heading.
  const count = width < 600 ? 22 : 44
  const angle = windAngle(clock)
  const strength = windStrength(clock)
  const span = width + 80
  for (let k = 0; k < count; k += 1) {
    const speed = 18 + hash(k * 3.7) * 22
    const travel = clock * speed
    const x = ((hash(k * 1.9) * span + travel) % span) - 40
    const baseY = height * (0.2 + hash(k * 4.3) * 0.45)
    const y =
      baseY + Math.sin(clock * 0.8 + k) * 14 - Math.sin(angle) * strength * 20
    const a = 0.35 + 0.3 * Math.sin(clock * 1.3 + k * 2.1)
    context.fillStyle = `rgba(255, 250, 236, ${a})`
    context.beginPath()
    context.arc(x, y, 1.6, 0, TWO_PI)
    context.fill()
    context.strokeStyle = `rgba(255, 250, 236, ${a * 0.6})`
    context.lineWidth = 0.6
    context.beginPath()
    context.moveTo(x, y)
    context.lineTo(x - 3, y + 4)
    context.stroke()
  }
}

function drawScene(): void {
  if (!context) return
  const l = layout()
  drawSky()
  drawClouds()
  drawHills(l)
  drawWindsock(l)
  drawPost(l)
  drawRooster(l)
  drawGrass()
  drawSeeds()
  const vignette = context.createRadialGradient(
    width / 2,
    height * 0.5,
    Math.min(width, height) * 0.35,
    width / 2,
    height * 0.5,
    Math.max(width, height) * 0.8,
  )
  vignette.addColorStop(0, 'rgba(0, 0, 0, 0)')
  vignette.addColorStop(1, 'rgba(20, 10, 30, 0.4)')
  context.fillStyle = vignette
  context.fillRect(0, 0, width, height)
}

function renderFrame(timestamp: number): void {
  if (!context) return
  const dt = lastFrameTs ? Math.min(0.1, (timestamp - lastFrameTs) / 1000) : 0
  lastFrameTs = timestamp
  clock += dt
  stepVane(dt)
  drawScene()
  animationFrameId = window.requestAnimationFrame(renderFrame)
}

function drawStill(): void {
  // A calm golden-hour frame with the rooster turned in profile.
  clock = 40
  vaneAngle = 0.35
  vaneVelocity = 0
  gustStart = -100
  pointerX = -1
  pointerY = -1
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
  vaneAngle = windAngle(0)
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
.weathervane-hilltop {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}
</style>
