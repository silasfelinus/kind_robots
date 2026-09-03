<!-- /components/screenfx/tapestry-loom.vue -->
<template>
  <canvas ref="canvasRef" class="tapestry-loom" />
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'

type Motif = 'stripes' | 'chevron' | 'diamond'
type AnchorSide = 'left' | 'right'
type Phase = 'weaving' | 'holding' | 'unraveling'

interface Segment {
  x1: number
  y1: number
  x2: number
  y2: number
  hue: number
}

interface RowRecord {
  rowIndex: number
  segments: Segment[]
}

interface PointerState {
  x: number
  y: number
  active: boolean
}

interface Pluck {
  rowIndex: number
  y: number
  x1: number
  x2: number
  startedAt: number
  life: number
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

// Deterministic pattern/palette rotation -- no randomness in state progression, per the
// pitch's own acceptance criterion ("row count and motif progression are state-driven and
// deterministic, not randomized per frame").
const MOTIFS: readonly Motif[] = ['stripes', 'chevron', 'diamond']
const PALETTES: readonly (readonly number[])[] = [
  [8, 28, 350, 45],
  [200, 218, 165, 42],
  [276, 320, 48, 132],
  [18, 158, 262, 338],
]

// Fixed regardless of viewport, per the pitch's performance_risk note.
const WARP_COUNT = 28
const ROWS_PER_MOTIF = 16
const GAP_COUNT = WARP_COUNT - 1
const WEAVE_AMP = 3.2
const SHUTTLE_ROW_DURATION = 850
const HOVER_SLOWDOWN = 1.9
const HOLD_DURATION = 1500
const RETRACT_ROW_DURATION = 480
const TOP_MARGIN = 64
const BOTTOM_MARGIN = 28
const SIDE_MARGIN = 36
const PLUCK_LIFE = 750
const MAX_PLUCKS = 2

let phase: Phase = 'weaving'
let phaseElapsed = 0
let cycleCount = 0
let motif: Motif = MOTIFS[0] ?? 'stripes'
let paletteHues: readonly number[] = PALETTES[0] ?? [30]
let currentRowIndex = 0
const bakedRows: RowRecord[] = []
const plucks: Pluck[] = []

let warpX: number[] = []
let rowTopY = TOP_MARGIN
let rowHeight = 20

let bufferCanvas: HTMLCanvasElement | null = null
let bufferContext: CanvasRenderingContext2D | null = null
let bufferDirty = true

let staticRows: RowRecord[] = []
let staticBuilt = false

const pointer: PointerState = { x: 0, y: 0, active: false }

function segmentHue(
  currentMotif: Motif,
  hues: readonly number[],
  rowIndex: number,
  colIndex: number,
): number {
  const fallback = hues[0] ?? 0
  if (hues.length === 0) return 0

  if (currentMotif === 'stripes') {
    return hues[rowIndex % hues.length] ?? fallback
  }

  if (currentMotif === 'chevron') {
    const center = GAP_COUNT / 2
    const distance = Math.round(Math.abs(colIndex - center))
    return hues[(distance + rowIndex) % hues.length] ?? fallback
  }

  const centerCol = GAP_COUNT / 2
  const centerRow = (ROWS_PER_MOTIF - 1) / 2
  const distance = Math.round(
    Math.abs(colIndex - centerCol) + Math.abs(rowIndex - centerRow),
  )
  const band = Math.floor(distance / 1.4)
  return hues[band % hues.length] ?? fallback
}

function buildRowSegments(
  currentMotif: Motif,
  hues: readonly number[],
  rowIndex: number,
): Segment[] {
  const y = rowTopY + rowIndex * rowHeight
  const segments: Segment[] = []

  for (let col = 0; col < GAP_COUNT; col += 1) {
    const parity = (col + rowIndex) % 2
    const offsetY = parity === 0 ? -WEAVE_AMP : WEAVE_AMP
    const x1 = warpX[col] ?? 0
    const x2 = warpX[col + 1] ?? x1

    segments.push({
      x1,
      y1: y + offsetY,
      x2,
      y2: y + offsetY,
      hue: segmentHue(currentMotif, hues, rowIndex, col),
    })
  }

  return segments
}

function buildStaticTapestry(): void {
  staticRows = []
  const hues = PALETTES[0] ?? [30]
  for (let r = 0; r < ROWS_PER_MOTIF; r += 1) {
    staticRows.push({
      rowIndex: r,
      segments: buildRowSegments('stripes', hues, r),
    })
  }
  staticBuilt = true
}

function drawRowSegments(
  ctx: CanvasRenderingContext2D,
  segments: Segment[],
  fraction: number,
  anchorSide: AnchorSide,
  highlight: boolean,
  hueShift: number = 0,
): void {
  const total = segments.length
  const visibleCount = Math.round(Math.min(1, Math.max(0, fraction)) * total)
  if (visibleCount <= 0) return

  const slice =
    anchorSide === 'left'
      ? segments.slice(0, visibleCount)
      : segments.slice(total - visibleCount)

  ctx.save()
  ctx.lineCap = 'round'
  for (const seg of slice) {
    const lightness = highlight ? 68 : 54
    const alpha = highlight ? 0.98 : 0.86
    ctx.strokeStyle = `hsla(${seg.hue + hueShift}, 62%, ${lightness}%, ${alpha})`
    ctx.lineWidth = highlight ? 4.2 : 3
    if (highlight) {
      ctx.shadowColor = `hsla(${seg.hue + hueShift}, 80%, 60%, 0.6)`
      ctx.shadowBlur = 5
    } else {
      ctx.shadowBlur = 0
    }
    ctx.beginPath()
    ctx.moveTo(seg.x1, seg.y1)
    ctx.lineTo(seg.x2, seg.y2)
    ctx.stroke()
  }
  ctx.restore()
}

function drawWarp(ctx: CanvasRenderingContext2D): void {
  ctx.save()
  ctx.strokeStyle = 'rgba(214, 200, 178, 0.35)'
  ctx.lineWidth = 1
  for (const x of warpX) {
    ctx.beginPath()
    ctx.moveTo(x, rowTopY - 18)
    ctx.lineTo(x, rowTopY + ROWS_PER_MOTIF * rowHeight + 4)
    ctx.stroke()
  }
  ctx.restore()
}

function drawBobbin(ctx: CanvasRenderingContext2D, hue: number): void {
  const bx = SIDE_MARGIN - 14
  const by = rowTopY - 32

  ctx.save()
  ctx.strokeStyle = `hsla(${hue}, 55%, 55%, 0.8)`
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(bx - 10, by)
  ctx.lineTo(bx + 10, by)
  ctx.stroke()

  ctx.beginPath()
  ctx.strokeStyle = `hsla(${hue}, 60%, 62%, 0.9)`
  ctx.arc(bx, by, 9, 0, Math.PI * 2)
  ctx.stroke()
  ctx.restore()
}

function drawShuttle(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
): void {
  ctx.save()
  ctx.fillStyle = 'rgba(255, 248, 224, 0.92)'
  ctx.strokeStyle = 'rgba(90, 62, 30, 0.8)'
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.ellipse(x, y, 6, 3, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.stroke()
  ctx.restore()
}

function drawPlucks(ctx: CanvasRenderingContext2D, timestamp: number): void {
  for (let index = plucks.length - 1; index >= 0; index -= 1) {
    const pluck = plucks[index]
    if (!pluck) continue

    const age = timestamp - pluck.startedAt
    if (age >= pluck.life) {
      plucks.splice(index, 1)
      continue
    }

    const progress = age / pluck.life
    const decay = 1 - progress
    const amplitude = 7 * decay
    const wavelength = 46
    const steps = 32
    const span = pluck.x2 - pluck.x1

    ctx.save()
    ctx.globalAlpha = decay * 0.85
    ctx.strokeStyle = 'rgba(255, 244, 214, 0.9)'
    ctx.lineWidth = 1.6
    ctx.beginPath()
    for (let step = 0; step <= steps; step += 1) {
      const t = step / steps
      const x = pluck.x1 + span * t
      const y =
        pluck.y + Math.sin((t * span) / wavelength + progress * 18) * amplitude
      if (step === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    }
    ctx.stroke()
    ctx.restore()
  }
}

function redrawBuffer(): void {
  if (!bufferContext) return

  bufferContext.clearRect(0, 0, width, height)

  // The row currently retracting is drawn live every frame (its visible fraction changes
  // continuously); every other settled row only needs to be re-baked when the row set
  // itself changes, not on every frame.
  const startIndex = phase === 'unraveling' ? 1 : 0
  for (let i = startIndex; i < bakedRows.length; i += 1) {
    const row = bakedRows[i]
    if (row) drawRowSegments(bufferContext, row.segments, 1, 'left', false)
  }

  bufferDirty = false
}

function hoveredRowAt(pointerY: number): number {
  if (!pointer.active) return -1
  const relative = (pointerY - rowTopY) / rowHeight
  const candidate = Math.round(relative)
  return candidate >= 0 && candidate < ROWS_PER_MOTIF ? candidate : -1
}

function renderFrame(timestamp: number): void {
  if (!context) return

  const elapsed = previousTimestamp ? timestamp - previousTimestamp : 16.67
  previousTimestamp = timestamp
  const delta = Math.min(48, Math.max(4, elapsed))
  simTime += delta

  context.clearRect(0, 0, width, height)

  if (reducedMotion) {
    if (!staticBuilt) buildStaticTapestry()
    const hueShift = Math.sin(simTime * 0.00002) * 8
    drawWarp(context)
    drawBobbin(context, (PALETTES[0]?.[0] ?? 20) + hueShift)
    for (const row of staticRows) {
      drawRowSegments(context, row.segments, 1, 'left', false, hueShift)
    }
    animationFrameId = window.requestAnimationFrame(renderFrame)
    return
  }

  if (bufferDirty && bufferContext) redrawBuffer()

  drawWarp(context)
  drawBobbin(context, paletteHues[0] ?? 20)
  if (bufferCanvas) context.drawImage(bufferCanvas, 0, 0, width, height)

  const hoveredRowIndex = hoveredRowAt(pointer.y)
  if (hoveredRowIndex >= 0) {
    const hoveredRow = bakedRows.find((row) => row.rowIndex === hoveredRowIndex)
    if (hoveredRow)
      drawRowSegments(context, hoveredRow.segments, 1, 'left', true)
  }

  if (phase === 'weaving') {
    phaseElapsed += delta / (pointer.active ? HOVER_SLOWDOWN : 1)
    const shuttleProgress = Math.min(1, phaseElapsed / SHUTTLE_ROW_DURATION)
    const anchorSide: AnchorSide = currentRowIndex % 2 === 0 ? 'left' : 'right'
    const rowSegments = buildRowSegments(motif, paletteHues, currentRowIndex)
    const highlighted = hoveredRowIndex === currentRowIndex
    drawRowSegments(
      context,
      rowSegments,
      shuttleProgress,
      anchorSide,
      highlighted,
    )

    const visibleCount = Math.round(shuttleProgress * rowSegments.length)
    const rowY = rowTopY + currentRowIndex * rowHeight
    const shuttleX =
      anchorSide === 'left'
        ? (rowSegments[Math.min(rowSegments.length - 1, visibleCount)]?.x1 ??
          warpX[warpX.length - 1] ??
          0)
        : (rowSegments[Math.max(0, rowSegments.length - 1 - visibleCount)]
            ?.x2 ??
          warpX[0] ??
          0)
    drawShuttle(context, shuttleX, rowY)

    if (shuttleProgress >= 1) {
      bakedRows.push({ rowIndex: currentRowIndex, segments: rowSegments })
      bufferDirty = true
      currentRowIndex += 1
      phaseElapsed = 0
      if (currentRowIndex >= ROWS_PER_MOTIF) phase = 'holding'
    }
  } else if (phase === 'holding') {
    phaseElapsed += delta
    if (phaseElapsed >= HOLD_DURATION) {
      phase = 'unraveling'
      phaseElapsed = 0
    }
  } else {
    phaseElapsed += delta
    const retractProgress = Math.min(1, phaseElapsed / RETRACT_ROW_DURATION)
    const front = bakedRows[0]
    if (front) {
      const visibleFraction = 1 - retractProgress
      const highlighted = hoveredRowIndex === front.rowIndex
      drawRowSegments(
        context,
        front.segments,
        visibleFraction,
        'left',
        highlighted,
      )
    }

    if (retractProgress >= 1) {
      bakedRows.shift()
      bufferDirty = true
      phaseElapsed = 0
      if (bakedRows.length === 0) {
        cycleCount += 1
        motif = MOTIFS[cycleCount % MOTIFS.length] ?? 'stripes'
        paletteHues = PALETTES[cycleCount % PALETTES.length] ??
          PALETTES[0] ?? [30]
        currentRowIndex = 0
        phase = 'weaving'
      }
    }
  }

  drawPlucks(context, timestamp)

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
}

function handlePointerDown(event: PointerEvent): void {
  if (reducedMotion) return

  const point = canvasPoint(event.clientX, event.clientY)
  if (!point) return

  const candidates: { rowIndex: number; y: number }[] = bakedRows.map(
    (row) => ({
      rowIndex: row.rowIndex,
      y: rowTopY + row.rowIndex * rowHeight,
    }),
  )

  if (phase === 'weaving') {
    candidates.push({
      rowIndex: currentRowIndex,
      y: rowTopY + currentRowIndex * rowHeight,
    })
  }

  let nearest: { rowIndex: number; y: number } | null = null
  let nearestDistance = Infinity
  for (const candidate of candidates) {
    const distance = Math.abs(candidate.y - point.y)
    if (distance < nearestDistance) {
      nearestDistance = distance
      nearest = candidate
    }
  }

  if (!nearest || nearestDistance > rowHeight * 1.6) return

  if (plucks.length >= MAX_PLUCKS) plucks.shift()

  const first = warpX[0] ?? 0
  const last = warpX[warpX.length - 1] ?? first
  plucks.push({
    rowIndex: nearest.rowIndex,
    y: nearest.y,
    x1: first,
    x2: last,
    startedAt: performance.now(),
    life: PLUCK_LIFE,
  })
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

  if (!bufferCanvas) {
    bufferCanvas = document.createElement('canvas')
    bufferContext = bufferCanvas.getContext('2d')
  }
  if (bufferCanvas && bufferContext) {
    bufferCanvas.width = canvas.width
    bufferCanvas.height = canvas.height
    bufferContext.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0)
  }

  const usableWidth = Math.max(40, width - SIDE_MARGIN * 2)
  warpX = []
  for (let i = 0; i < WARP_COUNT; i += 1) {
    warpX.push(SIDE_MARGIN + (usableWidth * i) / Math.max(1, WARP_COUNT - 1))
  }

  const usableHeight = Math.max(40, height - TOP_MARGIN - BOTTOM_MARGIN)
  rowHeight = usableHeight / ROWS_PER_MOTIF
  rowTopY = TOP_MARGIN

  bakedRows.length = 0
  plucks.length = 0
  currentRowIndex = 0
  phase = 'weaving'
  phaseElapsed = 0
  bufferDirty = true
  staticBuilt = false

  if (reducedMotion) buildStaticTapestry()
}

function handleMotionPreference(event: MediaQueryListEvent): void {
  reducedMotion = event.matches
  bakedRows.length = 0
  plucks.length = 0
  currentRowIndex = 0
  phase = 'weaving'
  phaseElapsed = 0
  bufferDirty = true
  staticBuilt = false

  if (reducedMotion) buildStaticTapestry()
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
  bufferCanvas = null
  bufferContext = null
  bakedRows.length = 0
  plucks.length = 0
  staticRows = []
})
</script>

<style scoped>
.tapestry-loom {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  opacity: 0.92;
  transform: translateZ(0);
}

@media (prefers-reduced-motion: reduce) {
  .tapestry-loom {
    opacity: 0.55;
  }
}
</style>
