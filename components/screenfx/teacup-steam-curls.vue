<template>
  <canvas ref="canvasRef" class="teacup-steam-curls" />
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'

const canvasRef = ref<HTMLCanvasElement | null>(null)

// Three teacups on a table. Steam wisps rise on closed-form wrapped paths with
// a sine curl, so nothing needs per-wisp state. The pointer parts the steam; a
// click blows a puff that decays away.
const CUPS = 3
const WISPS_PER_CUP = 16
const KICK_COOLDOWN_MS = 3000
const KICK_DECAY_PER_SEC = 0.35
const TWO_PI = Math.PI * 2

let context: CanvasRenderingContext2D | null = null
let resizeObserver: ResizeObserver | null = null
let motionQuery: MediaQueryList | null = null
let animationFrameId: number | null = null
let lastFrameTs = 0
let clock = 0
let width = 1
let height = 1
let reducedMotion = false
let puff = 0
let lastKickTs = 0
let pointerX = -1
let pointerY = -1

// Deterministic 0..1 value per flake and channel.
function seeded(i: number, channel: number): number {
  const v = Math.sin(i * 127.1 + channel * 311.7) * 43758.5453
  return v - Math.floor(v)
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
  pointerX = point ? point.x : -1
  pointerY = point ? point.y : -1
}

function handlePointerDown(event: PointerEvent): void {
  if (reducedMotion) return
  if (!canvasPoint(event)) return
  const now = performance.now()
  if (now - lastKickTs < KICK_COOLDOWN_MS) return
  lastKickTs = now
  puff = 1
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

function drawCup(cx: number, y: number, size: number, hue: number): void {
  if (!context) return
  context.fillStyle = `hsl(${hue}, 55%, 78%)`
  context.beginPath()
  context.moveTo(cx - size, y - size * 0.9)
  context.lineTo(cx + size, y - size * 0.9)
  context.quadraticCurveTo(cx + size * 0.9, y, cx, y)
  context.quadraticCurveTo(cx - size * 0.9, y, cx - size, y - size * 0.9)
  context.closePath()
  context.fill()
  context.strokeStyle = `hsl(${hue}, 55%, 78%)`
  context.lineWidth = Math.max(2, size * 0.14)
  context.beginPath()
  context.arc(
    cx + size * 1.02,
    y - size * 0.5,
    size * 0.38,
    -Math.PI / 2,
    Math.PI / 2,
  )
  context.stroke()
  context.fillStyle = '#3b2616'
  context.beginPath()
  context.ellipse(cx, y - size * 0.9, size, size * 0.18, 0, 0, TWO_PI)
  context.fill()
}

function drawScene(seconds: number): void {
  if (!context) return
  const bg = context.createLinearGradient(0, 0, 0, height)
  bg.addColorStop(0, '#2a1d2e')
  bg.addColorStop(1, '#120d16')
  context.fillStyle = bg
  context.fillRect(0, 0, width, height)

  const tableY = height * 0.78
  context.fillStyle = '#3d2a1e'
  context.fillRect(0, tableY, width, height - tableY)

  const size = Math.min(width * 0.07, height * 0.1)
  for (let c = 0; c < CUPS; c += 1) {
    const cx = width * (0.25 + 0.25 * c)
    const hue = 20 + c * 130
    // Steam: each wisp rises on a closed-form wrapped path with a sine curl.
    for (let w = 0; w < WISPS_PER_CUP; w += 1) {
      const id = c * WISPS_PER_CUP + w
      const rise = (seeded(id, 1) + seconds * (0.05 + seeded(id, 2) * 0.03)) % 1
      const reach = height * 0.55
      const curl =
        Math.sin(rise * TWO_PI * 1.5 + seeded(id, 3) * TWO_PI + seconds * 0.4) *
        size *
        (0.3 + rise * 1.1)
      let x = cx + (seeded(id, 4) - 0.5) * size * 0.8 + curl
      const y = tableY - size * 1.1 - rise * reach
      if (pointerX >= 0 && Math.abs(y - pointerY) < size * 2) {
        x +=
          Math.sign(x - pointerX) *
          Math.max(0, size * 2 - Math.abs(x - pointerX)) *
          0.25
      }
      x += puff * Math.sin(rise * 9 + id) * size * 0.8
      const radius = size * (0.18 + rise * 0.7) * (1 + puff * 0.5)
      const alpha = Math.sin(rise * Math.PI) * 0.22
      const g = context.createRadialGradient(x, y, 0, x, y, radius)
      g.addColorStop(0, `rgba(255, 245, 235, ${alpha})`)
      g.addColorStop(1, 'rgba(255, 245, 235, 0)')
      context.fillStyle = g
      context.beginPath()
      context.arc(x, y, radius, 0, TWO_PI)
      context.fill()
    }
    drawCup(cx, tableY, size, hue)
  }
}

function renderFrame(timestamp: number): void {
  if (!context) return
  const dt = lastFrameTs ? Math.min(0.1, (timestamp - lastFrameTs) / 1000) : 0
  lastFrameTs = timestamp
  puff = Math.max(0, puff - KICK_DECAY_PER_SEC * dt)
  clock += dt
  drawScene(clock)
  animationFrameId = window.requestAnimationFrame(renderFrame)
}

function handleMotionChange(event: MediaQueryListEvent): void {
  reducedMotion = event.matches
  puff = 0
  pointerX = -1
  pointerY = -1
  if (reducedMotion) {
    if (animationFrameId !== null) window.cancelAnimationFrame(animationFrameId)
    animationFrameId = null
    drawScene(0)
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
.teacup-steam-curls {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}
</style>
