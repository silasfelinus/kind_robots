<template>
  <canvas ref="canvasRef" class="lighthouse-fog-sweep" />
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'

const canvasRef = ref<HTMLCanvasElement | null>(null)

// A lighthouse on a dark headland sweeps a slow beam over drifting fog banks.
// Distant ship lights bob on the water and flare briefly as the beam crosses
// them. Beam angle is a closed-form function of the clock, so the passive loop
// needs no interaction.
const SWEEP_SECONDS = 11
const FOG_BANKS = 5
const SHIPS = 6
const BOOST_COOLDOWN_MS = 3000
const BOOST_DECAY_PER_SEC = 0.5
const TWO_PI = Math.PI * 2

type Ship = { x: number; y: number; phase: number; flare: number }

let context: CanvasRenderingContext2D | null = null
let resizeObserver: ResizeObserver | null = null
let motionQuery: MediaQueryList | null = null
let animationFrameId: number | null = null
let lastFrameTs = 0
let clock = 0
let width = 1
let height = 1
let reducedMotion = false
let boost = 0
let lastBoostTs = 0
let pointerX = -1
let pointerY = -1
let ships: Ship[] = []

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
  if (now - lastBoostTs < BOOST_COOLDOWN_MS) return
  lastBoostTs = now
  boost = 1
}

function seedShips(): void {
  ships = Array.from({ length: SHIPS }, (_, i) => ({
    x: 0.08 + ((i * 0.37 + 0.11) % 0.84),
    y: 0.62 + ((i * 0.29) % 0.3),
    phase: i * 1.7,
    flare: 0,
  }))
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

// Beam direction in radians, swinging across the sea (0 = straight left).
function beamAngle(seconds: number): number {
  const speed = boost > 0.5 ? 1.8 : 1
  return (
    Math.PI *
    (0.05 +
      0.9 * (0.5 - 0.5 * Math.cos((TWO_PI * seconds * speed) / SWEEP_SECONDS)))
  )
}

function drawFog(seconds: number): void {
  if (!context) return
  for (let i = 0; i < FOG_BANKS; i += 1) {
    const drift = ((seconds * (6 + i * 2.5) + i * 190) % (width + 400)) - 200
    const y = height * (0.45 + i * 0.1) + Math.sin(seconds * 0.2 + i) * 8
    const g = context.createRadialGradient(drift, y, 10, drift, y, width * 0.3)
    g.addColorStop(0, 'rgba(170, 190, 210, 0.22)')
    g.addColorStop(1, 'rgba(170, 190, 210, 0)')
    context.fillStyle = g
    context.fillRect(0, y - width * 0.3, width, width * 0.6)
  }
}

function drawScene(seconds: number): void {
  if (!context) return
  const sky = context.createLinearGradient(0, 0, 0, height)
  sky.addColorStop(0, '#05080f')
  sky.addColorStop(0.6, '#0d1a2b')
  sky.addColorStop(1, '#101f33')
  context.fillStyle = sky
  context.fillRect(0, 0, width, height)

  const lampX = width * 0.12
  const lampY = height * 0.38
  const angle = beamAngle(seconds)
  const dirX = Math.cos(angle)
  const dirY = Math.sin(angle) * 0.35
  const reach = width * 1.1

  // Beam cone, drawn as a gradient from the lamp.
  const beam = context.createRadialGradient(
    lampX,
    lampY,
    4,
    lampX,
    lampY,
    reach,
  )
  beam.addColorStop(0, 'rgba(255, 244, 200, 0.55)')
  beam.addColorStop(1, 'rgba(255, 244, 200, 0)')
  context.fillStyle = beam
  context.beginPath()
  context.moveTo(lampX, lampY)
  const spread = 0.07
  for (const s of [-spread, spread]) {
    context.lineTo(
      lampX + (dirX * Math.cos(s) - dirY * Math.sin(s)) * reach,
      lampY + (dirY * Math.cos(s) + dirX * Math.sin(s)) * reach,
    )
  }
  context.closePath()
  context.fill()

  drawFog(seconds)

  // Headland and tower.
  context.fillStyle = '#04070c'
  context.beginPath()
  context.moveTo(0, height)
  context.lineTo(0, height * 0.55)
  context.lineTo(lampX + 30, height * 0.55)
  context.lineTo(lampX + 90, height * 0.7)
  context.lineTo(lampX + 160, height)
  context.closePath()
  context.fill()
  context.fillRect(lampX - 8, lampY, 16, height * 0.17)
  context.fillStyle = '#fff4c8'
  context.beginPath()
  context.arc(lampX, lampY, 7, 0, TWO_PI)
  context.fill()

  // Ships: flare when the beam passes over them.
  const beamBearing = Math.atan2(dirY, dirX)
  for (const ship of ships) {
    const sx = width * ship.x
    const sy = height * ship.y + Math.sin(seconds * 0.9 + ship.phase) * 3
    const bearing = Math.atan2(sy - lampY, sx - lampX)
    const hit = Math.max(0, 1 - Math.abs(bearing - beamBearing) / 0.12)
    ship.flare = Math.max(ship.flare * 0.96, hit)
    let glow = 0.25 + ship.flare * 0.75
    if (pointerX >= 0) {
      glow = Math.max(
        glow,
        1 - Math.hypot(sx - pointerX, sy - pointerY) / (height * 0.2),
      )
    }
    const r = 3 + glow * 9
    const g = context.createRadialGradient(sx, sy, 0, sx, sy, r * 3)
    g.addColorStop(0, `rgba(255, 220, 150, ${0.3 + glow * 0.6})`)
    g.addColorStop(1, 'rgba(255, 220, 150, 0)')
    context.fillStyle = g
    context.fillRect(sx - r * 3, sy - r * 3, r * 6, r * 6)
    context.fillStyle = '#ffe9b8'
    context.fillRect(sx - 3, sy - 1.5, 6, 3)
  }
}

function renderFrame(timestamp: number): void {
  if (!context) return
  const dt = lastFrameTs ? Math.min(0.1, (timestamp - lastFrameTs) / 1000) : 0
  lastFrameTs = timestamp
  boost = Math.max(0, boost - BOOST_DECAY_PER_SEC * dt)
  clock += dt
  drawScene(clock)
  animationFrameId = window.requestAnimationFrame(renderFrame)
}

function handleMotionChange(event: MediaQueryListEvent): void {
  reducedMotion = event.matches
  boost = 0
  pointerX = -1
  pointerY = -1
  if (reducedMotion) drawScene(SWEEP_SECONDS * 0.2)
}

onMounted(() => {
  const canvas = canvasRef.value
  if (!canvas) return
  context = canvas.getContext('2d')
  if (!context) return

  seedShips()
  motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
  reducedMotion = motionQuery.matches
  motionQuery.addEventListener('change', handleMotionChange)

  resizeObserver = new ResizeObserver(() => {
    resizeCanvas()
    if (reducedMotion) drawScene(SWEEP_SECONDS * 0.2)
  })
  resizeObserver.observe(canvas)
  window.addEventListener('pointermove', handlePointerMove, { passive: true })
  window.addEventListener('pointerdown', handlePointerDown, { passive: true })
  resizeCanvas()
  if (reducedMotion) drawScene(SWEEP_SECONDS * 0.2)
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
.lighthouse-fog-sweep {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}
</style>
