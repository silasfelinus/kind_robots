<!-- /components/screenfx/candlelit-reliquary.vue -->
<template>
  <canvas ref="canvasRef" class="candlelit-reliquary" />
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'

type CandlePhase = 'burning' | 'guttering' | 'relighting'

interface Candle {
  centerX: number
  heightFraction: number
  phase: CandlePhase
  burnDurationMs: number
  burnElapsedMs: number
  guttterElapsedMs: number
  relightElapsedMs: number
  flicker: number
  flameBend: number
  wickSeed: number
  forcedDripUsed: boolean
  pool: number[]
}

interface Drip {
  candleIndex: number
  x: number
  driftX: number
  y: number
  startedAt: number
  bin: number
}

const canvasRef = ref<HTMLCanvasElement | null>(null)

let context: CanvasRenderingContext2D | null = null
let resizeObserver: ResizeObserver | null = null
let motionQuery: MediaQueryList | null = null
let animationFrameId: number | null = null
let width = 1
let height = 1
let previousTimestamp = 0
let reducedMotion = false
let simTime = 0

// Fixed regardless of viewport or elapsed session time, per the pitch's
// performance_risk note: candle count, per-candle pool bin count, and the
// shared in-flight drip pool all stay constant.
const CANDLE_COUNT = 4
const POOL_BINS = 8
const MAX_IN_FLIGHT_DRIPS = 16
const STUB_HEIGHT_FRACTION = 0.22
const GUTTER_MS = 480
const RELIGHT_MS = 2000
const DRIP_FALL_MS = 900
const DRIP_DEPOSIT = 2.2
const POOL_DECAY_PER_MS = 0.00028
const POOL_SMOOTH_RATE = 0.02

let ledgeY = 0
let candleWidth = 20
let maxCandleHeight = 120
let poolBinWidth = 0
let maxPoolHeight = 26

const candles: Candle[] = []
const inFlight: Drip[] = []

const pointer = { x: 0, y: 0, active: false }

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

function easeInOutCubic(t: number): number {
  const clamped = clamp(t, 0, 1)
  return clamped < 0.5
    ? 4 * clamped * clamped * clamped
    : 1 - Math.pow(-2 * clamped + 2, 3) / 2
}

function randomBetween(min: number, max: number): number {
  return min + Math.random() * (max - min)
}

function createCandle(index: number): Candle {
  return {
    centerX: 0,
    heightFraction: randomBetween(0.45, 1),
    phase: 'burning',
    burnDurationMs: randomBetween(14000, 21000),
    burnElapsedMs: randomBetween(0, 6000),
    guttterElapsedMs: 0,
    relightElapsedMs: 0,
    flicker: 0,
    flameBend: 0,
    wickSeed: index * 91.7 + randomBetween(0, 40),
    forcedDripUsed: false,
    pool: new Array(POOL_BINS).fill(0),
  }
}

function resetState(): void {
  candles.length = 0
  for (let i = 0; i < CANDLE_COUNT; i += 1) {
    candles.push(createCandle(i))
  }
  inFlight.length = 0
}

function layoutCandles(): void {
  const usableWidth = width * 0.72
  const left = width * 0.14
  const gap = usableWidth / (CANDLE_COUNT - 1 || 1)
  candles.forEach((candle, index) => {
    candle.centerX = CANDLE_COUNT > 1 ? left + gap * index : width / 2
  })
}

function candleTopY(candle: Candle): number {
  return ledgeY - maxCandleHeight * candle.heightFraction
}

function poolBaseY(): number {
  return ledgeY
}

function spawnDrip(
  candle: Candle,
  candleIndex: number,
  timestamp: number,
): void {
  if (inFlight.length >= MAX_IN_FLIGHT_DRIPS) return

  const bin = clamp(Math.floor(randomBetween(0, POOL_BINS)), 0, POOL_BINS - 1)
  inFlight.push({
    candleIndex,
    x: candle.centerX,
    driftX: randomBetween(-1.4, 1.4),
    y: candleTopY(candle) + 6,
    startedAt: timestamp,
    bin,
  })
}

function maybeSpawnDrips(timestamp: number, delta: number): void {
  for (let index = 0; index < candles.length; index += 1) {
    const candle = candles[index]
    if (!candle || candle.phase !== 'burning') continue

    // Slow, irregular rate: an independent per-frame chance rather than a fixed
    // interval, scaled by delta so the expected rate is frame-rate independent.
    const chance = (delta / 1000) * 0.22
    if (Math.random() < chance) {
      spawnDrip(candle, index, timestamp)
    }
  }
}

function updateInFlight(timestamp: number): void {
  for (let i = inFlight.length - 1; i >= 0; i -= 1) {
    const drip = inFlight[i]
    if (!drip) continue

    const candle = candles[drip.candleIndex]
    if (!candle) {
      inFlight.splice(i, 1)
      continue
    }

    const progress = clamp((timestamp - drip.startedAt) / DRIP_FALL_MS, 0, 1)
    const top = candleTopY(candle) + 6
    const bottom = poolBaseY()
    drip.y = top + progress * (bottom - top)
    drip.x = candle.centerX + drip.driftX * progress

    if (progress >= 1) {
      candle.pool[drip.bin] = (candle.pool[drip.bin] ?? 0) + DRIP_DEPOSIT
      inFlight.splice(i, 1)
    }
  }
}

function relaxPools(delta: number): void {
  const decay = POOL_DECAY_PER_MS * delta
  for (const candle of candles) {
    const pool = candle.pool
    const next = pool.slice()
    for (let i = 0; i < POOL_BINS; i += 1) {
      const left = pool[i > 0 ? i - 1 : i] ?? 0
      const right = pool[i < POOL_BINS - 1 ? i + 1 : i] ?? 0
      const here = pool[i] ?? 0
      const neighborAverage = (left + right) / 2
      const smoothed = here + (neighborAverage - here) * POOL_SMOOTH_RATE
      next[i] = Math.max(0, smoothed - decay)
    }
    for (let i = 0; i < POOL_BINS; i += 1) {
      pool[i] = clamp(next[i] ?? 0, 0, maxPoolHeight)
    }
  }
}

function advanceCandle(candle: Candle, delta: number): void {
  candle.flicker += delta
  candle.flameBend += (0 - candle.flameBend) * Math.min(1, delta / 140)

  if (candle.phase === 'burning') {
    candle.burnElapsedMs += delta
    const remaining = 1 - candle.burnElapsedMs / candle.burnDurationMs
    candle.heightFraction = clamp(
      STUB_HEIGHT_FRACTION + remaining * (1 - STUB_HEIGHT_FRACTION),
      STUB_HEIGHT_FRACTION,
      1,
    )
    if (candle.burnElapsedMs >= candle.burnDurationMs) {
      candle.phase = 'guttering'
      candle.guttterElapsedMs = 0
    }
    return
  }

  if (candle.phase === 'guttering') {
    candle.guttterElapsedMs += delta
    if (candle.guttterElapsedMs >= GUTTER_MS) {
      candle.phase = 'relighting'
      candle.relightElapsedMs = 0
    }
    return
  }

  // relighting
  candle.relightElapsedMs += delta
  const progress = easeInOutCubic(candle.relightElapsedMs / RELIGHT_MS)
  candle.heightFraction = clamp(
    STUB_HEIGHT_FRACTION + progress * (1 - STUB_HEIGHT_FRACTION),
    STUB_HEIGHT_FRACTION,
    1,
  )
  if (candle.relightElapsedMs >= RELIGHT_MS) {
    candle.phase = 'burning'
    candle.burnElapsedMs = 0
    candle.burnDurationMs = randomBetween(14000, 21000)
    candle.forcedDripUsed = false
  }
}

function flameAlpha(candle: Candle): number {
  if (candle.phase === 'guttering') {
    return Math.max(0, 1 - candle.guttterElapsedMs / GUTTER_MS)
  }
  if (candle.phase === 'relighting') {
    // Flame stays out until the taper has risen most of the way back up.
    return candle.relightElapsedMs > RELIGHT_MS * 0.7
      ? clamp((candle.relightElapsedMs / RELIGHT_MS - 0.7) / 0.3, 0, 1)
      : 0
  }
  return 1
}

function drawLedge(ctx: CanvasRenderingContext2D): void {
  ctx.save()
  ctx.fillStyle = 'rgba(58, 46, 38, 0.55)'
  ctx.fillRect(0, ledgeY, width, Math.max(6, height * 0.03))
  ctx.restore()
}

function drawPool(ctx: CanvasRenderingContext2D, candle: Candle): void {
  const left = candle.centerX - (poolBinWidth * POOL_BINS) / 2
  ctx.save()
  ctx.beginPath()
  ctx.moveTo(left, ledgeY)
  for (let i = 0; i < POOL_BINS; i += 1) {
    const xCenter = left + (i + 0.5) * poolBinWidth
    ctx.lineTo(xCenter, ledgeY - (candle.pool[i] ?? 0))
  }
  ctx.lineTo(left + poolBinWidth * POOL_BINS, ledgeY)
  ctx.closePath()
  ctx.fillStyle = 'rgba(214, 190, 140, 0.82)'
  ctx.fill()
  ctx.restore()
}

function drawCandleBody(ctx: CanvasRenderingContext2D, candle: Candle): void {
  const topY = candleTopY(candle)
  ctx.save()
  ctx.fillStyle = 'rgba(230, 214, 180, 0.92)'
  ctx.fillRect(
    candle.centerX - candleWidth / 2,
    topY,
    candleWidth,
    ledgeY - topY,
  )
  ctx.restore()
}

function drawFlame(
  ctx: CanvasRenderingContext2D,
  candle: Candle,
  hueShift: number,
): void {
  const alpha = flameAlpha(candle)
  if (alpha <= 0.01) return

  const wickX = candle.centerX + candle.flameBend
  const wickY = candleTopY(candle)
  const flicker = reducedMotion
    ? 0
    : Math.sin(candle.flicker * 0.012 + candle.wickSeed) * 1.4 +
      Math.sin(candle.flicker * 0.031 + candle.wickSeed * 1.7) * 0.8
  const flameHeight = 16 + flicker

  ctx.save()
  ctx.globalAlpha = alpha
  ctx.translate(wickX, wickY)

  const gradient = ctx.createRadialGradient(
    0,
    -flameHeight * 0.4,
    1,
    0,
    -flameHeight * 0.4,
    flameHeight,
  )
  gradient.addColorStop(0, `hsla(${48 + hueShift}, 100%, 82%, 0.95)`)
  gradient.addColorStop(0.55, `hsla(${34 + hueShift}, 100%, 62%, 0.85)`)
  gradient.addColorStop(1, 'hsla(20, 90%, 40%, 0)')

  ctx.beginPath()
  ctx.moveTo(0, 2)
  ctx.quadraticCurveTo(6, -flameHeight * 0.45, 0, -flameHeight)
  ctx.quadraticCurveTo(-6, -flameHeight * 0.45, 0, 2)
  ctx.closePath()
  ctx.fillStyle = gradient
  ctx.fill()

  ctx.restore()
}

function drawDrips(ctx: CanvasRenderingContext2D): void {
  ctx.save()
  ctx.fillStyle = 'rgba(224, 200, 150, 0.9)'
  for (const drip of inFlight) {
    ctx.beginPath()
    ctx.arc(drip.x, drip.y, 1.6, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.restore()
}

function buildStaticPools(): void {
  candles.forEach((candle, index) => {
    for (let i = 0; i < POOL_BINS; i += 1) {
      const distance = Math.abs(i - (POOL_BINS - 1) / 2) / ((POOL_BINS - 1) / 2)
      candle.pool[i] = Math.max(
        0,
        maxPoolHeight * 0.35 * (1 - distance * distance),
      )
    }
    candle.heightFraction = clamp(
      0.4 + ((index * 37) % 60) / 100,
      STUB_HEIGHT_FRACTION,
      1,
    )
  })
}

function drawStaticFrame(ctx: CanvasRenderingContext2D): void {
  drawLedge(ctx)
  const glowShift = Math.sin(simTime * 0.00015) * 4
  for (const candle of candles) {
    drawPool(ctx, candle)
    drawCandleBody(ctx, candle)

    ctx.save()
    ctx.globalAlpha = 0.85
    ctx.translate(candle.centerX, candleTopY(candle))
    const gradient = ctx.createRadialGradient(0, -8, 1, 0, -8, 16)
    gradient.addColorStop(0, `hsla(${48 + glowShift}, 100%, 82%, 0.95)`)
    gradient.addColorStop(0.55, `hsla(${34 + glowShift}, 100%, 62%, 0.85)`)
    gradient.addColorStop(1, 'hsla(20, 90%, 40%, 0)')
    ctx.beginPath()
    ctx.moveTo(0, 2)
    ctx.quadraticCurveTo(6, -8, 0, -16)
    ctx.quadraticCurveTo(-6, -8, 0, 2)
    ctx.closePath()
    ctx.fillStyle = gradient
    ctx.fill()
    ctx.restore()
  }
}

function drawScene(ctx: CanvasRenderingContext2D, hueShift: number): void {
  drawLedge(ctx)
  for (const candle of candles) {
    drawPool(ctx, candle)
    drawCandleBody(ctx, candle)
  }
  drawDrips(ctx)
  for (const candle of candles) {
    drawFlame(ctx, candle, hueShift)
  }
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

  for (const candle of candles) {
    advanceCandle(candle, delta)
  }
  maybeSpawnDrips(timestamp, delta)
  updateInFlight(timestamp)
  relaxPools(delta)

  const hueShift = Math.sin(simTime * 0.00004) * 3
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
    return
  }

  const point = canvasPoint(event.clientX, event.clientY)
  if (!point) {
    pointer.active = false
    return
  }

  pointer.x = point.x
  pointer.y = point.y
  pointer.active = true

  for (const candle of candles) {
    const flameX = candle.centerX
    const flameY = candleTopY(candle) - 8
    const distance = Math.hypot(point.x - flameX, point.y - flameY)
    const proximityRange = candleWidth * 3.5
    if (distance < proximityRange) {
      const direction = flameX >= point.x ? 1 : -1
      const strength = 1 - distance / proximityRange
      candle.flameBend = direction * strength * 6
    }
  }
}

function handlePointerDown(event: PointerEvent): void {
  if (reducedMotion) return

  const point = canvasPoint(event.clientX, event.clientY)
  if (!point) return

  for (let index = 0; index < candles.length; index += 1) {
    const candle = candles[index]
    if (!candle) continue
    if (candle.phase !== 'burning' || candle.forcedDripUsed) continue

    const withinX = Math.abs(point.x - candle.centerX) < candleWidth * 2.5
    if (!withinX) continue

    spawnDrip(candle, index, performance.now())
    candle.forcedDripUsed = true
    break
  }
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

  ledgeY = height * 0.78
  maxCandleHeight = clamp(height * 0.32, 60, 180)
  candleWidth = clamp(Math.min(width, height) * 0.03, 10, 26)
  maxPoolHeight = maxCandleHeight * 0.22
  poolBinWidth = (candleWidth * 2.6) / POOL_BINS

  resetState()
  layoutCandles()
  if (reducedMotion) buildStaticPools()
}

function handleMotionPreference(event: MediaQueryListEvent): void {
  reducedMotion = event.matches
  resetState()
  layoutCandles()
  if (reducedMotion) buildStaticPools()
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
  candles.length = 0
  inFlight.length = 0
})
</script>

<style scoped>
.candlelit-reliquary {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  opacity: 0.92;
  transform: translateZ(0);
}

@media (prefers-reduced-motion: reduce) {
  .candlelit-reliquary {
    opacity: 0.55;
  }
}
</style>
