<template>
  <canvas ref="canvasRef" class="lighthouse-fog-beam" />
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'

const canvasRef = ref<HTMLCanvasElement | null>(null)

const TWO_PI = Math.PI * 2
const SWEEP_MS = 12000
const BEAM_HALF_WIDTH = 0.16
const CLICK_COOLDOWN_MS = 1500
const CLICK_BOOST_RADIANS = Math.PI * 0.9
const BOOST_DECAY_PER_SEC = 1.8
const POINTER_RADIUS = 150
const PART_PUSH = 90
const PART_EASE_PER_SEC = 3
const REDUCED_BEAM_ANGLE = -0.35
const FOG_COUNT = 26
const SHIP_COUNT = 3

interface FogPuff {
  x: number
  y: number
  radius: number
  drift: number
  phase: number
  push: number
  pushY: number
}

interface Ship {
  x: number
  y: number
  size: number
  speed: number
  phase: number
}

// Puffs and ships are laid out once in normalised (0..1) sea coordinates.
const fog: FogPuff[] = Array.from({ length: FOG_COUNT }, (_, i) => ({
  x: ((i * 0.618034) % 1) * 1.2 - 0.1,
  y: 0.38 + ((i * 0.37) % 1) * 0.5,
  radius: 0.07 + ((i * 0.23) % 1) * 0.08,
  drift: 0.004 + ((i * 0.13) % 1) * 0.006,
  phase: i * 1.7,
  push: 0,
  pushY: 0,
}))

const ships: Ship[] = Array.from({ length: SHIP_COUNT }, (_, i) => ({
  x: 0.2 + i * 0.3,
  y: 0.62 + i * 0.1,
  size: 0.018 + i * 0.006,
  speed: (i % 2 === 0 ? 1 : -1) * (0.006 + i * 0.002),
  phase: i * 2.1,
}))

let context: CanvasRenderingContext2D | null = null
let resizeObserver: ResizeObserver | null = null
let motionQuery: MediaQueryList | null = null
let animationFrameId: number | null = null
let width = 1
let height = 1
let previousTimestamp = 0
let clock = 0
let beamAngle = REDUCED_BEAM_ANGLE
let boost = 0
let reducedMotion = false
let lastClickTs = 0
let pointerActive = false
let pointerX = 0
let pointerY = 0

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
  boost += CLICK_BOOST_RADIANS
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

function fogPosition(puff: FogPuff): { x: number; y: number } {
  const sway = Math.sin(clock * 0.2 + puff.phase) * 0.02
  const span = 1.3
  const wrapped = (((puff.x + 0.15 + clock * puff.drift) % span) + span) % span
  return {
    x: (wrapped - 0.15 + sway) * width + puff.push,
    y: puff.y * height + puff.pushY,
  }
}

function stepFog(dt: number): void {
  const ease = Math.min(1, PART_EASE_PER_SEC * dt)
  for (const puff of fog) {
    let targetX = 0
    let targetY = 0
    if (pointerActive) {
      const home = fogPosition({ ...puff, push: 0, pushY: 0 })
      const dx = home.x - pointerX
      const dy = home.y - pointerY
      const dist = Math.hypot(dx, dy)
      if (dist < POINTER_RADIUS && dist > 0.001) {
        const strength = 1 - dist / POINTER_RADIUS
        targetX = (dx / dist) * PART_PUSH * strength
        targetY = (dy / dist) * PART_PUSH * strength
      }
    }
    puff.push += (targetX - puff.push) * ease
    puff.pushY += (targetY - puff.pushY) * ease
  }
}

function angleDifference(a: number, b: number): number {
  return Math.abs(Math.atan2(Math.sin(a - b), Math.cos(a - b)))
}

function drawFrame(): void {
  if (!context) return
  const horizon = height * 0.34
  const lampX = width * 0.5
  const lampY = height * 0.2

  const sky = context.createLinearGradient(0, 0, 0, horizon)
  sky.addColorStop(0, '#050a1c')
  sky.addColorStop(1, '#16264a')
  context.fillStyle = sky
  context.fillRect(0, 0, width, horizon)
  const sea = context.createLinearGradient(0, horizon, 0, height)
  sea.addColorStop(0, '#12254a')
  sea.addColorStop(1, '#050d1f')
  context.fillStyle = sea
  context.fillRect(0, horizon, width, height - horizon)

  // Wave lines: a few sine strokes that slide slowly.
  context.strokeStyle = 'rgba(120, 160, 220, 0.14)'
  context.lineWidth = 1
  for (let row = 0; row < 7; row += 1) {
    const y = horizon + ((row + 1) / 8) * (height - horizon)
    context.beginPath()
    for (let x = 0; x <= width; x += 12) {
      const wave = Math.sin(x * 0.018 + clock * 0.8 + row * 1.3) * (2 + row)
      if (x === 0) context.moveTo(x, y + wave)
      else context.lineTo(x, y + wave)
    }
    context.stroke()
  }

  // Beam: a wedge from the lamp, additive so it brightens what it crosses.
  const reach = Math.hypot(width, height)
  context.save()
  context.globalCompositeOperation = 'lighter'
  const beamGradient = context.createRadialGradient(
    lampX,
    lampY,
    0,
    lampX,
    lampY,
    reach * 0.8,
  )
  beamGradient.addColorStop(0, 'rgba(255, 244, 200, 0.55)')
  beamGradient.addColorStop(1, 'rgba(255, 244, 200, 0)')
  context.fillStyle = beamGradient
  context.beginPath()
  context.moveTo(lampX, lampY)
  context.arc(
    lampX,
    lampY,
    reach,
    beamAngle - BEAM_HALF_WIDTH,
    beamAngle + BEAM_HALF_WIDTH,
  )
  context.closePath()
  context.fill()
  context.restore()

  // Fog puffs glow where the beam passes through them.
  for (const puff of fog) {
    const pos = fogPosition(puff)
    const radius = puff.radius * width
    const toward = Math.atan2(pos.y - lampY, pos.x - lampX)
    const spread = angleDifference(toward, beamAngle)
    const lit = Math.max(0, 1 - spread / (BEAM_HALF_WIDTH * 2.2))
    const alpha = 0.1 + 0.4 * lit
    const tone = Math.round(150 + 90 * lit)
    const fogGradient = context.createRadialGradient(
      pos.x,
      pos.y,
      0,
      pos.x,
      pos.y,
      radius,
    )
    fogGradient.addColorStop(
      0,
      `rgba(${tone}, ${tone + 8}, ${tone + 20}, ${alpha})`,
    )
    fogGradient.addColorStop(1, `rgba(${tone}, ${tone + 8}, ${tone + 20}, 0)`)
    context.fillStyle = fogGradient
    context.beginPath()
    context.arc(pos.x, pos.y, radius, 0, TWO_PI)
    context.fill()
  }

  // Ships bob along the sea; their hulls flash when the beam finds them.
  for (const ship of ships) {
    const span = 1.2
    const wrapped = (((ship.x + 0.1 + clock * ship.speed) % span) + span) % span
    const x = (wrapped - 0.1) * width
    const y = ship.y * height + Math.sin(clock * 1.1 + ship.phase) * 3
    const size = ship.size * width
    const spread = angleDifference(Math.atan2(y - lampY, x - lampX), beamAngle)
    const lit = Math.max(0, 1 - spread / (BEAM_HALF_WIDTH * 1.4))
    context.fillStyle = `rgb(${Math.round(40 + 190 * lit)}, ${Math.round(48 + 170 * lit)}, ${Math.round(70 + 110 * lit)})`
    context.beginPath()
    context.moveTo(x - size, y)
    context.lineTo(x + size, y)
    context.lineTo(x + size * 0.7, y + size * 0.5)
    context.lineTo(x - size * 0.7, y + size * 0.5)
    context.closePath()
    context.fill()
    context.fillRect(x - 1, y - size * 1.2, 2, size * 1.2)
  }

  // Lighthouse tower and lamp.
  const towerWidth = Math.max(14, width * 0.022)
  const baseY = horizon + (height - horizon) * 0.12
  context.fillStyle = '#d9d4c7'
  context.beginPath()
  context.moveTo(lampX - towerWidth / 2, lampY + 6)
  context.lineTo(lampX + towerWidth / 2, lampY + 6)
  context.lineTo(lampX + towerWidth, baseY)
  context.lineTo(lampX - towerWidth, baseY)
  context.closePath()
  context.fill()
  context.fillStyle = '#b3402f'
  context.fillRect(
    lampX - towerWidth * 0.75,
    lampY + (baseY - lampY) * 0.4,
    towerWidth * 1.5,
    (baseY - lampY) * 0.15,
  )
  context.fillStyle = '#fff3c4'
  context.beginPath()
  context.arc(lampX, lampY, Math.max(5, towerWidth * 0.4), 0, TWO_PI)
  context.fill()
}

function renderFrame(timestamp: number): void {
  if (!context) return
  const elapsed = previousTimestamp ? timestamp - previousTimestamp : 16.67
  previousTimestamp = timestamp
  const delta = Math.min(50, Math.max(4, elapsed))

  if (!reducedMotion) {
    const dt = delta / 1000
    clock += dt
    const burst = boost * Math.min(1, BOOST_DECAY_PER_SEC * dt)
    boost -= burst
    beamAngle = (beamAngle + (delta / SWEEP_MS) * TWO_PI + burst) % TWO_PI
    stepFog(dt)
  }
  drawFrame()
  animationFrameId = window.requestAnimationFrame(renderFrame)
}

function handleMotionChange(event: MediaQueryListEvent): void {
  reducedMotion = event.matches
  if (reducedMotion) {
    beamAngle = REDUCED_BEAM_ANGLE
    boost = 0
    for (const puff of fog) {
      puff.push = 0
      puff.pushY = 0
    }
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
.lighthouse-fog-beam {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}
</style>
