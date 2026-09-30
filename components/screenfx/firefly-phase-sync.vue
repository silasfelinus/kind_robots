<template>
  <canvas ref="canvasRef" class="firefly-phase-sync" />
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'

const canvasRef = ref<HTMLCanvasElement | null>(null)

const FIREFLY_COUNT = 90
const NEIGHBOR_COUNT = 6
const BASE_HZ = 0.7
const FREQ_SPREAD = 0.05
const COUPLING_BASE = 5
// Coupling creeps up the longer a run has not synced, so no run stalls.
const COUPLING_RAMP_PER_SEC = 0.025
const SYNC_THRESHOLD = 0.92
const SYNC_HOLD_MS = 7000
const MAX_RUN_MS = 180000
const POINTER_RADIUS = 150
const POINTER_COUPLING_BOOST = 3
const CLICK_COOLDOWN_MS = 1500
const BACKGROUND_TOP = '#050a10'
const BACKGROUND_BOTTOM = '#0b1a14'
const TWO_PI = Math.PI * 2
const SPRITE_SIZE = 64

// Normalised (0..1) meadow positions; fixed for the life of the component.
const posX: number[] = new Array(FIREFLY_COUNT).fill(0)
const posY: number[] = new Array(FIREFLY_COUNT).fill(0)
const phase: number[] = new Array(FIREFLY_COUNT).fill(0)
const naturalFreq: number[] = new Array(FIREFLY_COUNT).fill(0)
const nextPhase: number[] = new Array(FIREFLY_COUNT).fill(0)
// Flattened neighbor table, computed once: neighbors[i * NEIGHBOR_COUNT + k].
const neighbors: number[] = new Array(FIREFLY_COUNT * NEIGHBOR_COUNT).fill(0)

let context: CanvasRenderingContext2D | null = null
let glowSprite: HTMLCanvasElement | null = null
let resizeObserver: ResizeObserver | null = null
let motionQuery: MediaQueryList | null = null
let animationFrameId: number | null = null
let width = 1
let height = 1
let previousTimestamp = 0
let runMs = 0
let syncedMs = 0
let reducedMotion = false
let lastClickTs = 0
let pointerActive = false
let pointerX = 0
let pointerY = 0

function reseed(resetPhases: boolean): void {
  for (let i = 0; i < FIREFLY_COUNT; i += 1) {
    naturalFreq[i] =
      TWO_PI * BASE_HZ * (1 + (Math.random() * 2 - 1) * FREQ_SPREAD)
    if (resetPhases) phase[i] = Math.random() * TWO_PI
  }
  runMs = 0
  syncedMs = 0
}

function buildField(): void {
  for (let i = 0; i < FIREFLY_COUNT; i += 1) {
    posX[i] = 0.04 + Math.random() * 0.92
    posY[i] = 0.12 + Math.random() * 0.84
  }
  for (let i = 0; i < FIREFLY_COUNT; i += 1) {
    const distances: { index: number; dist: number }[] = []
    for (let j = 0; j < FIREFLY_COUNT; j += 1) {
      if (j === i) continue
      distances.push({
        index: j,
        dist: Math.hypot(
          ((posX[i] ?? 0) - (posX[j] ?? 0)) * 1.6,
          (posY[i] ?? 0) - (posY[j] ?? 0),
        ),
      })
    }
    distances.sort((a, b) => a.dist - b.dist)
    for (let k = 0; k < NEIGHBOR_COUNT; k += 1) {
      neighbors[i * NEIGHBOR_COUNT + k] = distances[k]?.index ?? 0
    }
  }
  reseed(true)
}

function buildSprite(): void {
  const sprite = document.createElement('canvas')
  sprite.width = SPRITE_SIZE
  sprite.height = SPRITE_SIZE
  const spriteContext = sprite.getContext('2d')
  if (!spriteContext) return
  const half = SPRITE_SIZE / 2
  const gradient = spriteContext.createRadialGradient(
    half,
    half,
    0,
    half,
    half,
    half,
  )
  gradient.addColorStop(0, 'rgba(255, 250, 200, 1)')
  gradient.addColorStop(0.25, 'rgba(210, 255, 120, 0.55)')
  gradient.addColorStop(1, 'rgba(160, 255, 90, 0)')
  spriteContext.fillStyle = gradient
  spriteContext.fillRect(0, 0, SPRITE_SIZE, SPRITE_SIZE)
  glowSprite = sprite
}

function orderParameter(): number {
  let cosSum = 0
  let sinSum = 0
  for (let i = 0; i < FIREFLY_COUNT; i += 1) {
    cosSum += Math.cos(phase[i] ?? 0)
    sinSum += Math.sin(phase[i] ?? 0)
  }
  return Math.hypot(cosSum, sinSum) / FIREFLY_COUNT
}

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
  reseed(true)
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

function stepPhases(dt: number): void {
  const coupling = COUPLING_BASE + (runMs / 1000) * COUPLING_RAMP_PER_SEC
  for (let i = 0; i < FIREFLY_COUNT; i += 1) {
    const own = phase[i] ?? 0
    let pull = 0
    for (let k = 0; k < NEIGHBOR_COUNT; k += 1) {
      pull += Math.sin(
        (phase[neighbors[i * NEIGHBOR_COUNT + k] ?? 0] ?? 0) - own,
      )
    }
    let gain = coupling
    if (pointerActive) {
      const dist = Math.hypot(
        (posX[i] ?? 0) * width - pointerX,
        (posY[i] ?? 0) * height - pointerY,
      )
      if (dist < POINTER_RADIUS) {
        gain += POINTER_COUPLING_BOOST * (1 - dist / POINTER_RADIUS)
      }
    }
    nextPhase[i] =
      (own + ((naturalFreq[i] ?? 0) + (gain * pull) / NEIGHBOR_COUNT) * dt) %
      TWO_PI
  }
  for (let i = 0; i < FIREFLY_COUNT; i += 1) phase[i] = nextPhase[i] ?? 0
}

function flashLevel(angle: number): number {
  // Brief flash as phase wraps through zero; otherwise a faint ember.
  const wrapped = angle > Math.PI ? angle - TWO_PI : angle
  return 0.08 + 0.92 * Math.exp(-((wrapped * wrapped) / 0.09))
}

function renderFrame(timestamp: number): void {
  if (!context) return
  const elapsed = previousTimestamp ? timestamp - previousTimestamp : 16.67
  previousTimestamp = timestamp
  const delta = Math.min(50, Math.max(4, elapsed))

  if (!reducedMotion) {
    stepPhases(delta / 1000)
    runMs += delta
    if (orderParameter() >= SYNC_THRESHOLD) {
      syncedMs += delta
      if (syncedMs >= SYNC_HOLD_MS) reseed(false)
    } else {
      syncedMs = 0
      if (runMs >= MAX_RUN_MS) reseed(true)
    }
  }

  const backdrop = context.createLinearGradient(0, 0, 0, height)
  backdrop.addColorStop(0, BACKGROUND_TOP)
  backdrop.addColorStop(1, BACKGROUND_BOTTOM)
  context.globalCompositeOperation = 'source-over'
  context.globalAlpha = 1
  context.fillStyle = backdrop
  context.fillRect(0, 0, width, height)

  if (glowSprite) {
    context.globalCompositeOperation = 'lighter'
    const base = Math.max(22, Math.min(width, height) * 0.06)
    for (let i = 0; i < FIREFLY_COUNT; i += 1) {
      const level = flashLevel(reducedMotion ? 0 : (phase[i] ?? 0))
      const size = base * (0.7 + level * 1.1)
      context.globalAlpha = level
      context.drawImage(
        glowSprite,
        (posX[i] ?? 0) * width - size / 2,
        (posY[i] ?? 0) * height - size / 2,
        size,
        size,
      )
    }
    context.globalAlpha = 1
    context.globalCompositeOperation = 'source-over'
  }

  animationFrameId = window.requestAnimationFrame(renderFrame)
}

function handleMotionChange(event: MediaQueryListEvent): void {
  reducedMotion = event.matches
  if (!reducedMotion) reseed(true)
}

onMounted(() => {
  const canvas = canvasRef.value
  if (!canvas) return
  context = canvas.getContext('2d')
  if (!context) return

  motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
  reducedMotion = motionQuery.matches
  motionQuery.addEventListener('change', handleMotionChange)

  buildField()
  buildSprite()
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
  glowSprite = null
})
</script>

<style scoped>
.firefly-phase-sync {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}
</style>
