<template>
  <canvas ref="canvasRef" class="moire-weave-engine" />
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'

interface GratingPalette {
  periodA: number
  periodB: number
  angleB: number
  hueA: number
  hueB: number
}

const canvasRef = ref<HTMLCanvasElement | null>(null)

const PALETTES: GratingPalette[] = [
  { periodA: 18, periodB: 19.5, angleB: 4, hueA: 200, hueB: 322 },
  { periodA: 14, periodB: 14.9, angleB: 7, hueA: 38, hueB: 192 },
  { periodA: 22, periodB: 23.6, angleB: 3, hueA: 150, hueB: 300 },
  { periodA: 16, periodB: 17.1, angleB: 9, hueA: 8, hueB: 212 },
]

const MAX_TEXTURE_SIZE = 2200
const BACKGROUND_COLOR = '#05070d'
const ALPHA_BASE = 0.82
const REDUCED_ALPHA_BASE = 0.55
const BREATHE_PERIOD_MS = 42000
const PHASE_PERIOD_MS = 200000
const ROT_AMPLITUDE_DEG = 2.5
const SCALE_AMPLITUDE = 0.006
const BIAS_FACTOR = 0.18
const BIAS_EASE = 0.05
const CLICK_COOLDOWN_MS = 900
const CROSSFADE_MS = 600

let context: CanvasRenderingContext2D | null = null
let resizeObserver: ResizeObserver | null = null
let motionQuery: MediaQueryList | null = null
let animationFrameId: number | null = null
let width = 1
let height = 1
let texSize = 1
let texA: HTMLCanvasElement | null = null
let texB: HTMLCanvasElement | null = null
let crossfadeCanvas: HTMLCanvasElement | null = null
let crossfadeActive = false
let crossfadeElapsed = 0
let previousTimestamp = 0
let phaseElapsed = 0
let breathePhase = 0
let reducedMotion = false
let paletteIndex = 0
let lastClickTs = 0
let pointerActive = false
let pointerTargetX = 0
let pointerTargetY = 0
let biasX = 0
let biasY = 0

function translateAmplitudeFor(palette: GratingPalette): number {
  return palette.periodB * 0.4
}

function maxBiasFor(palette: GratingPalette): number {
  return palette.periodB * 1.5
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

function createGratingTile(period: number, hue: number): HTMLCanvasElement {
  const size = Math.max(2, Math.round(period))
  const tile = document.createElement('canvas')
  tile.width = size
  tile.height = 2
  const tileContext = tile.getContext('2d')
  if (!tileContext) return tile
  const gradient = tileContext.createLinearGradient(0, 0, size, 0)
  const stops = 20
  for (let index = 0; index <= stops; index += 1) {
    const t = index / stops
    const value = 0.5 + 0.5 * Math.sin(t * Math.PI * 2)
    const lightness = 28 + value * 42
    gradient.addColorStop(t, `hsl(${hue}, 82%, ${lightness}%)`)
  }
  tileContext.fillStyle = gradient
  tileContext.fillRect(0, 0, size, 2)
  return tile
}

function createGratingTexture(
  period: number,
  hue: number,
  size: number,
): HTMLCanvasElement {
  const tile = createGratingTile(period, hue)
  const texture = document.createElement('canvas')
  texture.width = size
  texture.height = size
  const textureContext = texture.getContext('2d')
  if (!textureContext) return texture
  const pattern = textureContext.createPattern(tile, 'repeat')
  if (pattern) {
    textureContext.fillStyle = pattern
    textureContext.fillRect(0, 0, size, size)
  }
  return texture
}

function regenerateTextures(): void {
  const palette = PALETTES[paletteIndex]
  if (!palette) return
  texA = createGratingTexture(palette.periodA, palette.hueA, texSize)
  texB = createGratingTexture(palette.periodB, palette.hueB, texSize)
}

function drawGrating(
  ctx: CanvasRenderingContext2D,
  texture: HTMLCanvasElement,
  size: number,
  cx: number,
  cy: number,
  angleDeg: number,
  offsetX: number,
  offsetY: number,
  scale: number,
  alpha: number,
  compositeOperation: GlobalCompositeOperation,
): void {
  ctx.save()
  ctx.globalCompositeOperation = compositeOperation
  ctx.globalAlpha = alpha
  ctx.translate(cx + offsetX, cy + offsetY)
  ctx.rotate((angleDeg * Math.PI) / 180)
  ctx.scale(scale, scale)
  ctx.drawImage(texture, -size / 2, -size / 2)
  ctx.restore()
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
    pointerTargetX = point.x - width / 2
    pointerTargetY = point.y - height / 2
  }
}

function handlePointerDown(event: PointerEvent): void {
  if (reducedMotion) return
  const point = canvasPoint(event)
  if (!point) return
  const now = performance.now()
  if (now - lastClickTs < CLICK_COOLDOWN_MS) return
  lastClickTs = now

  const canvas = canvasRef.value
  if (!canvas) return
  if (!crossfadeCanvas) crossfadeCanvas = document.createElement('canvas')
  crossfadeCanvas.width = canvas.width
  crossfadeCanvas.height = canvas.height
  const snapshotContext = crossfadeCanvas.getContext('2d')
  snapshotContext?.clearRect(
    0,
    0,
    crossfadeCanvas.width,
    crossfadeCanvas.height,
  )
  snapshotContext?.drawImage(canvas, 0, 0)
  crossfadeElapsed = 0
  crossfadeActive = true

  paletteIndex = (paletteIndex + 1) % PALETTES.length
  regenerateTextures()
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
  texSize = Math.min(
    MAX_TEXTURE_SIZE,
    Math.ceil(Math.hypot(width, height) * 1.3),
  )
  regenerateTextures()
  crossfadeActive = false
  crossfadeCanvas = null
}

function renderFrame(timestamp: number): void {
  if (!context || !texA || !texB) {
    animationFrameId = window.requestAnimationFrame(renderFrame)
    return
  }
  const elapsed = previousTimestamp ? timestamp - previousTimestamp : 16.67
  previousTimestamp = timestamp
  const delta = Math.min(50, Math.max(4, elapsed))
  const palette = PALETTES[paletteIndex]
  if (!palette) {
    animationFrameId = window.requestAnimationFrame(renderFrame)
    return
  }

  context.clearRect(0, 0, width, height)
  context.fillStyle = BACKGROUND_COLOR
  context.fillRect(0, 0, width, height)

  if (reducedMotion) {
    breathePhase += delta
    const breathe =
      0.85 + 0.15 * Math.sin((2 * Math.PI * breathePhase) / BREATHE_PERIOD_MS)
    const alpha = REDUCED_ALPHA_BASE * breathe
    drawGrating(
      context,
      texA,
      texSize,
      width / 2,
      height / 2,
      0,
      0,
      0,
      1,
      alpha,
      'source-over',
    )
    drawGrating(
      context,
      texB,
      texSize,
      width / 2,
      height / 2,
      palette.angleB,
      0,
      0,
      1,
      alpha,
      'difference',
    )
  } else {
    phaseElapsed += delta
    const w = (2 * Math.PI) / PHASE_PERIOD_MS
    const t = phaseElapsed
    const rotDelta = ROT_AMPLITUDE_DEG * Math.sin(w * t)
    const translateAmplitude = translateAmplitudeFor(palette)
    const dx =
      translateAmplitude *
      (0.6 * Math.sin(w * t) + 0.4 * Math.sin(2 * w * t + 1.3))
    const dy =
      translateAmplitude *
      (0.6 * Math.cos(w * t) + 0.4 * Math.sin(2 * w * t + 0.6))
    const scaleDelta = 1 + SCALE_AMPLITUDE * Math.sin(w * t)

    const maxBias = maxBiasFor(palette)
    const targetBiasX = pointerActive
      ? clamp(pointerTargetX * BIAS_FACTOR, -maxBias, maxBias)
      : 0
    const targetBiasY = pointerActive
      ? clamp(pointerTargetY * BIAS_FACTOR, -maxBias, maxBias)
      : 0
    biasX += (targetBiasX - biasX) * BIAS_EASE
    biasY += (targetBiasY - biasY) * BIAS_EASE

    drawGrating(
      context,
      texA,
      texSize,
      width / 2,
      height / 2,
      0,
      0,
      0,
      1,
      ALPHA_BASE,
      'source-over',
    )
    drawGrating(
      context,
      texB,
      texSize,
      width / 2,
      height / 2,
      palette.angleB + rotDelta,
      dx + biasX,
      dy + biasY,
      scaleDelta,
      ALPHA_BASE,
      'difference',
    )

    if (crossfadeActive && crossfadeCanvas) {
      crossfadeElapsed += delta
      const fade = Math.max(0, 1 - crossfadeElapsed / CROSSFADE_MS)
      context.save()
      context.setTransform(1, 0, 0, 1, 0, 0)
      context.globalAlpha = fade
      context.globalCompositeOperation = 'source-over'
      context.drawImage(crossfadeCanvas, 0, 0)
      context.restore()
      if (crossfadeElapsed >= CROSSFADE_MS) crossfadeActive = false
    }
  }

  animationFrameId = window.requestAnimationFrame(renderFrame)
}

function handleMotionChange(event: MediaQueryListEvent): void {
  reducedMotion = event.matches
  crossfadeActive = false
  crossfadeCanvas = null
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
  texA = null
  texB = null
  crossfadeCanvas = null
  context = null
})
</script>

<style scoped>
.moire-weave-engine {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}
</style>
