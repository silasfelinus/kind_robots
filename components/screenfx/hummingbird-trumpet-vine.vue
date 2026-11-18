<template>
  <canvas ref="canvasRef" class="hummingbird-trumpet-vine" />
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'

const canvasRef = ref<HTMLCanvasElement | null>(null)

const BLOOM_COOLDOWN_MS = 3000
const BLOOM_DURATION = 5 // seconds a click-triggered nectar flush lasts
const TWO_PI = Math.PI * 2
const VISIT_TIME = 2.6 // seconds a bird hovers at one flower
const FLIGHT_TIME = 1.1 // seconds a bird spends darting between flowers
const BIRD_COLORS = ['#2fbf71', '#1fa3a8', '#7bc043', '#3aa66b']
const THROAT_COLORS = ['#e8335a', '#ff6f3c', '#c2185b', '#ff9a3c']

function pick(list: string[], index: number, fallback: string): string {
  return list[index % list.length] ?? fallback
}

let context: CanvasRenderingContext2D | null = null
let resizeObserver: ResizeObserver | null = null
let motionQuery: MediaQueryList | null = null
let animationFrameId: number | null = null
let lastFrameTs = 0
let clock = 0
let width = 1
let height = 1
let reducedMotion = false
let bloomStart = -100
let bloomX = 0
let bloomY = 0
let lastBloomTs = 0
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
  if (now - lastBloomTs < BLOOM_COOLDOWN_MS) return
  lastBloomTs = now
  bloomStart = clock
  bloomX = point.x
  bloomY = point.y
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

// A sunny garden wall draped in trumpet vine. Hummingbirds work the flowers:
// each bird hovers at a bloom, sips, then darts to the next one on its own
// seeded route. Every position is a closed-form function of the shared clock
// (visit index + eased dart), so nothing accumulates per frame. Hover draws
// the nearest bird over to inspect the pointer; a rate-limited click makes
// the blooms around it flush open and sparkle with nectar.

function hash(n: number): number {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453
  return s - Math.floor(s)
}

type Flower = {
  x: number
  y: number
  stemX: number
  stemY: number
  angle: number
  size: number
}

// Flowers sit along three gently drooping vines; layout depends only on size.
function flowers(): Flower[] {
  const narrow = width < 600
  const perVine = narrow ? 5 : 8
  const list: Flower[] = []
  for (let v = 0; v < 3; v += 1) {
    for (let i = 0; i < perVine; i += 1) {
      const u = (i + 0.5 + (hash(v * 9 + i) - 0.5) * 0.5) / perVine
      const p = vinePoint(v, u)
      list.push({
        x: p.x + (hash(v * 13 + i * 5) - 0.5) * 16,
        y: p.y + 14 + hash(v * 31 + i * 7) * 22,
        stemX: p.x,
        stemY: p.y,
        angle: Math.PI / 2 + (hash(v * 17 + i * 3) - 0.5) * 0.9,
        size: Math.min(width, height) * (narrow ? 0.075 : 0.06),
      })
    }
  }
  return list
}

function vinePoint(v: number, u: number): { x: number; y: number } {
  const baseY = height * (0.2 + v * 0.22)
  const sag = height * 0.08 * Math.sin(u * Math.PI)
  return {
    x: u * width,
    y: baseY + sag + Math.sin(u * 7 + v * 2) * height * 0.015,
  }
}

function drawBackdrop(): void {
  if (!context) return
  const sky = context.createLinearGradient(0, 0, 0, height)
  sky.addColorStop(0, '#bfe6f2')
  sky.addColorStop(1, '#f6eccf')
  context.fillStyle = sky
  context.fillRect(0, 0, width, height)

  // Warm stucco wall with soft blocks.
  context.fillStyle = 'rgba(233, 201, 158, 0.85)'
  context.fillRect(0, height * 0.12, width, height * 0.88)
  context.strokeStyle = 'rgba(160, 120, 80, 0.18)'
  context.lineWidth = 1
  const row = Math.max(26, height * 0.06)
  for (let y = height * 0.12; y < height; y += row) {
    context.beginPath()
    context.moveTo(0, y)
    context.lineTo(width, y)
    context.stroke()
    const offset = (Math.round(y / row) % 2) * row
    for (let x = offset; x < width; x += row * 2) {
      context.beginPath()
      context.moveTo(x, y)
      context.lineTo(x, y + row)
      context.stroke()
    }
  }

  // Ground strip of lavender.
  const ground = context.createLinearGradient(0, height * 0.86, 0, height)
  ground.addColorStop(0, '#7a9a4a')
  ground.addColorStop(1, '#4f6e2f')
  context.fillStyle = ground
  context.fillRect(0, height * 0.86, width, height * 0.14)
  const tufts = width < 600 ? 30 : 60
  for (let i = 0; i < tufts; i += 1) {
    const x = hash(i * 2.3) * width
    const sway = Math.sin(clock * 1.1 + i) * 3
    context.strokeStyle = '#5c7a35'
    context.lineWidth = 1.5
    context.beginPath()
    context.moveTo(x, height)
    context.lineTo(x + sway, height * (0.84 + hash(i) * 0.04))
    context.stroke()
    context.fillStyle = '#9b7fd1'
    context.beginPath()
    context.arc(x + sway, height * (0.84 + hash(i) * 0.04), 2.5, 0, TWO_PI)
    context.fill()
  }
}

function drawVines(): void {
  if (!context) return
  context.strokeStyle = '#4d6b2a'
  context.lineCap = 'round'
  context.lineWidth = Math.max(3, Math.min(width, height) * 0.008)
  for (let v = 0; v < 3; v += 1) {
    context.beginPath()
    for (let i = 0; i <= 40; i += 1) {
      const p = vinePoint(v, i / 40)
      if (i === 0) context.moveTo(p.x, p.y)
      else context.lineTo(p.x, p.y)
    }
    context.stroke()
    // Compound leaves along the vine.
    const leaves = width < 600 ? 10 : 18
    for (let i = 0; i < leaves; i += 1) {
      const u = (i + 0.3) / leaves
      const p = vinePoint(v, u)
      const flip = i % 2 === 0 ? -1 : 1
      const sway = Math.sin(clock * 0.8 + i + v) * 0.12
      context.save()
      context.translate(p.x, p.y)
      context.rotate(flip * 0.9 + sway)
      context.fillStyle = i % 3 === 0 ? '#3f7d32' : '#5a9a3c'
      context.beginPath()
      context.ellipse(0, -10, 4.5, 11, 0, 0, TWO_PI)
      context.fill()
      context.restore()
    }
  }
}

// How open a flower is (0.6 resting, up to 1 during a click flush).
function flush(f: Flower): number {
  const age = clock - bloomStart
  if (age < 0 || age > BLOOM_DURATION) return 0
  const d = Math.hypot(f.x - bloomX, f.y - bloomY)
  const reach = Math.min(width, height) * 0.35
  if (d > reach) return 0
  const delay = (d / reach) * 0.8
  const local = age - delay
  if (local < 0) return 0
  const envelope = Math.sin(
    Math.min(1, local / (BLOOM_DURATION - 0.8)) * Math.PI,
  )
  return envelope * (1 - d / reach)
}

function drawFlower(f: Flower, index: number): void {
  if (!context) return
  const open = 0.6 + flush(f) * 0.4
  const swing = Math.sin(clock * 0.9 + index) * 0.06
  context.strokeStyle = '#4d6b2a'
  context.lineWidth = 2
  context.beginPath()
  context.moveTo(f.stemX, f.stemY)
  context.lineTo(f.x, f.y)
  context.stroke()
  context.save()
  context.translate(f.x, f.y)
  context.rotate(f.angle - Math.PI / 2 + swing)
  // Trumpet tube.
  const len = f.size * 1.4
  const tube = context.createLinearGradient(0, 0, 0, len)
  tube.addColorStop(0, '#d9622b')
  tube.addColorStop(1, pick(THROAT_COLORS, index, '#e8335a'))
  context.fillStyle = tube
  context.beginPath()
  context.moveTo(-f.size * 0.12, 0)
  context.lineTo(f.size * 0.12, 0)
  context.lineTo(f.size * 0.3 * open, len)
  context.lineTo(-f.size * 0.3 * open, len)
  context.closePath()
  context.fill()
  // Flared mouth with five lobes.
  context.fillStyle = '#ff8a3d'
  for (let i = 0; i < 5; i += 1) {
    const a = ((i - 2) / 4) * 1.6 * open
    context.beginPath()
    context.ellipse(
      Math.sin(a) * f.size * 0.32,
      len + Math.cos(a) * f.size * 0.05,
      f.size * 0.18 * open,
      f.size * 0.12,
      a,
      0,
      TWO_PI,
    )
    context.fill()
  }
  context.fillStyle = '#ffd34d'
  context.beginPath()
  context.ellipse(0, len, f.size * 0.16 * open, f.size * 0.06, 0, 0, TWO_PI)
  context.fill()
  context.restore()

  const sparkle = flush(f)
  if (sparkle > 0.05) {
    context.save()
    context.globalCompositeOperation = 'lighter'
    for (let s = 0; s < 4; s += 1) {
      const a = clock * 2 + s * 1.6 + index
      const r = f.size * (0.6 + s * 0.25)
      context.fillStyle = `rgba(255, 230, 140, ${0.5 * sparkle})`
      context.beginPath()
      context.arc(
        f.x + Math.cos(a) * r,
        f.y + Math.sin(a) * r * 0.6 + f.size,
        1.8 + sparkle * 1.5,
        0,
        TWO_PI,
      )
      context.fill()
    }
    context.restore()
  }
}

// Where a flower's mouth is, so a bird can hover in front of it.
function mouthPoint(f: Flower): { x: number; y: number } {
  const len = f.size * 1.4
  const a = f.angle
  return {
    x: f.x + Math.cos(a) * len + Math.cos(a) * f.size * 0.9,
    y: f.y + Math.sin(a) * len + Math.sin(a) * f.size * 0.9,
  }
}

type BirdState = { x: number; y: number; facing: number; darting: boolean }

function birdState(
  k: number,
  list: Flower[],
  pointerPull: number,
): BirdState | null {
  if (list.length === 0) return null
  const leg = VISIT_TIME + FLIGHT_TIME
  const t = clock + hash(k * 5.3) * leg * list.length
  const step = Math.floor(t / leg)
  const phase = t - step * leg
  const flowerAt = (n: number): Flower => {
    const idx = Math.floor(hash(k * 41.3 + n * 7.7) * list.length)
    return list[idx] ?? (list[0] as Flower)
  }
  const from = mouthPoint(flowerAt(step))
  const to = mouthPoint(flowerAt(step + 1))
  let x: number
  let y: number
  let darting = false
  if (phase < VISIT_TIME) {
    x = from.x + Math.sin(clock * 3 + k) * 3
    y = from.y + Math.sin(clock * 4.3 + k * 2) * 2.5
  } else {
    const f = (phase - VISIT_TIME) / FLIGHT_TIME
    const ease = f * f * (3 - 2 * f)
    x = from.x + (to.x - from.x) * ease
    y =
      from.y +
      (to.y - from.y) * ease -
      Math.sin(f * Math.PI) * Math.min(width, height) * 0.06
    darting = true
  }
  if (pointerPull > 0 && pointerX >= 0) {
    const hoverX = pointerX + 28 * (x < pointerX ? -1 : 1)
    x += (hoverX - x) * pointerPull
    y += (pointerY - y) * pointerPull
  }
  const facing = darting
    ? Math.sign(to.x - from.x) || 1
    : pointerPull > 0
      ? Math.sign(pointerX - x) || 1
      : Math.sign(Math.sin(k * 3.1 + step)) || 1
  return { x, y, facing, darting }
}

function drawBird(b: BirdState, k: number, size: number): void {
  if (!context) return
  context.save()
  context.translate(b.x, b.y)
  context.scale(b.facing, 1)
  context.rotate(b.darting ? -0.15 : 0.35)
  // Wing blur: two translucent fans flicker at high frequency.
  const beat = Math.sin(clock * 60 + k) * 0.5 + 0.5
  context.fillStyle = `rgba(210, 235, 225, ${0.35 + beat * 0.2})`
  for (const sign of [-1, 1]) {
    context.beginPath()
    context.ellipse(
      -size * 0.1,
      -size * 0.3,
      size * 0.25,
      size * (0.7 + beat * 0.2),
      sign * (0.6 + beat * 0.3),
      0,
      TWO_PI,
    )
    context.fill()
  }
  // Body.
  context.fillStyle = pick(BIRD_COLORS, k, '#2fbf71')
  context.beginPath()
  context.ellipse(0, 0, size * 0.55, size * 0.28, 0, 0, TWO_PI)
  context.fill()
  // Tail.
  context.beginPath()
  context.moveTo(-size * 0.45, 0)
  context.lineTo(-size * 0.95, size * 0.18)
  context.lineTo(-size * 0.9, -size * 0.1)
  context.closePath()
  context.fill()
  // Ruby throat and white belly.
  context.fillStyle = '#d81b60'
  context.beginPath()
  context.ellipse(
    size * 0.32,
    size * 0.1,
    size * 0.18,
    size * 0.13,
    0,
    0,
    TWO_PI,
  )
  context.fill()
  context.fillStyle = 'rgba(250, 250, 240, 0.85)'
  context.beginPath()
  context.ellipse(0, size * 0.14, size * 0.3, size * 0.1, 0, 0, TWO_PI)
  context.fill()
  // Head, eye and needle beak.
  context.fillStyle = pick(BIRD_COLORS, k + 1, '#1fa3a8')
  context.beginPath()
  context.arc(size * 0.5, -size * 0.08, size * 0.2, 0, TWO_PI)
  context.fill()
  context.fillStyle = '#111'
  context.beginPath()
  context.arc(size * 0.56, -size * 0.12, size * 0.05, 0, TWO_PI)
  context.fill()
  context.strokeStyle = '#222'
  context.lineWidth = Math.max(1, size * 0.05)
  context.beginPath()
  context.moveTo(size * 0.68, -size * 0.06)
  context.lineTo(size * 1.25, size * 0.02)
  context.stroke()
  context.restore()
}

function drawScene(): void {
  if (!context) return
  drawBackdrop()
  drawVines()
  const list = flowers()
  list.forEach((f, i) => drawFlower(f, i))

  const narrow = width < 600
  const count = narrow ? 3 : 5
  const size = Math.max(10, Math.min(width, height) * (narrow ? 0.06 : 0.045))

  const birds: BirdState[] = []
  for (let k = 0; k < count; k += 1) {
    const b = birdState(k, list, 0)
    if (b) birds.push(b)
  }
  // The bird nearest the pointer comes over to inspect it.
  let nearest = -1
  if (pointerX >= 0) {
    let best = Math.min(width, height) * 0.45
    birds.forEach((b, k) => {
      const d = Math.hypot(b.x - pointerX, b.y - pointerY)
      if (d < best) {
        best = d
        nearest = k
      }
    })
  }
  birds.forEach((b, k) => {
    const state = k === nearest ? birdState(k, list, 0.85) : b
    if (state) drawBird(state, k, size)
  })

  // Dappled sunlight drifting across the wall.
  context.save()
  context.globalCompositeOperation = 'lighter'
  for (let i = 0; i < 5; i += 1) {
    const x = ((hash(i * 3.1) + clock * 0.006 * (1 + i * 0.2)) % 1.2) * width
    const y = height * (0.2 + hash(i * 6.2) * 0.6)
    const r = Math.min(width, height) * (0.12 + hash(i) * 0.08)
    const glow = context.createRadialGradient(x, y, 0, x, y, r)
    glow.addColorStop(0, 'rgba(255, 240, 200, 0.12)')
    glow.addColorStop(1, 'rgba(255, 240, 200, 0)')
    context.fillStyle = glow
    context.fillRect(x - r, y - r, r * 2, r * 2)
  }
  context.restore()
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
  clock = 1.2
  bloomStart = -100
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
.hummingbird-trumpet-vine {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}
</style>
