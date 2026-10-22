<template>
  <canvas ref="canvasRef" class="chladni-sand-plate" />
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'

const canvasRef = ref<HTMLCanvasElement | null>(null)

// Mode pairs (n, m) of a square vibrating plate; the plate rings each pair for
// HOLD seconds, then the sand slides to the next pattern over MORPH seconds.
const MODES: ReadonlyArray<readonly [number, number]> = [
  [2, 3],
  [3, 5],
  [1, 4],
  [4, 5],
  [2, 5],
  [3, 4],
]
const HOLD_SECONDS = 5
const MORPH_SECONDS = 3
const STEP_SECONDS = HOLD_SECONDS + MORPH_SECONDS
const LOOP_SECONDS = STEP_SECONDS * MODES.length
const CELL = 5
const MAX_CELLS = 24000
const BOOST_COOLDOWN_MS = 3000
const BOOST_DECAY_PER_SEC = 0.5
const PI = Math.PI

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

// Plate displacement for mode (n, m) at plate coordinates u, v in [0, 1].
function mode(n: number, m: number, u: number, v: number): number {
  return (
    Math.cos(n * PI * u) * Math.cos(m * PI * v) -
    Math.cos(m * PI * u) * Math.cos(n * PI * v)
  )
}

// Closed form of the morph: the plate holds one mode, then eases its amplitude
// across to the next, so the sand always follows a continuous field.
function plateField(seconds: number, u: number, v: number): number {
  const local = ((seconds % LOOP_SECONDS) + LOOP_SECONDS) % LOOP_SECONDS
  const step = Math.floor(local / STEP_SECONDS)
  const into = local - step * STEP_SECONDS
  const blend = Math.max(0, Math.min(1, (into - HOLD_SECONDS) / MORPH_SECONDS))
  const eased = blend * blend * (3 - 2 * blend)
  const [n1, m1] = MODES[step % MODES.length] ?? MODES[0]!
  const [n2, m2] = MODES[(step + 1) % MODES.length] ?? MODES[0]!
  return (1 - eased) * mode(n1, m1, u, v) + eased * mode(n2, m2, u, v)
}

function drawBackdrop(): void {
  if (!context) return
  const bg = context.createLinearGradient(0, 0, width, height)
  bg.addColorStop(0, '#1b1f2a')
  bg.addColorStop(1, '#2d2a26')
  context.fillStyle = bg
  context.fillRect(0, 0, width, height)
}

function drawScene(seconds: number): void {
  if (!context) return
  drawBackdrop()
  const size = Math.min(width, height) * 0.92
  const cell = Math.max(CELL, Math.ceil(Math.sqrt((size * size) / MAX_CELLS)))
  const left = (width - size) / 2
  const top = (height - size) / 2
  const count = Math.floor(size / cell)
  // Faint brass plate under the sand.
  context.fillStyle = 'rgba(176, 141, 87, 0.16)'
  context.fillRect(left, top, size, size)
  const radius = Math.min(width, height) * 0.2
  const t = seconds + boost * 3
  // Hover and click make the plate ring harder, so sand skitters off the lines.
  const jitterAmp = boost * 0.9
  for (let i = 0; i < count; i += 1) {
    for (let j = 0; j < count; j += 1) {
      const u = (i + 0.5) / count
      const v = (j + 0.5) / count
      const x = left + i * cell
      const y = top + j * cell
      const f = Math.abs(plateField(t, u, v))
      // Sand gathers where displacement is small (the nodal lines).
      let sand = 1 - Math.min(1, f / 0.35)
      if (sand <= 0.02) continue
      if (jitterAmp > 0) {
        sand *=
          1 -
          jitterAmp * 0.5 * (0.5 + 0.5 * Math.sin(t * 40 + i * 12.9 + j * 78.2))
      }
      let glow = 0
      if (pointerX >= 0) {
        glow = Math.max(0, 1 - Math.hypot(x - pointerX, y - pointerY) / radius)
      }
      const light = 62 + glow * 30
      context.fillStyle = `hsla(40, ${55 - glow * 30}%, ${light}%, ${0.25 + sand * 0.7})`
      context.fillRect(x, y, cell - 1, cell - 1)
    }
  }
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
  if (reducedMotion) drawScene(0)
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
    if (reducedMotion) drawScene(0)
  })
  resizeObserver.observe(canvas)
  window.addEventListener('pointermove', handlePointerMove, { passive: true })
  window.addEventListener('pointerdown', handlePointerDown, { passive: true })
  resizeCanvas()
  if (reducedMotion) drawScene(0)
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
.chladni-sand-plate {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}
</style>
