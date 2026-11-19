<template>
  <canvas ref="canvasRef" class="rice-terrace-monsoon" />
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'

const canvasRef = ref<HTMLCanvasElement | null>(null)

const RIPPLE_COOLDOWN_MS = 3000
const RIPPLE_DURATION = 4.5 // seconds a click-triggered ripple lasts
const TWO_PI = Math.PI * 2
const CYCLE = 18 // seconds for one fill-and-spill pass down the hillside
const SHELTER_RADIUS = 90 // px of rain the pointer parts

let context: CanvasRenderingContext2D | null = null
let resizeObserver: ResizeObserver | null = null
let motionQuery: MediaQueryList | null = null
let animationFrameId: number | null = null
let lastFrameTs = 0
let clock = 0
let width = 1
let height = 1
let reducedMotion = false
let rippleStart = -100
let rippleX = 0
let rippleY = 0
let lastRippleTs = 0
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
  if (now - lastRippleTs < RIPPLE_COOLDOWN_MS) return
  lastRippleTs = now
  rippleStart = clock
  rippleX = point.x
  rippleY = point.y
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

// A monsoon afternoon on a hillside of rice terraces. Rain fills the top
// paddy until it brims and spills down a little waterfall into the next,
// which fills and spills in turn, all the way down the slope; then the cycle
// starts again. Every water level is a closed-form function of the shared
// clock, so nothing accumulates per frame. Hovering parts the rain like an
// umbrella; a rate-limited click drops a ring of ripples across the paddies.

function hash(n: number): number {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453
  return s - Math.floor(s)
}

type Terrace = {
  top: number // y of the water surface when full
  bottom: number // y of the terrace floor
  left: number
  right: number
  spillX: number // where the overflow pours over the lip
}

function terraces(): Terrace[] {
  const narrow = width < 600
  const count = narrow ? 5 : 6
  const start = height * 0.34
  const band = (height * 0.62) / count
  const list: Terrace[] = []
  for (let i = 0; i < count; i += 1) {
    const top = start + i * band
    // Each step juts a little further out, like contour lines on a hill.
    const inset = width * (0.06 + (count - i) * 0.025)
    const curve = Math.sin(i * 1.7) * width * 0.03
    list.push({
      top,
      bottom: top + band * 0.62,
      left: inset * 0.4 + curve,
      right: width - inset * 0.4 + curve,
      spillX: width * (0.2 + hash(i * 3.7) * 0.6),
    })
  }
  return list
}

// 0..1 fill level for terrace i at the current clock: each paddy takes its
// turn filling, then holds full while the ones below fill, then drains back
// down gently near the end of the cycle.
function fillLevel(i: number, count: number): number {
  const t = (clock % CYCLE) / CYCLE
  const slot = 0.8 / count
  const begin = i * slot
  const local = (t - begin) / slot
  if (t > 0.88) {
    const drain = (t - 0.88) / 0.12
    return 1 - drain * drain * (3 - 2 * drain) * 0.65
  }
  if (local <= 0) return 0.35
  if (local >= 1) return 1
  return 0.35 + 0.65 * local * local * (3 - 2 * local)
}

function spilling(i: number, count: number): boolean {
  const t = (clock % CYCLE) / CYCLE
  const slot = 0.8 / count
  return t > (i + 1) * slot - slot * 0.1 && t < 0.92
}

function drawSky(): void {
  if (!context) return
  const sky = context.createLinearGradient(0, 0, 0, height * 0.5)
  sky.addColorStop(0, '#5d6d79')
  sky.addColorStop(1, '#a9b8b2')
  context.fillStyle = sky
  context.fillRect(0, 0, width, height)

  // Far ridges fading into the rain.
  const ridges = [
    { y: 0.22, color: 'rgba(84, 107, 99, 0.55)', amp: 0.05 },
    { y: 0.29, color: 'rgba(62, 92, 72, 0.7)', amp: 0.04 },
  ]
  ridges.forEach((r, k) => {
    if (!context) return
    context.fillStyle = r.color
    context.beginPath()
    context.moveTo(0, height)
    for (let x = 0; x <= width + 12; x += 12) {
      const u = x / width
      const y =
        height * r.y -
        Math.sin(u * 5 + k * 1.3) * height * r.amp -
        Math.sin(u * 13 + k) * height * 0.01
      context.lineTo(x, y)
    }
    context.lineTo(width, height)
    context.closePath()
    context.fill()
  })

  // Low clouds drifting slowly.
  for (let i = 0; i < 6; i += 1) {
    const x = ((hash(i * 4.1) + clock * 0.004 * (1 + i * 0.3)) % 1.3) * width
    const y = height * (0.06 + hash(i * 2.9) * 0.18)
    const r = Math.min(width, height) * (0.18 + hash(i) * 0.1)
    const cloud = context.createRadialGradient(x, y, 0, x, y, r)
    cloud.addColorStop(0, 'rgba(220, 226, 226, 0.35)')
    cloud.addColorStop(1, 'rgba(220, 226, 226, 0)')
    context.fillStyle = cloud
    context.fillRect(x - r, y - r, r * 2, r * 2)
  }
}

function rippleRadius(): number {
  const age = clock - rippleStart
  if (age < 0 || age > RIPPLE_DURATION) return -1
  return age * Math.min(width, height) * 0.22
}

// Terraces follow the hill's contour: every edge bows along a gentle curve.
function bow(i: number, x: number): number {
  return height * 0.03 * Math.sin((x / width) * Math.PI * 1.3 + i * 0.7)
}

function bandPath(
  t: Terrace,
  i: number,
  y0: number,
  y1: number,
  flare = 0,
): void {
  if (!context) return
  const steps = 24
  context.beginPath()
  for (let s = 0; s <= steps; s += 1) {
    const x = t.left + ((t.right - t.left) * s) / steps
    const y = y0 + bow(i, x)
    if (s === 0) context.moveTo(x, y)
    else context.lineTo(x, y)
  }
  for (let s = steps; s >= 0; s -= 1) {
    const x = t.left - flare + ((t.right - t.left + flare * 2) * s) / steps
    context.lineTo(x, y1 + bow(i, x))
  }
  context.closePath()
}

function drawTerrace(t: Terrace, i: number, count: number): void {
  if (!context) return
  const depth = t.bottom - t.top
  // Earthen bank below the paddy.
  const bankBottom = t.bottom + depth * 0.6
  const bank = context.createLinearGradient(0, t.bottom, 0, bankBottom)
  bank.addColorStop(0, i % 2 === 0 ? '#6a5534' : '#62502f')
  bank.addColorStop(1, '#3f3220')
  context.fillStyle = bank
  bandPath(t, i, t.bottom, bankBottom, 6)
  context.fill()

  // Paddy floor of green rice shoots, visible when the water is low.
  const floor = context.createLinearGradient(0, t.top, 0, t.bottom)
  floor.addColorStop(0, '#79a53e')
  floor.addColorStop(1, '#4e7a2a')
  context.fillStyle = floor
  bandPath(t, i, t.top, t.bottom)
  context.fill()

  // Water surface: reflective, tinted with the sky.
  const level = fillLevel(i, count)
  const waterTop = t.bottom - depth * level
  const water = context.createLinearGradient(0, waterTop, 0, t.bottom)
  water.addColorStop(0, 'rgba(196, 214, 214, 0.88)')
  water.addColorStop(1, 'rgba(104, 136, 148, 0.78)')
  context.fillStyle = water
  bandPath(t, i, waterTop, t.bottom)
  context.fill()

  context.save()
  bandPath(t, i, waterTop, t.bottom)
  context.clip()

  // Sky glints sliding across the flooded paddy.
  const glintX =
    t.left +
    (((clock * 0.03 + hash(i * 5.1)) % 1) * 1.4 - 0.2) * (t.right - t.left)
  const glint = context.createLinearGradient(glintX - 80, 0, glintX + 80, 0)
  glint.addColorStop(0, 'rgba(255, 255, 255, 0)')
  glint.addColorStop(0.5, 'rgba(255, 255, 255, 0.18)')
  glint.addColorStop(1, 'rgba(255, 255, 255, 0)')
  context.fillStyle = glint
  context.fillRect(glintX - 80, t.top - depth, 160, depth * 3)

  // Raindrop rings dimpling the surface.
  const rings = width < 600 ? 5 : 9
  for (let r = 0; r < rings; r += 1) {
    const period = 1.1 + hash(i * 17 + r) * 0.9
    const phase = (clock + hash(i * 29 + r * 3) * period) / period
    const cycleIdx = Math.floor(phase)
    const age = phase - cycleIdx
    const x =
      t.left + hash(i * 7 + r * 13 + cycleIdx * 0.37) * (t.right - t.left)
    const y =
      waterTop +
      bow(i, x) +
      hash(i * 11 + r * 5 + cycleIdx * 0.53) * (t.bottom - waterTop)
    context.strokeStyle = `rgba(235, 245, 245, ${0.55 * (1 - age)})`
    context.lineWidth = 1
    context.beginPath()
    context.ellipse(x, y, 2 + age * 10, 1 + age * 3, 0, 0, TWO_PI)
    context.stroke()
  }

  // Click ripple: concentric rings expanding across every paddy it reaches.
  const radius = rippleRadius()
  if (radius > 0) {
    const fade = 1 - (clock - rippleStart) / RIPPLE_DURATION
    for (let k = 0; k < 3; k += 1) {
      const rr = radius - k * 18
      if (rr <= 0) continue
      context.strokeStyle = `rgba(255, 255, 255, ${0.6 * fade})`
      context.lineWidth = 1.5
      context.beginPath()
      context.ellipse(rippleX, rippleY, rr, rr * 0.32, 0, 0, TWO_PI)
      context.stroke()
    }
  }
  context.restore()

  // Rice shoots poking through the water in neat rows.
  const rows = width < 600 ? 14 : 26
  context.strokeStyle = '#9ccc52'
  context.lineWidth = 1.4
  context.beginPath()
  for (let r = 0; r < rows; r += 1) {
    const x = t.left + ((r + 0.5) / rows) * (t.right - t.left)
    const sway = Math.sin(clock * 1.3 + r * 0.7 + i) * 1.5
    const lift = bow(i, x)
    for (let tuft = -1; tuft <= 1; tuft += 1) {
      context.moveTo(x + tuft * 2, t.bottom - depth * 0.15 + lift)
      context.lineTo(
        x + tuft * 4 + sway,
        t.top + depth * (0.1 + Math.abs(tuft) * 0.12) + lift,
      )
    }
  }
  context.stroke()

  // Lip highlight on the bund wall.
  context.strokeStyle = 'rgba(176, 156, 108, 0.85)'
  context.lineWidth = 2
  context.beginPath()
  for (let s = 0; s <= 24; s += 1) {
    const x = t.left + ((t.right - t.left) * s) / 24
    if (s === 0) context.moveTo(x, t.bottom + bow(i, x))
    else context.lineTo(x, t.bottom + bow(i, x))
  }
  context.stroke()
}

function drawSpill(t: Terrace, next: Terrace | undefined, i: number): void {
  if (!context) return
  const lip = t.bottom + bow(i, t.spillX)
  const bankBottom = lip + (t.bottom - t.top) * 0.6
  const target = next
    ? next.top + (next.bottom - next.top) * 0.4 + bow(i + 1, t.spillX)
    : height
  context.save()
  for (let s = 0; s < 3; s += 1) {
    const x = t.spillX + (s - 1) * 3 + Math.sin(clock * 6 + s + i) * 1.2
    context.strokeStyle = `rgba(225, 238, 240, ${0.7 - s * 0.15})`
    context.lineWidth = 2.5 - s * 0.5
    context.beginPath()
    context.moveTo(x, lip - 2)
    context.quadraticCurveTo(x + 4, bankBottom, x + 2, target)
    context.stroke()
  }
  // Splash foam where it lands.
  for (let f = 0; f < 5; f += 1) {
    const a = clock * 4 + f * 1.3 + i
    context.fillStyle = 'rgba(240, 248, 250, 0.6)'
    context.beginPath()
    context.arc(
      t.spillX + 2 + Math.cos(a) * 6,
      target - Math.abs(Math.sin(a)) * 4,
      1.6,
      0,
      TWO_PI,
    )
    context.fill()
  }
  context.restore()
}

// A white egret wading along the middle terrace, stepping and pausing.
function drawEgret(list: Terrace[]): void {
  if (!context) return
  const t = list[Math.floor(list.length / 2)]
  if (!t) return
  const span = t.right - t.left
  const u = (Math.sin(clock * 0.07) + 1) / 2
  const x = t.left + span * (0.15 + u * 0.7)
  const y =
    t.bottom - (t.bottom - t.top) * 0.25 + bow(Math.floor(list.length / 2), x)
  const facing = Math.cos(clock * 0.07) >= 0 ? 1 : -1
  const size = Math.max(14, Math.min(width, height) * 0.04)
  const step = Math.sin(clock * 2.2)
  const peck = Math.max(0, Math.sin(clock * 0.9)) ** 8
  context.save()
  context.translate(x, y)
  context.scale(facing, 1)
  context.strokeStyle = '#2b2b2b'
  context.lineWidth = Math.max(1, size * 0.05)
  context.beginPath()
  context.moveTo(-size * 0.1, -size * 0.6)
  context.lineTo(-size * 0.1 + step * size * 0.12, 0)
  context.moveTo(size * 0.1, -size * 0.6)
  context.lineTo(size * 0.1 - step * size * 0.12, 0)
  context.stroke()
  context.fillStyle = '#f7f5ef'
  context.beginPath()
  context.ellipse(0, -size * 0.8, size * 0.45, size * 0.22, -0.2, 0, TWO_PI)
  context.fill()
  // S-curved neck, dipping to peck now and then.
  const headX = size * (0.55 + peck * 0.2)
  const headY = -size * (1.45 - peck * 0.9)
  context.strokeStyle = '#f7f5ef'
  context.lineWidth = size * 0.12
  context.lineCap = 'round'
  context.beginPath()
  context.moveTo(size * 0.3, -size * 0.85)
  context.quadraticCurveTo(size * 0.1, -size * 1.2, headX, headY)
  context.stroke()
  context.fillStyle = '#f7f5ef'
  context.beginPath()
  context.arc(headX, headY, size * 0.11, 0, TWO_PI)
  context.fill()
  context.strokeStyle = '#e0b030'
  context.lineWidth = Math.max(1, size * 0.05)
  context.beginPath()
  context.moveTo(headX + size * 0.08, headY)
  context.lineTo(headX + size * 0.4, headY + size * (0.05 + peck * 0.2))
  context.stroke()
  context.restore()
}

function drawRain(): void {
  if (!context) return
  const drops = width < 600 ? 110 : 240
  const fall = height * 1.1
  context.strokeStyle = 'rgba(220, 232, 236, 0.45)'
  context.lineWidth = 1
  context.beginPath()
  for (let d = 0; d < drops; d += 1) {
    const speed = 0.9 + hash(d * 1.9) * 0.5
    const y = ((hash(d * 3.3) + clock * speed) % 1) * fall - height * 0.05
    const x = hash(d * 7.1) * (width + 60) - 30 - y * 0.12
    if (pointerX >= 0) {
      const dx = x - pointerX
      const dy = y - pointerY
      // The pointer is a little umbrella: rain parts around it.
      if (dy < SHELTER_RADIUS * 0.6 && Math.hypot(dx, dy) < SHELTER_RADIUS)
        continue
    }
    const len = 10 + speed * 8
    context.moveTo(x, y)
    context.lineTo(x - len * 0.12, y + len)
  }
  context.stroke()

  if (pointerX >= 0) {
    // A faint sheltered glow under the umbrella.
    const glow = context.createRadialGradient(
      pointerX,
      pointerY,
      0,
      pointerX,
      pointerY,
      SHELTER_RADIUS,
    )
    glow.addColorStop(0, 'rgba(255, 244, 210, 0.12)')
    glow.addColorStop(1, 'rgba(255, 244, 210, 0)')
    context.fillStyle = glow
    context.fillRect(
      pointerX - SHELTER_RADIUS,
      pointerY - SHELTER_RADIUS,
      SHELTER_RADIUS * 2,
      SHELTER_RADIUS * 2,
    )
  }
}

function drawScene(): void {
  if (!context) return
  drawSky()
  const list = terraces()
  list.forEach((t, i) => drawTerrace(t, i, list.length))
  list.forEach((t, i) => {
    if (spilling(i, list.length)) drawSpill(t, list[i + 1], i)
  })
  drawEgret(list)
  drawRain()
  // Wet haze over everything.
  context.fillStyle = 'rgba(190, 205, 205, 0.08)'
  context.fillRect(0, 0, width, height)
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
  clock = CYCLE * 0.55
  rippleStart = -100
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
.rice-terrace-monsoon {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}
</style>
