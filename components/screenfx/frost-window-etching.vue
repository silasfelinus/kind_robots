<template>
  <canvas ref="canvasRef" class="frost-window-etching" />
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'

interface Walker {
  x: number
  y: number
  angle: number
}

interface ClearPatch {
  x: number
  y: number
  radius: number
  startedAt: number
}

const canvasRef = ref<HTMLCanvasElement | null>(null)

let context: CanvasRenderingContext2D | null = null
let frostCanvas: HTMLCanvasElement | null = null
let frostContext: CanvasRenderingContext2D | null = null
let resizeObserver: ResizeObserver | null = null
let motionQuery: MediaQueryList | null = null
let animationFrameId: number | null = null
let width = 1
let height = 1
let dpr = 1
let previousTimestamp = 0
let reducedMotion = false
let coverage = 0
let forcedClearUsed = false
let lastTrailAt = 0

const MAX_WALKERS = 44
const WALKER_STEPS_PER_FRAME = 2
const COVERAGE_TRIGGER = 0.68
const CLEAR_DURATION_MS = 1900
const REGROWTH_RESET_COVERAGE = 0.48
const walkers: Walker[] = []
const clearPatches: ClearPatch[] = []
const pointer = { x: 0, y: 0, active: false }

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

function randomBetween(min: number, max: number): number {
  return min + Math.random() * (max - min)
}

function makeWalker(): Walker {
  const side = Math.floor(Math.random() * 4)
  if (side === 0)
    return { x: randomBetween(0, width), y: 1, angle: Math.PI / 2 }
  if (side === 1)
    return { x: width - 1, y: randomBetween(0, height), angle: Math.PI }
  if (side === 2)
    return { x: randomBetween(0, width), y: height - 1, angle: -Math.PI / 2 }
  return { x: 1, y: randomBetween(0, height), angle: 0 }
}

function resetWalkers(): void {
  walkers.length = 0
  for (let i = 0; i < MAX_WALKERS; i += 1) walkers.push(makeWalker())
}

function frostStroke(
  x: number,
  y: number,
  angle: number,
  length: number,
): void {
  if (!frostContext) return
  const x2 = x + Math.cos(angle) * length
  const y2 = y + Math.sin(angle) * length
  frostContext.save()
  frostContext.strokeStyle = `rgba(226, 242, 255, ${randomBetween(0.18, 0.42)})`
  frostContext.lineWidth = randomBetween(0.7, 1.6)
  frostContext.beginPath()
  frostContext.moveTo(x, y)
  frostContext.lineTo(x2, y2)
  frostContext.stroke()
  frostContext.restore()
  coverage = clamp(
    coverage + length / Math.max(1, width * height * 0.012),
    0,
    1,
  )
}

function seedEdgeFrost(): void {
  if (!frostContext) return
  const count = Math.max(24, Math.floor((width + height) / 32))
  for (let i = 0; i < count; i += 1) {
    const walker = makeWalker()
    frostStroke(walker.x, walker.y, walker.angle, randomBetween(8, 22))
  }
}

function clearPatch(
  x: number,
  y: number,
  timestamp: number,
  forced = false,
): void {
  if (!frostContext) return
  const radius = clamp(
    Math.min(width, height) * randomBetween(0.1, 0.17),
    36,
    130,
  )
  frostContext.save()
  frostContext.globalCompositeOperation = 'destination-out'
  const gradient = frostContext.createRadialGradient(x, y, 0, x, y, radius)
  gradient.addColorStop(0, 'rgba(0,0,0,0.96)')
  gradient.addColorStop(0.72, 'rgba(0,0,0,0.72)')
  gradient.addColorStop(1, 'rgba(0,0,0,0)')
  frostContext.fillStyle = gradient
  frostContext.beginPath()
  frostContext.arc(x, y, radius, 0, Math.PI * 2)
  frostContext.fill()
  frostContext.restore()
  clearPatches.push({ x, y, radius, startedAt: timestamp })
  if (clearPatches.length > 3) clearPatches.shift()
  coverage = Math.max(0, coverage - 0.2)
  if (forced) forcedClearUsed = true
}

function stepWalker(walker: Walker): void {
  const centerAngle = Math.atan2(height / 2 - walker.y, width / 2 - walker.x)
  walker.angle +=
    (centerAngle - walker.angle) * 0.055 + randomBetween(-0.42, 0.42)
  const length = randomBetween(2.4, 6.2)
  frostStroke(walker.x, walker.y, walker.angle, length)
  walker.x += Math.cos(walker.angle) * length
  walker.y += Math.sin(walker.angle) * length

  if (Math.random() < 0.075) {
    frostStroke(
      walker.x,
      walker.y,
      walker.angle + randomBetween(-1.05, 1.05),
      length * 0.8,
    )
  }

  if (
    walker.x < 0 ||
    walker.x > width ||
    walker.y < 0 ||
    walker.y > height ||
    Math.random() < 0.012
  ) {
    Object.assign(walker, makeWalker())
  }
}

function growFrost(): void {
  for (let pass = 0; pass < WALKER_STEPS_PER_FRAME; pass += 1) {
    for (const walker of walkers) stepWalker(walker)
  }
}

function drawPane(ctx: CanvasRenderingContext2D, timestamp: number): void {
  ctx.clearRect(0, 0, width, height)
  const background = ctx.createLinearGradient(0, 0, 0, height)
  background.addColorStop(0, 'rgba(10, 24, 38, 0.28)')
  background.addColorStop(1, 'rgba(4, 12, 22, 0.18)')
  ctx.fillStyle = background
  ctx.fillRect(0, 0, width, height)

  if (frostCanvas) ctx.drawImage(frostCanvas, 0, 0, width, height)

  const sheen = ctx.createLinearGradient(0, 0, width, height)
  sheen.addColorStop(0, 'rgba(220, 242, 255, 0.04)')
  sheen.addColorStop(0.5, 'rgba(255,255,255,0.015)')
  sheen.addColorStop(1, 'rgba(170, 220, 255, 0.055)')
  ctx.fillStyle = sheen
  ctx.fillRect(0, 0, width, height)

  ctx.strokeStyle = 'rgba(200, 232, 250, 0.16)'
  ctx.lineWidth = 1
  ctx.strokeRect(1, 1, Math.max(0, width - 2), Math.max(0, height - 2))

  if (reducedMotion) {
    ctx.fillStyle = `rgba(225, 244, 255, ${0.025 + Math.sin(timestamp * 0.00018) * 0.012})`
    ctx.fillRect(0, 0, width, height)
  }
}

function renderFrame(timestamp: number): void {
  if (!context) return
  const elapsed = previousTimestamp ? timestamp - previousTimestamp : 16.67
  previousTimestamp = timestamp
  const delta = Math.min(50, Math.max(4, elapsed))

  if (!reducedMotion) {
    growFrost()
    if (coverage >= COVERAGE_TRIGGER && clearPatches.length === 0) {
      clearPatch(
        randomBetween(width * 0.35, width * 0.65),
        randomBetween(height * 0.35, height * 0.65),
        timestamp,
      )
    }

    for (let i = clearPatches.length - 1; i >= 0; i -= 1) {
      const patch = clearPatches[i]
      if (!patch) continue
      if (timestamp - patch.startedAt > CLEAR_DURATION_MS)
        clearPatches.splice(i, 1)
    }

    if (
      forcedClearUsed &&
      coverage >= REGROWTH_RESET_COVERAGE &&
      clearPatches.length === 0
    ) {
      forcedClearUsed = false
    }
  }

  drawPane(context, timestamp)
  void delta
  animationFrameId = window.requestAnimationFrame(renderFrame)
}

function applyWarmTrail(x: number, y: number, timestamp: number): void {
  if (!frostContext || reducedMotion || timestamp - lastTrailAt < 42) return
  lastTrailAt = timestamp
  frostContext.save()
  frostContext.globalCompositeOperation = 'destination-out'
  const radius = clamp(Math.min(width, height) * 0.035, 12, 36)
  const gradient = frostContext.createRadialGradient(x, y, 0, x, y, radius)
  gradient.addColorStop(0, 'rgba(0,0,0,0.28)')
  gradient.addColorStop(1, 'rgba(0,0,0,0)')
  frostContext.fillStyle = gradient
  frostContext.beginPath()
  frostContext.arc(x, y, radius, 0, Math.PI * 2)
  frostContext.fill()
  frostContext.restore()
}

function eventPoint(
  event: PointerEvent | MouseEvent,
): { x: number; y: number } | null {
  const canvas = canvasRef.value
  if (!canvas) return null
  const rect = canvas.getBoundingClientRect()
  if (rect.width <= 0 || rect.height <= 0) return null
  return {
    x: ((event.clientX - rect.left) / rect.width) * width,
    y: ((event.clientY - rect.top) / rect.height) * height,
  }
}

function onPointerMove(event: PointerEvent): void {
  const point = eventPoint(event)
  if (!point) return
  pointer.x = point.x
  pointer.y = point.y
  pointer.active = true
  applyWarmTrail(point.x, point.y, performance.now())
}

function onPointerLeave(): void {
  pointer.active = false
}

function onClick(event: MouseEvent): void {
  if (reducedMotion || forcedClearUsed) return
  const point = eventPoint(event)
  if (!point) return
  clearPatch(point.x, point.y, performance.now(), true)
}

function configureCanvas(): void {
  const canvas = canvasRef.value
  if (!canvas) return
  const rect = canvas.getBoundingClientRect()
  width = Math.max(1, Math.round(rect.width))
  height = Math.max(1, Math.round(rect.height))
  dpr = Math.min(window.devicePixelRatio || 1, 2)
  canvas.width = Math.round(width * dpr)
  canvas.height = Math.round(height * dpr)
  context = canvas.getContext('2d')
  context?.setTransform(dpr, 0, 0, dpr, 0, 0)

  frostCanvas = document.createElement('canvas')
  frostCanvas.width = width
  frostCanvas.height = height
  frostContext = frostCanvas.getContext('2d')
  coverage = 0
  clearPatches.length = 0
  forcedClearUsed = false
  resetWalkers()
  seedEdgeFrost()

  if (reducedMotion) {
    for (let i = 0; i < 220; i += 1) growFrost()
    clearPatch(width * 0.56, height * 0.48, 0)
    clearPatches.length = 0
  }
}

function onMotionChange(event: MediaQueryListEvent): void {
  reducedMotion = event.matches
  configureCanvas()
}

onMounted(() => {
  motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
  reducedMotion = motionQuery.matches
  motionQuery.addEventListener('change', onMotionChange)

  configureCanvas()
  resizeObserver = new ResizeObserver(configureCanvas)
  if (canvasRef.value) resizeObserver.observe(canvasRef.value)

  window.addEventListener('pointermove', onPointerMove, { passive: true })
  window.addEventListener('pointerleave', onPointerLeave)
  window.addEventListener('click', onClick, { passive: true })
  animationFrameId = window.requestAnimationFrame(renderFrame)
})

onBeforeUnmount(() => {
  if (animationFrameId !== null) window.cancelAnimationFrame(animationFrameId)
  resizeObserver?.disconnect()
  motionQuery?.removeEventListener('change', onMotionChange)
  window.removeEventListener('pointermove', onPointerMove)
  window.removeEventListener('pointerleave', onPointerLeave)
  window.removeEventListener('click', onClick)
  frostCanvas = null
  frostContext = null
  context = null
})
</script>

<style scoped>
.frost-window-etching {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}
</style>
