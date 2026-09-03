<!-- /components/screenfx/hourglass-cascade.vue -->
<template>
  <canvas ref="canvasRef" class="hourglass-cascade" />
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'

type Phase = 'pouring' | 'settling' | 'flipping'

interface Grain {
  x: number
  y: number
  bin: number
  startedAt: number
  hueOffset: number
}

interface BulbState {
  reservoir: number
  pile: number[]
}

const canvasRef = ref<HTMLCanvasElement | null>(null)

let animationFrameId: number | null = null
let resizeObserver: ResizeObserver | null = null
let motionQuery: MediaQueryList | null = null
let context: CanvasRenderingContext2D | null = null
let width = 1
let height = 1
let previousTimestamp = 0
let reducedMotion = false
let simTime = 0

// Fixed regardless of viewport, per the pitch's performance_risk note: in-flight grain
// count and height-map bin count never grow with elapsed session time or resize.
const BIN_COUNT = 18
const MAX_IN_FLIGHT = 12
const TOTAL_GRAINS = 220
const SPAWN_INTERVAL_MS = 260
const FALL_DURATION_MS = 620
const HOLD_AFTER_EMPTY_MS = 500
const FLIP_DURATION_MS = 950
const GAP_HALF_ANGLE = 0.34
const SAND_HUE = 34
const GLASS_STROKE = 'rgba(205, 224, 236, 0.45)'

let centerX = 0
let centerY = 0
let bulbRadius = 60
let neckHalfWidth = 20
let topBulbCenterY = 0
let bottomBulbCenterY = 0
let neckTopY = 0
let neckBottomY = 0
let bandWidth = 80
let binWidth = 80 / BIN_COUNT
let grainHeight = 3
let reposeThreshold = 9
let maxBinHeight = 90
let glassPath: Path2D | null = null

const bulbs: BulbState[] = [
  { reservoir: TOTAL_GRAINS, pile: new Array(BIN_COUNT).fill(0) },
  { reservoir: 0, pile: new Array(BIN_COUNT).fill(0) },
]
let topBulbIndex = 0

const inFlight: Grain[] = []
let phase: Phase = 'pouring'
let settleElapsed = 0
let flipElapsed = 0
let flipAngle = 0
let earlyFlipUsed = false
let lastSpawnAt = 0

const pointer = { x: 0, y: 0, active: false }
let hoverNeck = false

let staticPile: number[] = []
let staticBuilt = false

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

function easeInOutCubic(t: number): number {
  const clamped = clamp(t, 0, 1)
  return clamped < 0.5
    ? 4 * clamped * clamped * clamped
    : 1 - Math.pow(-2 * clamped + 2, 3) / 2
}

function bottomBulbIndex(): number {
  return 1 - topBulbIndex
}

function buildGlassPath(): Path2D {
  const path = new Path2D()

  const topStart = Math.PI / 2 + GAP_HALF_ANGLE
  const topEnd = Math.PI / 2 - GAP_HALF_ANGLE + Math.PI * 2
  path.moveTo(
    centerX + bulbRadius * Math.cos(topStart),
    topBulbCenterY + bulbRadius * Math.sin(topStart),
  )
  path.arc(centerX, topBulbCenterY, bulbRadius, topStart, topEnd, false)
  path.lineTo(centerX + neckHalfWidth, neckBottomY)

  const bottomGapAngle = (3 * Math.PI) / 2
  const bottomStart = bottomGapAngle + GAP_HALF_ANGLE
  const bottomEnd = bottomGapAngle - GAP_HALF_ANGLE + Math.PI * 2
  path.arc(
    centerX,
    bottomBulbCenterY,
    bulbRadius,
    bottomStart,
    bottomEnd,
    false,
  )
  path.lineTo(centerX - neckHalfWidth, neckTopY)
  path.closePath()

  return path
}

function resetState(): void {
  bulbs[0] = { reservoir: TOTAL_GRAINS, pile: new Array(BIN_COUNT).fill(0) }
  bulbs[1] = { reservoir: 0, pile: new Array(BIN_COUNT).fill(0) }
  topBulbIndex = 0
  inFlight.length = 0
  phase = 'pouring'
  settleElapsed = 0
  flipElapsed = 0
  flipAngle = 0
  earlyFlipUsed = false
  lastSpawnAt = 0
  staticBuilt = false
}

function buildStaticPile(): void {
  staticPile = []
  const half = (BIN_COUNT - 1) / 2
  const peak = maxBinHeight * 0.55
  for (let i = 0; i < BIN_COUNT; i += 1) {
    const distance = Math.abs(i - half) / half
    staticPile.push(Math.max(0, peak * (1 - distance * distance)))
  }
  staticBuilt = true
}

function levelPileAround(pile: number[], index: number): void {
  let current = index
  for (let step = 0; step < 5; step += 1) {
    const leftVal =
      current > 0 ? (pile[current - 1] ?? 0) : (pile[current] ?? 0)
    const rightVal =
      current < BIN_COUNT - 1 ? (pile[current + 1] ?? 0) : (pile[current] ?? 0)
    const here = pile[current] ?? 0
    const lowestNeighbor = Math.min(leftVal, rightVal)
    if (here - lowestNeighbor <= reposeThreshold) break

    const targetIndex = leftVal <= rightVal ? current - 1 : current + 1
    if (targetIndex < 0 || targetIndex >= BIN_COUNT) break

    pile[current] = here - grainHeight
    pile[targetIndex] = (pile[targetIndex] ?? 0) + grainHeight
    current = targetIndex
  }

  const capped = pile[index] ?? 0
  if (capped > maxBinHeight) {
    const overflow = capped - maxBinHeight
    pile[index] = maxBinHeight
    const spillTarget = index > 0 ? index - 1 : index + 1
    if (spillTarget >= 0 && spillTarget < BIN_COUNT) {
      pile[spillTarget] = (pile[spillTarget] ?? 0) + overflow
    }
  }
}

function landGrain(grain: Grain): void {
  const pile = bulbs[bottomBulbIndex()]?.pile
  if (!pile) return
  pile[grain.bin] = (pile[grain.bin] ?? 0) + grainHeight
  levelPileAround(pile, grain.bin)
}

function maybeSpawnGrain(timestamp: number): void {
  const top = bulbs[topBulbIndex]
  if (!top || top.reservoir <= 0) return
  if (inFlight.length >= MAX_IN_FLIGHT) return
  if (timestamp - lastSpawnAt < SPAWN_INTERVAL_MS) return

  lastSpawnAt = timestamp
  top.reservoir = Math.max(0, top.reservoir - 1)

  const jitterRange = hoverNeck ? neckHalfWidth * 0.3 : neckHalfWidth * 0.82
  const jitter = (Math.random() * 2 - 1) * jitterRange
  const x = centerX + jitter
  const left = centerX - bandWidth / 2
  const bin = clamp(Math.floor((x - left) / binWidth), 0, BIN_COUNT - 1)

  inFlight.push({
    x,
    y: neckTopY,
    bin,
    startedAt: timestamp,
    hueOffset: Math.random() * 14 - 7,
  })
}

function updateInFlight(timestamp: number): void {
  const pile = bulbs[bottomBulbIndex()]?.pile
  const baseY = bottomBulbCenterY + bulbRadius * 0.78

  for (let i = inFlight.length - 1; i >= 0; i -= 1) {
    const grain = inFlight[i]
    if (!grain) continue

    const progress = clamp(
      (timestamp - grain.startedAt) / FALL_DURATION_MS,
      0,
      1,
    )
    const targetY = baseY - (pile?.[grain.bin] ?? 0)
    grain.y = neckTopY + progress * (targetY - neckTopY)

    if (progress >= 1) {
      landGrain(grain)
      inFlight.splice(i, 1)
    }
  }
}

function checkPourComplete(): void {
  const top = bulbs[topBulbIndex]
  if (top && top.reservoir <= 0 && inFlight.length === 0) {
    phase = 'settling'
    settleElapsed = 0
  }
}

function performFlip(): void {
  const oldBottom = bottomBulbIndex()
  const bottomBulb = bulbs[oldBottom]
  const topBulb = bulbs[topBulbIndex]
  if (!bottomBulb || !topBulb) return

  const accumulated = bottomBulb.pile.reduce((sum, h) => sum + h, 0)
  const newReservoir = Math.round(
    clamp(accumulated / grainHeight, 0, TOTAL_GRAINS),
  )

  bottomBulb.reservoir = newReservoir
  bottomBulb.pile = new Array(BIN_COUNT).fill(0)
  topBulb.reservoir = 0
  topBulb.pile = new Array(BIN_COUNT).fill(0)

  topBulbIndex = oldBottom
}

function drawGlass(ctx: CanvasRenderingContext2D, hueShift: number): void {
  if (!glassPath) return
  ctx.save()
  ctx.strokeStyle = GLASS_STROKE
  ctx.lineWidth = 1.6
  ctx.shadowColor = `hsla(${200 + hueShift}, 60%, 70%, 0.25)`
  ctx.shadowBlur = 6
  ctx.stroke(glassPath)
  ctx.restore()
}

function drawReservoir(
  ctx: CanvasRenderingContext2D,
  fraction: number,
  hueShift: number,
): void {
  const clamped = clamp(fraction, 0, 1)
  if (clamped <= 0) return

  const fillSpan = bulbRadius * 1.5
  const minLevelY = topBulbCenterY - bulbRadius * 0.7
  const levelY = clamp(neckTopY - clamped * fillSpan, minLevelY, neckTopY)
  const left = centerX - bandWidth / 2
  const right = centerX + bandWidth / 2

  ctx.save()
  ctx.beginPath()
  ctx.moveTo(left, neckTopY)
  ctx.lineTo(left, levelY)
  ctx.quadraticCurveTo(centerX, levelY - bulbRadius * 0.06, right, levelY)
  ctx.lineTo(right, neckTopY)
  ctx.closePath()
  ctx.fillStyle = `hsla(${SAND_HUE + hueShift}, 62%, 62%, 0.88)`
  ctx.fill()
  ctx.restore()
}

function drawPile(
  ctx: CanvasRenderingContext2D,
  pile: readonly number[],
  hueShift: number,
): void {
  const baseY = bottomBulbCenterY + bulbRadius * 0.78
  const left = centerX - bandWidth / 2
  const right = centerX + bandWidth / 2

  ctx.save()
  ctx.beginPath()
  ctx.moveTo(left, baseY)
  ctx.lineTo(left, baseY - (pile[0] ?? 0))
  for (let i = 0; i < BIN_COUNT; i += 1) {
    const xCenter = left + (i + 0.5) * binWidth
    ctx.lineTo(xCenter, baseY - (pile[i] ?? 0))
  }
  ctx.lineTo(right, baseY - (pile[BIN_COUNT - 1] ?? 0))
  ctx.lineTo(right, baseY)
  ctx.closePath()
  ctx.fillStyle = `hsla(${SAND_HUE + 6 + hueShift}, 58%, 56%, 0.92)`
  ctx.fill()
  ctx.restore()
}

function drawGrains(ctx: CanvasRenderingContext2D, hueShift: number): void {
  ctx.save()
  for (const grain of inFlight) {
    ctx.fillStyle = `hsla(${SAND_HUE + grain.hueOffset + hueShift}, 65%, 68%, 0.95)`
    ctx.beginPath()
    ctx.arc(grain.x, grain.y, 1.6, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.restore()
}

function drawStaticFrame(ctx: CanvasRenderingContext2D): void {
  if (!staticBuilt) buildStaticPile()
  const hueShift = Math.sin(simTime * 0.00002) * 6

  drawGlass(ctx, hueShift)
  drawReservoir(ctx, 0.58, hueShift)
  drawPile(ctx, staticPile, hueShift)
}

function drawScene(ctx: CanvasRenderingContext2D, hueShift: number): void {
  ctx.save()
  ctx.translate(centerX, centerY)
  ctx.rotate(flipAngle)
  ctx.translate(-centerX, -centerY)

  drawGlass(ctx, hueShift)

  const topBulb = bulbs[topBulbIndex]
  const bottomBulb = bulbs[bottomBulbIndex()]
  if (topBulb) drawReservoir(ctx, topBulb.reservoir / TOTAL_GRAINS, hueShift)
  if (bottomBulb) drawPile(ctx, bottomBulb.pile, hueShift)
  drawGrains(ctx, hueShift)

  ctx.restore()
}

function renderFrame(timestamp: number): void {
  if (!context) return

  const elapsed = previousTimestamp ? timestamp - previousTimestamp : 16.67
  previousTimestamp = timestamp
  const delta = Math.min(48, Math.max(4, elapsed))
  simTime += delta

  context.clearRect(0, 0, width, height)

  if (reducedMotion) {
    drawStaticFrame(context)
    animationFrameId = window.requestAnimationFrame(renderFrame)
    return
  }

  if (phase === 'pouring') {
    maybeSpawnGrain(timestamp)
    updateInFlight(timestamp)
    checkPourComplete()
  } else if (phase === 'settling') {
    settleElapsed += delta
    if (settleElapsed >= HOLD_AFTER_EMPTY_MS) {
      phase = 'flipping'
      flipElapsed = 0
    }
  } else if (phase === 'flipping') {
    flipElapsed += delta
    if (flipElapsed >= FLIP_DURATION_MS) {
      performFlip()
      phase = 'pouring'
      earlyFlipUsed = false
      flipAngle = 0
      lastSpawnAt = timestamp
    } else {
      flipAngle = easeInOutCubic(flipElapsed / FLIP_DURATION_MS) * Math.PI
    }
  }

  const hueShift = Math.sin(simTime * 0.00003) * 4
  drawScene(context, hueShift)

  animationFrameId = window.requestAnimationFrame(renderFrame)
}

function canvasPoint(
  clientX: number,
  clientY: number,
): { x: number; y: number } | null {
  const canvas = canvasRef.value
  if (!canvas) return null

  const rect = canvas.getBoundingClientRect()
  const x = clientX - rect.left
  const y = clientY - rect.top

  if (x < 0 || y < 0 || x > rect.width || y > rect.height) return null
  return { x, y }
}

function handlePointerMove(event: PointerEvent): void {
  if (reducedMotion) {
    pointer.active = false
    hoverNeck = false
    return
  }

  const point = canvasPoint(event.clientX, event.clientY)
  if (!point) {
    pointer.active = false
    hoverNeck = false
    return
  }

  pointer.x = point.x
  pointer.y = point.y
  pointer.active = true

  const withinX = Math.abs(point.x - centerX) < neckHalfWidth * 4
  const withinY = point.y > neckTopY - 24 && point.y < neckBottomY + 24
  hoverNeck = withinX && withinY
}

function handlePointerDown(event: PointerEvent): void {
  if (reducedMotion) return
  if (phase !== 'pouring' || earlyFlipUsed) return

  const point = canvasPoint(event.clientX, event.clientY)
  if (!point) return

  const top = bulbs[topBulbIndex]
  if (!top) return

  // Early flip: drain the reservoir and any grains mid-air, then fall through to the
  // same settle -> flip sequence a natural pour completion uses. Rate-limited to once
  // per pour so a click storm cannot turn this into a toy that fights its own cadence.
  top.reservoir = 0
  inFlight.length = 0
  phase = 'settling'
  settleElapsed = 0
  earlyFlipUsed = true
}

function resizeCanvas(): void {
  const canvas = canvasRef.value
  if (!canvas || !context) return

  const rect = canvas.getBoundingClientRect()
  width = Math.max(1, rect.width)
  height = Math.max(1, rect.height)

  const pixelRatio = Math.min(window.devicePixelRatio || 1, 2)
  canvas.width = Math.round(width * pixelRatio)
  canvas.height = Math.round(height * pixelRatio)
  context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0)

  centerX = width / 2
  centerY = height / 2
  bulbRadius = clamp(Math.min(width, height) * 0.2, 34, 130)
  neckHalfWidth = bulbRadius * Math.sin(GAP_HALF_ANGLE)

  const neckGap = bulbRadius * 0.42
  topBulbCenterY = centerY - bulbRadius - neckGap / 2
  bottomBulbCenterY = centerY + bulbRadius + neckGap / 2
  neckTopY = topBulbCenterY + bulbRadius * Math.cos(GAP_HALF_ANGLE)
  neckBottomY = bottomBulbCenterY - bulbRadius * Math.cos(GAP_HALF_ANGLE)

  bandWidth = bulbRadius * 1.15
  binWidth = bandWidth / BIN_COUNT
  grainHeight = Math.max(1.5, bulbRadius * 0.045)
  reposeThreshold = grainHeight * 3
  maxBinHeight = bulbRadius * 1.2

  glassPath = buildGlassPath()

  resetState()
}

function handleMotionPreference(event: MediaQueryListEvent): void {
  reducedMotion = event.matches
  resetState()
}

onMounted(() => {
  const canvas = canvasRef.value
  if (!canvas) return

  context = canvas.getContext('2d', { alpha: true })
  if (!context) return

  motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
  reducedMotion = motionQuery.matches
  motionQuery.addEventListener('change', handleMotionPreference)

  resizeObserver = new ResizeObserver(resizeCanvas)
  resizeObserver.observe(canvas)
  resizeCanvas()

  window.addEventListener('pointermove', handlePointerMove, { passive: true })
  window.addEventListener('pointerdown', handlePointerDown, { passive: true })

  animationFrameId = window.requestAnimationFrame(renderFrame)
})

onBeforeUnmount(() => {
  if (animationFrameId !== null) {
    window.cancelAnimationFrame(animationFrameId)
  }

  resizeObserver?.disconnect()
  motionQuery?.removeEventListener('change', handleMotionPreference)
  window.removeEventListener('pointermove', handlePointerMove)
  window.removeEventListener('pointerdown', handlePointerDown)

  animationFrameId = null
  resizeObserver = null
  motionQuery = null
  context = null
  glassPath = null
  inFlight.length = 0
  staticPile = []
})
</script>

<style scoped>
.hourglass-cascade {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  opacity: 0.92;
  transform: translateZ(0);
}

@media (prefers-reduced-motion: reduce) {
  .hourglass-cascade {
    opacity: 0.55;
  }
}
</style>
