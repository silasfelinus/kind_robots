<template>
  <canvas ref="canvasRef" class="domino-spiral-cascade" />
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'

const canvasRef = ref<HTMLCanvasElement | null>(null)

const LOOP_SECONDS = 24
const DOMINOES = 120
const TURNS = 3.2
const FALL_SECONDS = 1.1
const TIP_WAVE_SECONDS = 10
const RISE_START_SECONDS = 15
const RISE_WAVE_SECONDS = 4
const BOOST_COOLDOWN_MS = 3000
const BOOST_DECAY_PER_SEC = 0.5
const TWO_PI = Math.PI * 2
const COLORS = ['#ef476f', '#ffd166', '#06d6a0', '#118ab2', '#9b5de5']

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

// Closed form of the topple wave: domino i tips when the wave front reaches it
// (staggered over TIP_WAVE_SECONDS), lies flat, then stands back up in a second
// staggered wave, finishing well before the loop wraps so there is no hard cut.
function fallAmount(i: number, seconds: number): number {
  const local = ((seconds % LOOP_SECONDS) + LOOP_SECONDS) % LOOP_SECONDS
  const order = i / DOMINOES
  const down = Math.max(
    0,
    Math.min(1, (local - order * TIP_WAVE_SECONDS) / FALL_SECONDS),
  )
  const up = Math.max(
    0,
    Math.min(
      1,
      (local - RISE_START_SECONDS - order * RISE_WAVE_SECONDS) / FALL_SECONDS,
    ),
  )
  // Ease-in: a domino accelerates as it tips.
  return down * down * (1 - up)
}

function spiralPoint(i: number): { x: number; y: number; a: number } {
  const u = (i + 1) / DOMINOES
  const maxR = Math.min(width, height) * 0.44
  const r = maxR * (0.12 + 0.88 * u)
  const a = u * TURNS * TWO_PI
  return {
    x: width / 2 + Math.cos(a) * r,
    y: height / 2 + Math.sin(a) * r * 0.85,
    a,
  }
}

function drawBackdrop(): void {
  if (!context) return
  const bg = context.createRadialGradient(
    width / 2,
    height / 2,
    0,
    width / 2,
    height / 2,
    Math.max(width, height) * 0.7,
  )
  bg.addColorStop(0, '#f6efe0')
  bg.addColorStop(1, '#cdb894')
  context.fillStyle = bg
  context.fillRect(0, 0, width, height)
}

function drawDomino(i: number, fall: number, glow: number): void {
  if (!context) return
  const { x, y, a } = spiralPoint(i)
  const size = Math.max(6, Math.min(width, height) * 0.03)
  const w = size * 0.55
  const h = size * 1.5
  // The domino tips along the spiral tangent; its apparent height shrinks.
  const tangent = a + Math.PI / 2
  const shown = Math.max(0.12, Math.cos(fall * (Math.PI / 2)))
  const lean = Math.sin(fall * (Math.PI / 2))
  context.save()
  context.translate(
    x + Math.cos(tangent) * lean * h * 0.5,
    y + Math.sin(tangent) * lean * h * 0.5,
  )
  context.rotate(a)
  context.fillStyle = 'rgba(60, 40, 20, 0.22)'
  context.fillRect(-w / 2, -h * shown * 0.5 + h * 0.18, w, h * shown)
  context.fillStyle = COLORS[i % COLORS.length] ?? '#ef476f'
  context.fillRect(-w / 2, -h * shown * 0.5, w, h * shown)
  context.fillStyle = `rgba(255, 255, 255, ${0.85 - fall * 0.4})`
  context.fillRect(-w / 2, -1, w, 2)
  if (glow > 0) {
    context.strokeStyle = `rgba(255, 255, 255, ${glow * 0.9})`
    context.lineWidth = 2
    context.strokeRect(-w / 2, -h * shown * 0.5, w, h * shown)
  }
  context.restore()
}

function drawScene(seconds: number): void {
  drawBackdrop()
  const boosted = seconds + boost * 4
  for (let i = 0; i < DOMINOES; i += 1) {
    let glow = 0
    if (pointerX >= 0) {
      const { x, y } = spiralPoint(i)
      glow = Math.max(
        0,
        1 -
          Math.hypot(x - pointerX, y - pointerY) /
            (Math.min(width, height) * 0.18),
      )
    }
    drawDomino(i, fallAmount(i, boosted), glow)
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
.domino-spiral-cascade {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}
</style>
