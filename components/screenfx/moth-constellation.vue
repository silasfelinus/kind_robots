<!-- /components/screenfx/moth-constellation.vue -->
<template>
  <canvas ref="canvasRef" class="moth-constellation" />
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'

interface Moth {
  x: number
  y: number
  vx: number
  vy: number
  wingPhase: number
  wingSpeed: number
  size: number
  hue: number
  personality: number // -1..1, steers wander bias and rest tendency
  resting: boolean
  restUntil: number
  slotIndex: number | null // assigned constellation slot while gathering/aligned
  glow: number
}

interface Slot {
  x: number
  y: number
}

interface PointerState {
  x: number
  y: number
  active: boolean
}

type Phase = 'wander' | 'gathering' | 'aligned' | 'scattering'

const canvasRef = ref<HTMLCanvasElement | null>(null)

let animationFrameId: number | null = null
let resizeObserver: ResizeObserver | null = null
let motionQuery: MediaQueryList | null = null
let context: CanvasRenderingContext2D | null = null
let width = 1
let height = 1
let previousTimestamp = 0
let reducedMotion = false

const moths: Moth[] = []
const pointer: PointerState = { x: 0, y: 0, active: false }

let phase: Phase = 'wander'
let phaseStartedAt = 0
let nextEventAt = 0
let currentSlots: Slot[] = []
let seed = 1

// Small deterministic PRNG so a constellation's slot layout is reproducible for a given
// seed within a session, while still reading as "random" across events.
function nextSeeded(): number {
  seed = (seed * 1103515245 + 12345) & 0x7fffffff
  return seed / 0x7fffffff
}

function randomBetween(min: number, max: number): number {
  return min + Math.random() * (max - min)
}

function mothCount(): number {
  if (reducedMotion) return 8
  return Math.round(Math.min(26, Math.max(10, (width * height) / 55000)))
}

// A handful of simple readable constellation shapes, expressed as unit-square point
// clusters so they can be scaled/positioned anywhere on the canvas.
const CONSTELLATION_SHAPES: Slot[][] = [
  // Dipper-like arc
  [
    { x: 0.1, y: 0.6 },
    { x: 0.28, y: 0.5 },
    { x: 0.46, y: 0.44 },
    { x: 0.64, y: 0.42 },
    { x: 0.6, y: 0.2 },
    { x: 0.82, y: 0.15 },
    { x: 0.9, y: 0.35 },
  ],
  // Simple house/pentagon
  [
    { x: 0.5, y: 0.08 },
    { x: 0.15, y: 0.4 },
    { x: 0.3, y: 0.9 },
    { x: 0.7, y: 0.9 },
    { x: 0.85, y: 0.4 },
  ],
  // Cross
  [
    { x: 0.5, y: 0.05 },
    { x: 0.5, y: 0.35 },
    { x: 0.5, y: 0.65 },
    { x: 0.5, y: 0.95 },
    { x: 0.15, y: 0.5 },
    { x: 0.85, y: 0.5 },
  ],
  // Loose scatter ring
  [
    { x: 0.5, y: 0.05 },
    { x: 0.85, y: 0.25 },
    { x: 0.9, y: 0.65 },
    { x: 0.6, y: 0.95 },
    { x: 0.2, y: 0.85 },
    { x: 0.08, y: 0.45 },
  ],
]

function pickConstellationSlots(): Slot[] {
  const index = Math.min(
    CONSTELLATION_SHAPES.length - 1,
    Math.floor(nextSeeded() * CONSTELLATION_SHAPES.length),
  )
  const shape = CONSTELLATION_SHAPES[index]!
  const spanX = width * randomBetween(0.24, 0.4)
  const spanY = spanX * randomBetween(0.6, 0.9)
  const originX = randomBetween(spanX, width - spanX)
  const originY = randomBetween(height * 0.12, height * 0.55)

  return shape.map((point) => ({
    x: originX + (point.x - 0.5) * spanX,
    y: originY + (point.y - 0.5) * spanY,
  }))
}

function createMoth(): Moth {
  return {
    x: Math.random() * width,
    y: Math.random() * height,
    vx: randomBetween(-0.4, 0.4),
    vy: randomBetween(-0.4, 0.4),
    wingPhase: Math.random() * Math.PI * 2,
    wingSpeed: randomBetween(0.012, 0.022),
    size: randomBetween(2.6, 5.2),
    hue: randomBetween(38, 52),
    personality: randomBetween(-1, 1),
    resting: false,
    restUntil: 0,
    slotIndex: null,
    glow: 0,
  }
}

function seedMoths(): void {
  const count = mothCount()

  while (moths.length < count) moths.push(createMoth())
  if (moths.length > count) moths.splice(count)
}

function canvasPoint(
  clientX: number,
  clientY: number,
): { x: number; y: number } | null {
  const canvas = canvasRef.value
  if (!canvas) return null

  const rect = canvas.getBoundingClientRect()
  const x = clientX - rect.left
  const y = clientY - rect.top

  if (x < 0 || y < 0 || x > rect.width || y > rect.height) return null
  return { x, y }
}

function handlePointerMove(event: PointerEvent): void {
  const point = canvasPoint(event.clientX, event.clientY)

  if (!point) {
    pointer.active = false
    return
  }

  pointer.x = point.x
  pointer.y = point.y
  pointer.active = true
}

// A click extinguishes and relights the local pointer glow rather than steering moths
// directly -- the pointer light is always attractive while active; clicking just resets
// the glow pulse so the response is visible even while holding still.
let extinguishPulse = 0

function handlePointerDown(event: PointerEvent): void {
  const point = canvasPoint(event.clientX, event.clientY)
  if (!point) return

  extinguishPulse = performance.now()
}

function resizeCanvas(): void {
  const canvas = canvasRef.value
  if (!canvas || !context) return

  const rect = canvas.getBoundingClientRect()
  const nextWidth = Math.max(1, rect.width)
  const nextHeight = Math.max(1, rect.height)
  const scaleX = nextWidth / width
  const scaleY = nextHeight / height

  width = nextWidth
  height = nextHeight

  const pixelRatio = Math.min(window.devicePixelRatio || 1, 2)
  canvas.width = Math.round(width * pixelRatio)
  canvas.height = Math.round(height * pixelRatio)
  context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0)

  moths.forEach((moth) => {
    moth.x *= scaleX
    moth.y *= scaleY
  })

  seedMoths()
}

function scheduleNextEvent(now: number): void {
  nextEventAt = now + randomBetween(24000, 48000)
}

function beginGathering(now: number): void {
  currentSlots = pickConstellationSlots()
  const available = [...moths]
  const slotCount = Math.min(currentSlots.length, available.length)

  for (let i = 0; i < slotCount; i += 1) {
    const pickIndex = Math.min(
      available.length - 1,
      Math.floor(nextSeeded() * available.length),
    )
    const moth = available.splice(pickIndex, 1)[0]!
    moth.slotIndex = i
    moth.resting = false
  }

  phase = 'gathering'
  phaseStartedAt = now
}

function beginScattering(now: number): void {
  phase = 'scattering'
  phaseStartedAt = now
  for (const moth of moths) {
    if (moth.slotIndex !== null) {
      moth.vx += randomBetween(-0.6, 0.6)
      moth.vy += randomBetween(-0.6, 0.6)
    }
  }
}

function updatePhase(now: number): void {
  if (reducedMotion) return

  if (phase === 'wander' && now >= nextEventAt) {
    beginGathering(now)
    return
  }

  if (phase === 'gathering' && now - phaseStartedAt > 6000) {
    phase = 'aligned'
    phaseStartedAt = now
    return
  }

  if (phase === 'aligned' && now - phaseStartedAt > 4200) {
    beginScattering(now)
    return
  }

  if (phase === 'scattering' && now - phaseStartedAt > 2600) {
    for (const moth of moths) moth.slotIndex = null
    phase = 'wander'
    scheduleNextEvent(now)
  }
}

function steerWander(moth: Moth, delta: number): void {
  const wobble =
    Math.sin(performance.now() * 0.0007 + moth.personality * 10) * 0.02
  moth.vx += wobble * moth.personality * delta
  moth.vy +=
    Math.cos(performance.now() * 0.0005 + moth.personality * 7) * 0.02 * delta

  if (pointer.active && !reducedMotion) {
    const distance = Math.hypot(pointer.x - moth.x, pointer.y - moth.y)
    const pullRadius = 150
    if (distance < pullRadius && distance > 4) {
      const pull = (1 - distance / pullRadius) * 0.05 * delta
      moth.vx += ((pointer.x - moth.x) / distance) * pull
      moth.vy += ((pointer.y - moth.y) / distance) * pull
    }
  }

  const speed = Math.hypot(moth.vx, moth.vy)
  const maxSpeed = moth.resting ? 0 : 0.55
  if (speed > maxSpeed && speed > 0) {
    moth.vx = (moth.vx / speed) * maxSpeed
    moth.vy = (moth.vy / speed) * maxSpeed
  }

  if (!moth.resting && Math.random() < 0.0015) {
    moth.resting = true
    moth.restUntil = performance.now() + randomBetween(1500, 4000)
  }
  if (moth.resting && performance.now() >= moth.restUntil) {
    moth.resting = false
  }

  moth.x += moth.vx * delta
  moth.y += moth.vy * delta

  if (moth.x < -10) moth.x = width + 10
  if (moth.x > width + 10) moth.x = -10
  if (moth.y < -10) moth.y = height + 10
  if (moth.y > height + 10) moth.y = -10
}

function steerToSlot(moth: Moth, delta: number): void {
  if (moth.slotIndex === null) {
    steerWander(moth, delta)
    return
  }

  const slot = currentSlots[moth.slotIndex]
  if (!slot) return

  const dx = slot.x - moth.x
  const dy = slot.y - moth.y
  const distance = Math.hypot(dx, dy)

  if (distance > 1) {
    const pull = Math.min(1, distance / 60) * 0.4 * delta
    moth.vx += (dx / distance) * pull
    moth.vy += (dy / distance) * pull
  } else {
    moth.vx *= 0.8
    moth.vy *= 0.8
  }

  const speed = Math.hypot(moth.vx, moth.vy)
  const maxSpeed = phase === 'aligned' ? 0.15 : 0.7
  if (speed > maxSpeed && speed > 0) {
    moth.vx = (moth.vx / speed) * maxSpeed
    moth.vy = (moth.vy / speed) * maxSpeed
  }

  moth.x += moth.vx * delta
  moth.y += moth.vy * delta
}

function updateMoth(moth: Moth, delta: number): void {
  moth.wingPhase += moth.wingSpeed * delta * (moth.resting ? 0.25 : 1)

  if (phase === 'gathering' || phase === 'aligned') {
    steerToSlot(moth, delta)
  } else {
    if (moth.slotIndex !== null && phase === 'scattering') {
      moth.slotIndex = null
    }
    steerWander(moth, delta)
  }

  const targetGlow = moth.slotIndex !== null ? 1 : moth.resting ? 0.3 : 0.55
  moth.glow += (targetGlow - moth.glow) * Math.min(1, delta * 0.05)
}

function drawMoth(moth: Moth): void {
  if (!context) return

  const wingSpread = 0.35 + 0.65 * Math.abs(Math.sin(moth.wingPhase))
  const alpha = 0.5 + moth.glow * 0.4

  context.save()
  context.translate(moth.x, moth.y)
  context.rotate(Math.atan2(moth.vy, moth.vx) + Math.PI / 2)

  const glowRadius = moth.size * (2.2 + moth.glow * 2.4)
  const glow = context.createRadialGradient(0, 0, 0, 0, 0, glowRadius)
  glow.addColorStop(0, `hsla(${moth.hue}, 90%, 82%, ${alpha * 0.55})`)
  glow.addColorStop(1, `hsla(${moth.hue}, 90%, 82%, 0)`)
  context.fillStyle = glow
  context.beginPath()
  context.arc(0, 0, glowRadius, 0, Math.PI * 2)
  context.fill()

  context.fillStyle = `hsla(${moth.hue}, 70%, 88%, ${alpha})`
  context.beginPath()
  context.ellipse(
    -moth.size * wingSpread,
    0,
    moth.size,
    moth.size * 0.55,
    -0.3,
    0,
    Math.PI * 2,
  )
  context.fill()
  context.beginPath()
  context.ellipse(
    moth.size * wingSpread,
    0,
    moth.size,
    moth.size * 0.55,
    0.3,
    0,
    Math.PI * 2,
  )
  context.fill()

  context.fillStyle = `hsla(${moth.hue}, 40%, 96%, ${alpha})`
  context.beginPath()
  context.ellipse(0, 0, moth.size * 0.28, moth.size * 0.7, 0, 0, Math.PI * 2)
  context.fill()

  context.restore()
}

function drawConstellationLines(now: number): void {
  if (!context || phase !== 'aligned') return

  const progress = Math.min(1, (now - phaseStartedAt) / 800)
  context.save()
  context.strokeStyle = `hsla(44, 90%, 85%, ${0.35 * progress})`
  context.lineWidth = 1
  context.beginPath()
  for (let i = 0; i < currentSlots.length - 1; i += 1) {
    const a = currentSlots[i]
    const b = currentSlots[i + 1]
    if (!a || !b) continue
    context.moveTo(a.x, a.y)
    context.lineTo(b.x, b.y)
  }
  context.stroke()
  context.restore()
}

function drawPointerGlow(now: number): void {
  if (!context || !pointer.active || reducedMotion) return

  const pulse = extinguishPulse
    ? Math.max(0, 1 - (now - extinguishPulse) / 500)
    : 0
  const radius = 70 + pulse * 40

  context.save()
  context.globalCompositeOperation = 'lighter'
  const glow = context.createRadialGradient(
    pointer.x,
    pointer.y,
    0,
    pointer.x,
    pointer.y,
    radius,
  )
  glow.addColorStop(0, `hsla(46, 95%, 85%, ${0.12 + pulse * 0.2})`)
  glow.addColorStop(1, 'hsla(46, 95%, 85%, 0)')
  context.fillStyle = glow
  context.beginPath()
  context.arc(pointer.x, pointer.y, radius, 0, Math.PI * 2)
  context.fill()
  context.restore()
}

function renderFrame(timestamp: number): void {
  if (!context) return

  const elapsed = previousTimestamp ? timestamp - previousTimestamp : 16.67
  previousTimestamp = timestamp
  const delta = Math.min(2.2, Math.max(0.35, elapsed / 16.67))

  context.clearRect(0, 0, width, height)

  updatePhase(performance.now())
  drawPointerGlow(performance.now())

  for (const moth of moths) updateMoth(moth, delta)

  drawConstellationLines(performance.now())
  for (const moth of moths) drawMoth(moth)

  animationFrameId = window.requestAnimationFrame(renderFrame)
}

function handleMotionPreference(event: MediaQueryListEvent): void {
  reducedMotion = event.matches
  if (reducedMotion) {
    phase = 'wander'
    for (const moth of moths) moth.slotIndex = null
  }
}

onMounted(() => {
  const canvas = canvasRef.value
  if (!canvas) return

  context = canvas.getContext('2d', { alpha: true })
  if (!context) return

  motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
  reducedMotion = motionQuery.matches
  motionQuery.addEventListener('change', handleMotionPreference)

  resizeObserver = new ResizeObserver(resizeCanvas)
  resizeObserver.observe(canvas)
  resizeCanvas()

  seed = Math.floor(Math.random() * 0x7fffffff) || 1
  scheduleNextEvent(performance.now())

  window.addEventListener('pointermove', handlePointerMove, { passive: true })
  window.addEventListener('pointerdown', handlePointerDown, { passive: true })

  animationFrameId = window.requestAnimationFrame(renderFrame)
})

onBeforeUnmount(() => {
  if (animationFrameId !== null) {
    window.cancelAnimationFrame(animationFrameId)
  }

  resizeObserver?.disconnect()
  motionQuery?.removeEventListener('change', handleMotionPreference)
  window.removeEventListener('pointermove', handlePointerMove)
  window.removeEventListener('pointerdown', handlePointerDown)

  animationFrameId = null
  resizeObserver = null
  motionQuery = null
  context = null
  moths.length = 0
  currentSlots = []
  phase = 'wander'
})
</script>

<style scoped>
.moth-constellation {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  opacity: 0.92;
  transform: translateZ(0);
}

@media (prefers-reduced-motion: reduce) {
  .moth-constellation {
    opacity: 0.7;
  }
}
</style>
