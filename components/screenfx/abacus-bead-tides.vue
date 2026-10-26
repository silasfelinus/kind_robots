<template>
  <canvas ref="canvasRef" class="abacus-bead-tides" />
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'

const canvasRef = ref<HTMLCanvasElement | null>(null)

// A frame of rods, each strung with beads that slide side to side. How many
// beads sit on the right is a closed-form sine of one clock with a phase offset
// per rod, so a slow tide of beads rolls down the frame and back with no input.
const RODS = 9
const BEADS = 10
const PERIOD_SECONDS = 14
const PHASE_STEP = 0.09
const KICK_COOLDOWN_MS = 3000
const KICK_DECAY_PER_SEC = 0.4
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
let kick = 0
let lastKickTs = 0
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
  if (now - lastKickTs < KICK_COOLDOWN_MS) return
  lastKickTs = now
  kick = 1
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

function ease(p: number): number {
  return p * p * (3 - 2 * p)
}

// Fractional count of beads currently slid to the right on rod `rod`.
function slidCount(rod: number, seconds: number): number {
  const phase = seconds / PERIOD_SECONDS + rod * PHASE_STEP
  const wave = 0.5 + 0.5 * Math.sin(TWO_PI * phase)
  const flare = kick * 0.25 * Math.sin(TWO_PI * (rod / RODS + seconds * 0.5))
  return Math.min(BEADS, Math.max(0, (wave + flare) * BEADS))
}

function drawScene(seconds: number): void {
  if (!context) return
  const bg = context.createLinearGradient(0, 0, 0, height)
  bg.addColorStop(0, '#2a1d14')
  bg.addColorStop(1, '#14100c')
  context.fillStyle = bg
  context.fillRect(0, 0, width, height)

  const frameX = width * 0.08
  const frameW = width * 0.84
  const frameY = height * 0.1
  const frameH = height * 0.8
  context.strokeStyle = '#8a6238'
  context.lineWidth = Math.max(4, width * 0.006)
  context.strokeRect(frameX, frameY, frameW, frameH)

  const rodGap = frameH / (RODS + 1)
  const beadW = Math.min(frameW / (BEADS + 2), rodGap * 1.5)
  const beadH = Math.min(rodGap * 0.4, beadW * 0.6)
  const innerX = frameX + beadW * 0.3
  const innerW = frameW - beadW * 0.6

  for (let r = 0; r < RODS; r += 1) {
    const y = frameY + rodGap * (r + 1)
    context.strokeStyle = 'rgba(200, 170, 120, 0.6)'
    context.lineWidth = 2
    context.beginPath()
    context.moveTo(frameX, y)
    context.lineTo(frameX + frameW, y)
    context.stroke()

    const k = slidCount(r, seconds)
    for (let j = 0; j < BEADS; j += 1) {
      const leftX = innerX + beadW * (j + 0.5)
      const rightX = innerX + innerW - beadW * (BEADS - j - 0.5)
      const p = ease(Math.min(1, Math.max(0, k - (BEADS - 1 - j))))
      const x = leftX + (rightX - leftX) * p
      let glow = 0
      if (pointerX >= 0) {
        glow = Math.max(
          0,
          1 - Math.hypot(x - pointerX, y - pointerY) / (height * 0.18),
        )
      }
      const hue = 18 + r * 9
      const gradient = context.createRadialGradient(
        x - beadW * 0.12,
        y - beadH * 0.3,
        beadH * 0.1,
        x,
        y,
        beadW * 0.5,
      )
      gradient.addColorStop(0, `hsl(${hue}, 70%, ${68 + glow * 20}%)`)
      gradient.addColorStop(1, `hsl(${hue}, 60%, ${30 + glow * 25}%)`)
      context.fillStyle = gradient
      context.beginPath()
      context.ellipse(x, y, beadW * 0.46, beadH, 0, 0, TWO_PI)
      context.fill()
    }
  }
}

function renderFrame(timestamp: number): void {
  if (!context) return
  const dt = lastFrameTs ? Math.min(0.1, (timestamp - lastFrameTs) / 1000) : 0
  lastFrameTs = timestamp
  kick = Math.max(0, kick - KICK_DECAY_PER_SEC * dt)
  clock += dt
  drawScene(clock)
  animationFrameId = window.requestAnimationFrame(renderFrame)
}

function handleMotionChange(event: MediaQueryListEvent): void {
  reducedMotion = event.matches
  kick = 0
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
.abacus-bead-tides {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}
</style>
