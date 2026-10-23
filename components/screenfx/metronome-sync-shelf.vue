<template>
  <canvas ref="canvasRef" class="metronome-sync-shelf" />
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'

const canvasRef = ref<HTMLCanvasElement | null>(null)

// Metronomes on a shared shelf: each starts at its own tempo and phase, and the
// shelf couples them (Kuramoto) until they tick in unison. State is a pure
// function of the loop clock via a fixed-step precomputed table, so the loop
// is seamless: sync builds over the first half, then detunes back to chaos.
const LOOP_SECONDS = 40
const METRONOMES = 11
const STEPS_PER_SEC = 30
const MAX_SWING = 0.55
const BOOST_COOLDOWN_MS = 3000
const BOOST_DECAY_PER_SEC = 0.5
const TWO_PI = Math.PI * 2

const phaseTable: number[][] = buildPhaseTable()

let context: CanvasRenderingContext2D | null = null
let resizeObserver: ResizeObserver | null = null
let motionQuery: MediaQueryList | null = null
let animationFrameId: number | null = null
let lastFrameTs = 0
let width = 1
let height = 1
let reducedMotion = false
let boost = 0
let lastBoostTs = 0
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
  if (now - lastBoostTs < BOOST_COOLDOWN_MS) return
  lastBoostTs = now
  boost = 1
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

function buildPhaseTable(): number[][] {
  const steps = LOOP_SECONDS * STEPS_PER_SEC
  const freq: number[] = []
  const phase: number[] = []
  for (let n = 0; n < METRONOMES; n += 1) {
    freq.push(1.05 + ((n * 7) % METRONOMES) * 0.035)
    phase.push(((n * 5) % METRONOMES) * 0.57)
  }
  const dt = 1 / STEPS_PER_SEC
  const table: number[][] = []
  for (let step = 0; step < steps; step += 1) {
    table.push(phase.slice())
    const t = step * dt
    // Coupling ramps up, holds, then fades so the loop returns to disorder.
    const k = Math.max(0, Math.sin((t / LOOP_SECONDS) * Math.PI)) * 2.4
    const next = phase.map((p, n) => {
      let pull = 0
      for (let m = 0; m < METRONOMES; m += 1) {
        pull += Math.sin((phase[m] ?? 0) - p)
      }
      return p + (TWO_PI * (freq[n] ?? 1) + (k * pull) / METRONOMES) * dt
    })
    for (let n = 0; n < METRONOMES; n += 1) phase[n] = next[n] ?? 0
  }
  return table
}

function phaseAt(n: number, seconds: number): number {
  const local = ((seconds % LOOP_SECONDS) + LOOP_SECONDS) % LOOP_SECONDS
  const idx = Math.floor(local * STEPS_PER_SEC) % phaseTable.length
  const row = phaseTable[idx]
  return row?.[n] ?? 0
}

function swingAngle(n: number, seconds: number): number {
  return Math.sin(phaseAt(n, seconds)) * MAX_SWING
}

function drawBackdrop(): void {
  if (!context) return
  const bg = context.createLinearGradient(0, 0, 0, height)
  bg.addColorStop(0, '#1c1a2e')
  bg.addColorStop(1, '#3a2a46')
  context.fillStyle = bg
  context.fillRect(0, 0, width, height)
}

// The table ends on different phases than it starts with, so the scene dips
// to the backdrop for a moment around the wrap instead of jumping.
function wrapFade(seconds: number): number {
  const local = ((seconds % LOOP_SECONDS) + LOOP_SECONDS) % LOOP_SECONDS
  const edge = Math.min(local, LOOP_SECONDS - local)
  return Math.min(1, edge / 1.2)
}

function drawScene(seconds: number): void {
  if (!context) return
  drawBackdrop()
  context.globalAlpha = wrapFade(seconds)
  const margin = width * 0.12
  const gap = (width - margin * 2) / (METRONOMES - 1)
  const baseY = height * 0.82
  const armLen = Math.min(height * 0.5, gap * 3.2)
  const t = seconds + boost * 8

  context.fillStyle = '#7a5a3a'
  context.fillRect(margin * 0.5, baseY, width - margin, height * 0.03)

  for (let n = 0; n < METRONOMES; n += 1) {
    const u = n / (METRONOMES - 1)
    const x = margin + gap * n
    const bodyW = Math.min(gap * 0.7, height * 0.08)
    const bodyH = bodyW * 1.9
    const angle = swingAngle(n, t)
    const tipX = x + Math.sin(angle) * armLen
    const tipY = baseY - Math.cos(angle) * armLen
    let glow = 0
    if (pointerX >= 0) {
      glow = Math.max(
        0,
        1 - Math.hypot(x - pointerX, baseY - pointerY) / (height * 0.3),
      )
    }
    const hue = 20 + u * 40
    context.fillStyle = `hsl(${hue}, 55%, ${34 + glow * 18}%)`
    context.beginPath()
    context.moveTo(x - bodyW / 2, baseY)
    context.lineTo(x + bodyW / 2, baseY)
    context.lineTo(x + bodyW * 0.18, baseY - bodyH)
    context.lineTo(x - bodyW * 0.18, baseY - bodyH)
    context.closePath()
    context.fill()
    context.strokeStyle = '#f5e9d0'
    context.lineWidth = 2
    context.beginPath()
    context.moveTo(x, baseY - bodyH * 0.1)
    context.lineTo(tipX, tipY)
    context.stroke()
    context.fillStyle = '#e0b04a'
    context.fillRect(
      x + (tipX - x) * 0.55 - bodyW * 0.16,
      baseY - bodyH * 0.1 + (tipY - baseY + bodyH * 0.1) * 0.55 - bodyW * 0.1,
      bodyW * 0.32,
      bodyW * 0.2,
    )
  }
  context.globalAlpha = 1
}

function renderFrame(timestamp: number): void {
  if (!context) return
  const dt = lastFrameTs ? Math.min(0.1, (timestamp - lastFrameTs) / 1000) : 0
  lastFrameTs = timestamp
  boost = Math.max(0, boost - BOOST_DECAY_PER_SEC * dt)
  drawScene(timestamp / 1000)
  animationFrameId = window.requestAnimationFrame(renderFrame)
}

function handleMotionChange(event: MediaQueryListEvent): void {
  reducedMotion = event.matches
  boost = 0
  pointerX = -1
  pointerY = -1
  if (reducedMotion) drawScene(LOOP_SECONDS * 0.5)
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
    if (reducedMotion) drawScene(LOOP_SECONDS * 0.5)
  })
  resizeObserver.observe(canvas)
  window.addEventListener('pointermove', handlePointerMove, { passive: true })
  window.addEventListener('pointerdown', handlePointerDown, { passive: true })
  resizeCanvas()
  if (reducedMotion) drawScene(LOOP_SECONDS * 0.5)
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
.metronome-sync-shelf {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}
</style>
