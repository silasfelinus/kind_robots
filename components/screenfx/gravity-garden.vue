<!-- /components/screenfx/gravity-garden.vue -->
<template>
  <canvas ref="canvasRef" class="gravity-garden" />
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'

interface Seed {
  x: number
  y: number
  vx: number
  vy: number
  radius: number
  hue: number
  phase: number
  orbit: number
}

interface Pulse {
  x: number
  y: number
  radius: number
  alpha: number
}

const canvasRef = ref<HTMLCanvasElement | null>(null)

let context: CanvasRenderingContext2D | null = null
let animationFrameId: number | null = null
let resizeObserver: ResizeObserver | null = null
let motionQuery: MediaQueryList | null = null
let width = 1
let height = 1
let previousTimestamp = 0
let reducedMotion = false

const seeds: Seed[] = []
const pulses: Pulse[] = []

function randomBetween(min: number, max: number): number {
  return min + Math.random() * (max - min)
}

function seedCount(): number {
  if (reducedMotion) return 18
  return Math.round(Math.min(72, Math.max(30, (width * height) / 26000)))
}

function createSeed(): Seed {
  return {
    x: Math.random() * width,
    y: Math.random() * height,
    vx: randomBetween(-0.18, 0.18),
    vy: randomBetween(-0.18, 0.18),
    radius: randomBetween(1.4, 4.8),
    hue: randomBetween(92, 178),
    phase: Math.random() * Math.PI * 2,
    orbit: randomBetween(0.7, 1.4),
  }
}

function syncSeeds(): void {
  const count = seedCount()
  while (seeds.length < count) seeds.push(createSeed())
  if (seeds.length > count) seeds.splice(count)
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

  seeds.forEach((seed) => {
    seed.x *= scaleX
    seed.y *= scaleY
  })

  syncSeeds()
}

function addPulse(clientX: number, clientY: number): void {
  const canvas = canvasRef.value
  if (!canvas) return

  const rect = canvas.getBoundingClientRect()
  const x = clientX - rect.left
  const y = clientY - rect.top
  if (x < 0 || y < 0 || x > rect.width || y > rect.height) return

  pulses.push({ x, y, radius: 8, alpha: 0.52 })
  if (pulses.length > 6) pulses.shift()

  seeds.forEach((seed) => {
    const dx = seed.x - x
    const dy = seed.y - y
    const distance = Math.max(28, Math.hypot(dx, dy))
    const force = Math.min(1.8, 140 / distance)
    seed.vx += (dx / distance) * force
    seed.vy += (dy / distance) * force
  })
}

function drawVines(timestamp: number): void {
  if (!context) return

  context.save()
  context.globalCompositeOperation = 'lighter'
  context.lineCap = 'round'

  const vineCount = reducedMotion ? 3 : 6
  for (let vine = 0; vine < vineCount; vine += 1) {
    const baseline = height * (0.14 + vine * 0.15)
    context.beginPath()

    for (let x = -30; x <= width + 30; x += 24) {
      const y =
        baseline +
        Math.sin(x * 0.009 + timestamp * 0.00016 + vine) * (9 + vine * 2) +
        Math.cos(x * 0.003 - timestamp * 0.00011) * 7

      if (x === -30) context.moveTo(x, y)
      else context.lineTo(x, y)
    }

    context.strokeStyle = `hsla(${116 + vine * 8}, 82%, 58%, ${0.025 + vine * 0.004})`
    context.lineWidth = 10 + vine * 3
    context.stroke()
  }

  context.restore()
}

function drawSeed(seed: Seed, timestamp: number, delta: number): void {
  if (!context) return

  const centerX = width * 0.5
  const centerY = height * 0.52
  const dx = centerX - seed.x
  const dy = centerY - seed.y
  const distance = Math.max(50, Math.hypot(dx, dy))
  const gravity = 0.00032 * seed.orbit
  const swirl = Math.sin(timestamp * 0.00021 + seed.phase) * 0.0009

  seed.vx += (dx / distance) * gravity * delta + (-dy / distance) * swirl * delta
  seed.vy += (dy / distance) * gravity * delta + (dx / distance) * swirl * delta
  seed.vx *= 0.997
  seed.vy *= 0.997
  seed.x += seed.vx * delta
  seed.y += seed.vy * delta

  const margin = 30
  if (seed.x < -margin) seed.x = width + margin
  if (seed.x > width + margin) seed.x = -margin
  if (seed.y < -margin) seed.y = height + margin
  if (seed.y > height + margin) seed.y = -margin

  const pulse = 1 + Math.sin(timestamp * 0.0014 + seed.phase) * 0.22
  const radius = seed.radius * pulse

  context.save()
  context.globalCompositeOperation = 'lighter'

  const glow = context.createRadialGradient(seed.x, seed.y, 0, seed.x, seed.y, radius * 5)
  glow.addColorStop(0, `hsla(${seed.hue}, 100%, 84%, 0.62)`)
  glow.addColorStop(0.24, `hsla(${seed.hue + 18}, 92%, 62%, 0.22)`)
  glow.addColorStop(1, `hsla(${seed.hue + 30}, 88%, 50%, 0)`)

  context.fillStyle = glow
  context.beginPath()
  context.arc(seed.x, seed.y, radius * 5, 0, Math.PI * 2)
  context.fill()

  context.fillStyle = `hsla(${seed.hue}, 100%, 88%, 0.84)`
  context.beginPath()
  context.ellipse(seed.x, seed.y, radius * 0.72, radius, seed.phase, 0, Math.PI * 2)
  context.fill()

  context.restore()
}

function drawPulses(delta: number): void {
  if (!context) return

  context.save()
  context.globalCompositeOperation = 'lighter'

  for (let index = pulses.length - 1; index >= 0; index -= 1) {
    const pulse = pulses[index]
    if (!pulse) continue

    pulse.radius += 1.6 * delta
    pulse.alpha *= Math.pow(0.972, delta)

    context.beginPath()
    context.arc(pulse.x, pulse.y, pulse.radius, 0, Math.PI * 2)
    context.strokeStyle = `hsla(132, 100%, 76%, ${pulse.alpha})`
    context.lineWidth = Math.max(0.6, 2.8 - pulse.radius * 0.01)
    context.stroke()

    if (pulse.alpha < 0.01 || pulse.radius > Math.max(width, height) * 0.7) {
      pulses.splice(index, 1)
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
  drawVines(timestamp)
  seeds.forEach((seed) => drawSeed(seed, timestamp, delta))
  drawPulses(delta)

  animationFrameId = window.requestAnimationFrame(renderFrame)
}

function handleMotionPreference(event: MediaQueryListEvent): void {
  reducedMotion = event.matches
  syncSeeds()
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

  window.addEventListener('pointerdown', (event) => addPulse(event.clientX, event.clientY), {
    passive: true,
  })

  animationFrameId = window.requestAnimationFrame(renderFrame)
})

onBeforeUnmount(() => {
  if (animationFrameId !== null) window.cancelAnimationFrame(animationFrameId)
  resizeObserver?.disconnect()
  motionQuery?.removeEventListener('change', handleMotionPreference)
})
</script>

<style scoped>
.gravity-garden {
  display: block;
  width: 100%;
  height: 100%;
  pointer-events: none;
}
</style>
