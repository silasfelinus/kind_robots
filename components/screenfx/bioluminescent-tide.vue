<!-- /components/screenfx/bioluminescent-tide.vue -->
<template>
  <canvas ref="canvasRef" class="bioluminescent-tide" />
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'

interface Lantern {
  x: number
  y: number
  vx: number
  vy: number
  radius: number
  hue: number
  phase: number
  depth: number
}

interface Ripple {
  x: number
  y: number
  radius: number
  alpha: number
  speed: number
  hue: number
}

interface PointerState {
  x: number
  y: number
  active: boolean
  lastWakeAt: number
}

const canvasRef = ref<HTMLCanvasElement | null>(null)

let animationFrameId: number | null = null
let resizeObserver: ResizeObserver | null = null
let motionQuery: MediaQueryList | null = null
let context: CanvasRenderingContext2D | null = null
let width = 1
let height = 1
let previousTimestamp = 0
let reducedMotion = false

const lanterns: Lantern[] = []
const ripples: Ripple[] = []
const pointer: PointerState = {
  x: 0,
  y: 0,
  active: false,
  lastWakeAt: 0,
}

function randomBetween(min: number, max: number): number {
  return min + Math.random() * (max - min)
}

function lanternCount(): number {
  if (reducedMotion) return 12
  return Math.round(Math.min(44, Math.max(20, (width * height) / 42000)))
}

function createLantern(): Lantern {
  const depth = randomBetween(0.45, 1)

  return {
    x: Math.random() * width,
    y: Math.random() * height,
    vx: randomBetween(-0.08, 0.08) * depth,
    vy: randomBetween(-0.12, -0.025) * depth,
    radius: randomBetween(5, 12) * depth,
    hue: randomBetween(162, 204),
    phase: Math.random() * Math.PI * 2,
    depth,
  }
}

function seedLanterns(): void {
  const count = lanternCount()

  while (lanterns.length < count) lanterns.push(createLantern())
  if (lanterns.length > count) lanterns.splice(count)
}

function canvasPoint(clientX: number, clientY: number): { x: number; y: number } | null {
  const canvas = canvasRef.value
  if (!canvas) return null

  const rect = canvas.getBoundingClientRect()
  const x = clientX - rect.left
  const y = clientY - rect.top

  if (x < 0 || y < 0 || x > rect.width || y > rect.height) return null
  return { x, y }
}

function addRipple(
  x: number,
  y: number,
  strength = 1,
  hue = randomBetween(168, 206),
): void {
  ripples.push({
    x,
    y,
    radius: 3,
    alpha: 0.34 * strength,
    speed: 0.72 + strength * 0.46,
    hue,
  })

  if (ripples.length > 10) ripples.shift()
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

  const now = performance.now()
  if (!reducedMotion && now - pointer.lastWakeAt > 115) {
    addRipple(point.x, point.y, 0.42, 182)
    pointer.lastWakeAt = now
  }
}

function handlePointerDown(event: PointerEvent): void {
  const point = canvasPoint(event.clientX, event.clientY)
  if (!point) return

  addRipple(point.x, point.y, 1.25)
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

  lanterns.forEach((lantern) => {
    lantern.x *= scaleX
    lantern.y *= scaleY
  })

  seedLanterns()
}

function drawTideBands(timestamp: number): void {
  if (!context) return

  context.save()
  context.globalCompositeOperation = 'lighter'
  context.lineCap = 'round'

  const bandCount = reducedMotion ? 2 : 4

  for (let band = 0; band < bandCount; band += 1) {
    const baseline = height * (0.18 + band * 0.21)
    const amplitude = 9 + band * 4
    const speed = timestamp * (0.00012 + band * 0.000025)

    context.beginPath()

    for (let x = -40; x <= width + 40; x += 28) {
      const y =
        baseline +
        Math.sin(x * 0.009 + speed + band * 1.7) * amplitude +
        Math.cos(x * 0.0035 - speed * 0.72) * 6

      if (x === -40) context.moveTo(x, y)
      else context.lineTo(x, y)
    }

    context.strokeStyle = `hsla(${176 + band * 8}, 92%, 68%, ${
      0.035 + band * 0.008
    })`
    context.lineWidth = 12 + band * 5
    context.stroke()
  }

  context.restore()
}

function updateLantern(lantern: Lantern, delta: number, timestamp: number): void {
  const driftScale = reducedMotion ? 0.22 : 1
  const pulse = Math.sin(timestamp * 0.0012 + lantern.phase)

  lantern.vx += Math.sin(timestamp * 0.00022 + lantern.phase) * 0.0008 * delta
  lantern.vy += Math.cos(timestamp * 0.00018 + lantern.phase) * 0.00035 * delta

  if (pointer.active) {
    const dx = pointer.x - lantern.x
    const dy = pointer.y - lantern.y
    const distance = Math.hypot(dx, dy)

    if (distance > 0 && distance < 220) {
      const influence = (1 - distance / 220) * 0.0045 * lantern.depth
      lantern.vx += (-dy / distance) * influence * delta
      lantern.vy += (dx / distance) * influence * delta
      lantern.vx += (dx / distance) * influence * 0.28 * delta
      lantern.vy += (dy / distance) * influence * 0.28 * delta
    }
  }

  lantern.vx *= 0.997
  lantern.vy *= 0.998
  lantern.x += lantern.vx * delta * driftScale
  lantern.y += lantern.vy * delta * driftScale

  const margin = lantern.radius * 5

  if (lantern.x < -margin) lantern.x = width + margin
  if (lantern.x > width + margin) lantern.x = -margin
  if (lantern.y < -margin) lantern.y = height + margin
  if (lantern.y > height + margin) lantern.y = -margin

  drawLantern(lantern, pulse)
}

function drawLantern(lantern: Lantern, pulse: number): void {
  if (!context) return

  const radius = lantern.radius * (1 + pulse * 0.12)
  const glowRadius = radius * 4.2
  const alpha = 0.24 + lantern.depth * 0.28

  context.save()
  context.globalCompositeOperation = 'lighter'

  const glow = context.createRadialGradient(
    lantern.x,
    lantern.y,
    0,
    lantern.x,
    lantern.y,
    glowRadius,
  )
  glow.addColorStop(0, `hsla(${lantern.hue}, 100%, 78%, ${alpha})`)
  glow.addColorStop(0.28, `hsla(${lantern.hue + 12}, 95%, 62%, ${alpha * 0.44})`)
  glow.addColorStop(1, `hsla(${lantern.hue + 24}, 90%, 52%, 0)`)

  context.fillStyle = glow
  context.beginPath()
  context.arc(lantern.x, lantern.y, glowRadius, 0, Math.PI * 2)
  context.fill()

  context.fillStyle = `hsla(${lantern.hue}, 100%, 86%, ${0.42 + lantern.depth * 0.35})`
  context.beginPath()
  context.ellipse(
    lantern.x,
    lantern.y,
    radius * 0.9,
    radius * 0.62,
    Math.sin(lantern.phase) * 0.18,
    0,
    Math.PI * 2,
  )
  context.fill()

  context.lineCap = 'round'
  context.lineWidth = Math.max(0.55, lantern.depth)

  for (let tendril = -1; tendril <= 1; tendril += 1) {
    const startX = lantern.x + tendril * radius * 0.32
    const startY = lantern.y + radius * 0.45
    const sway = Math.sin(lantern.phase + tendril + performance.now() * 0.0011)

    context.beginPath()
    context.moveTo(startX, startY)
    context.quadraticCurveTo(
      startX + sway * radius * 0.9,
      startY + radius * 1.35,
      startX - sway * radius * 0.45,
      startY + radius * 2.25,
    )
    context.strokeStyle = `hsla(${lantern.hue + 18}, 96%, 72%, ${
      0.12 + lantern.depth * 0.22
    })`
    context.stroke()
  }

  context.restore()
}

function drawRipples(delta: number): void {
  if (!context) return

  context.save()
  context.globalCompositeOperation = 'lighter'

  for (let index = ripples.length - 1; index >= 0; index -= 1) {
    const ripple = ripples[index]
    if (!ripple) continue

    ripple.radius += ripple.speed * delta
    ripple.alpha *= Math.pow(0.986, delta)

    context.beginPath()
    context.arc(ripple.x, ripple.y, ripple.radius, 0, Math.PI * 2)
    context.strokeStyle = `hsla(${ripple.hue}, 100%, 76%, ${ripple.alpha})`
    context.lineWidth = Math.max(0.7, 2.4 - ripple.radius * 0.008)
    context.stroke()

    if (ripple.alpha < 0.012 || ripple.radius > Math.max(width, height) * 0.7) {
      ripples.splice(index, 1)
    }
  }

  context.restore()
}

function renderFrame(timestamp: number): void {
  if (!context) return

  const elapsed = previousTimestamp ? timestamp - previousTimestamp : 16.67
  previousTimestamp = timestamp
  const delta = Math.min(2.2, Math.max(0.35, elapsed / 16.67))

  context.clearRect(0, 0, width, height)
  drawTideBands(timestamp)
  lanterns.forEach((lantern) => updateLantern(lantern, delta, timestamp))
  drawRipples(delta)

  animationFrameId = window.requestAnimationFrame(renderFrame)
}

function handleMotionPreference(event: MediaQueryListEvent): void {
  reducedMotion = event.matches
  seedLanterns()
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
})
</script>

<style scoped>
.bioluminescent-tide {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  opacity: 0.92;
  transform: translateZ(0);
}

@media (prefers-reduced-motion: reduce) {
  .bioluminescent-tide {
    opacity: 0.62;
  }
}
</style>
