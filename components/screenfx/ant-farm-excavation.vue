<!-- /components/screenfx/ant-farm-excavation.vue -->
<template>
  <canvas ref="canvasRef" class="ant-farm-excavation" />
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'

type AntMode = 'digging' | 'moving'

interface Ant {
  col: number
  row: number
  x: number
  y: number
  targetCol: number
  targetRow: number
  mode: AntMode
  digProgress: number
  speed: number
  fromCol: number
  fromRow: number
}

interface CollapseFlash {
  col: number
  row: number
  startedAt: number
}

interface Trinket {
  col: number
  row: number
  kind: number
  revealedAt: number
}

interface PointerState {
  x: number
  y: number
  active: boolean
}

const TRINKET_COLORS = ['#fbbf24', '#f472b6', '#7dd3fc', '#a3e635']
const START_CHAMBER_ROW_FRACTION = 0.08
const OPEN_THRESHOLD = 0.82
const DIG_COMPLETE = 1
const OBSTACLE_LEVEL = 0.28
const TRINKET_COOLDOWN_MS = 60000

const canvasRef = ref<HTMLCanvasElement | null>(null)

let animationFrameId: number | null = null
let resizeObserver: ResizeObserver | null = null
let motionQuery: MediaQueryList | null = null
let context: CanvasRenderingContext2D | null = null
let width = 1
let height = 1
let previousTimestamp = 0
let reducedMotion = false

let cols = 0
let rows = 0
let cellSize = 18
let openness = new Float32Array(0)
let lastVisited = new Float32Array(0)
let hasTrinket = new Uint8Array(0)

const ants: Ant[] = []
const flashes: CollapseFlash[] = []
const trinkets: Trinket[] = []
const pointer: PointerState = { x: 0, y: 0, active: false }
let lastTrinketRevealAt = 0
let lastTrinketKind = -1

function randomBetween(min: number, max: number): number {
  return min + Math.random() * (max - min)
}

function cellIndex(col: number, row: number): number {
  return row * cols + col
}

function inBounds(col: number, row: number): boolean {
  return col >= 0 && col < cols && row >= 0 && row < rows
}

function computeGrid(): { cols: number; rows: number; cellSize: number } {
  const targetCells = reducedMotion ? 220 : 620
  const rawCellSize = Math.sqrt((width * height) / targetCells)
  const size = Math.min(30, Math.max(12, rawCellSize))

  return {
    cols: Math.max(10, Math.ceil(width / size) + 1),
    rows: Math.max(10, Math.ceil(height / size) + 1),
    cellSize: size,
  }
}

function antCount(): number {
  return reducedMotion ? 4 : Math.round(Math.min(9, Math.max(5, cols / 4)))
}

function cellCenter(col: number, row: number): { x: number; y: number } {
  return { x: col * cellSize + cellSize / 2, y: row * cellSize + cellSize / 2 }
}

function seedTrinkets(count: number): void {
  let attempts = 0
  let placed = 0
  const minRow = Math.max(2, Math.round(rows * START_CHAMBER_ROW_FRACTION) + 1)

  while (placed < count && attempts < count * 20) {
    attempts += 1
    const col = Math.floor(randomBetween(1, cols - 1))
    const row = Math.floor(randomBetween(minRow, rows - 1))
    const index = cellIndex(col, row)
    if (hasTrinket[index]) continue
    hasTrinket[index] = 1
    placed += 1
  }
}

function seedGrid(): void {
  const grid = computeGrid()
  cols = grid.cols
  rows = grid.rows
  cellSize = grid.cellSize

  const total = cols * rows
  openness = new Float32Array(total)
  lastVisited = new Float32Array(total)
  hasTrinket = new Uint8Array(total)

  flashes.length = 0
  trinkets.length = 0
  ants.length = 0
  lastTrinketRevealAt = 0
  lastTrinketKind = -1

  const startCol = Math.floor(cols / 2)
  const startRow = Math.max(1, Math.round(rows * START_CHAMBER_ROW_FRACTION))
  const startIndex = cellIndex(startCol, startRow)
  openness[startIndex] = DIG_COMPLETE
  lastVisited[startIndex] = 0

  // A couple of neighboring cells open too, so the colony starts with a small
  // chamber rather than a single dug cell.
  for (const [dc, dr] of [
    [-1, 0],
    [1, 0],
    [0, 1],
  ] as const) {
    const c = startCol + dc
    const r = startRow + dr
    if (!inBounds(c, r)) continue
    openness[cellIndex(c, r)] = DIG_COMPLETE
  }

  seedTrinkets(reducedMotion ? 0 : 6)

  const count = antCount()
  for (let i = 0; i < count; i += 1) {
    const center = cellCenter(startCol, startRow)
    ants.push({
      col: startCol,
      row: startRow,
      fromCol: startCol,
      fromRow: startRow,
      x: center.x,
      y: center.y,
      targetCol: startCol,
      targetRow: startRow,
      mode: 'moving',
      digProgress: 0,
      speed: randomBetween(0.05, 0.09),
    })
  }
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

  const centerCol = Math.floor(point.x / cellSize)
  const centerRow = Math.floor(point.y / cellSize)
  const radius = 1

  for (let dr = -radius; dr <= radius; dr += 1) {
    for (let dc = -radius; dc <= radius; dc += 1) {
      const c = centerCol + dc
      const r = centerRow + dr
      if (!inBounds(c, r)) continue
      const index = cellIndex(c, r)
      // Grain-pile obstacle: partially refills the cell so ants have to route
      // around it, then dig through it like any other undug sand.
      openness[index] = Math.min(openness[index] ?? 0, OBSTACLE_LEVEL)
    }
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

  seedGrid()
}

function neighborsOf(col: number, row: number): Array<[number, number]> {
  const candidates: Array<[number, number]> = [
    [col + 1, row],
    [col - 1, row],
    [col, row + 1],
    [col, row - 1],
  ]
  return candidates.filter(([c, r]) => inBounds(c, r))
}

function isOpen(col: number, row: number): boolean {
  return (openness[cellIndex(col, row)] ?? 0) >= OPEN_THRESHOLD
}

function maybeRevealTrinket(col: number, row: number, timestamp: number): void {
  const index = cellIndex(col, row)
  if (!hasTrinket[index]) return
  if (timestamp - lastTrinketRevealAt < TRINKET_COOLDOWN_MS) return

  hasTrinket[index] = 0
  let kind = Math.floor(Math.random() * TRINKET_COLORS.length)
  if (kind === lastTrinketKind) kind = (kind + 1) % TRINKET_COLORS.length
  lastTrinketKind = kind
  lastTrinketRevealAt = timestamp

  if (trinkets.length >= 4) trinkets.shift()
  trinkets.push({ col, row, kind, revealedAt: timestamp })

  // Keep the well topped up so trinkets keep turning up indefinitely rather
  // than depleting after the first six digs.
  let remaining = 0
  for (let i = 0; i < hasTrinket.length; i += 1) remaining += hasTrinket[i] ?? 0
  if (remaining < 3) seedTrinkets(2)
}

function pickNextTarget(self: Ant): void {
  const neighbors = neighborsOf(self.col, self.row).filter(
    ([c, r]) =>
      !(c === self.fromCol && r === self.fromRow) || Math.random() < 0.15,
  )
  const pool =
    neighbors.length > 0 ? neighbors : neighborsOf(self.col, self.row)
  if (pool.length === 0) return

  let best: [number, number] = pool[0]!
  let bestScore = -Infinity

  for (const [c, r] of pool) {
    const dug = isOpen(c, r)
    let score = Math.random()

    // Prefer frontier digging over re-walking a settled tunnel, so the network
    // keeps branching instead of the colony just pacing existing corridors.
    if (!dug) score += 0.55

    // Soft boundary bias: avoid hugging the very top (surface) or the outer
    // edges so the excavation reads as a column, not a border crawl.
    if (r < 1) score -= 1.4
    if (c <= 0 || c >= cols - 1) score -= 0.6

    if (pointer.active && !reducedMotion) {
      const center = cellCenter(c, r)
      const dx = pointer.x - center.x
      const dy = pointer.y - center.y
      const distance = Math.hypot(dx, dy)
      if (distance < 220) {
        const toward = Math.hypot(
          center.x + dx * 0.01 - pointer.x,
          center.y + dy * 0.01 - pointer.y,
        )
        score += (1 - toward / (distance + 1)) * 0.4
      }
    }

    if (score > bestScore) {
      bestScore = score
      best = [c, r]
    }
  }

  self.fromCol = self.col
  self.fromRow = self.row
  self.targetCol = best[0]
  self.targetRow = best[1]
  self.digProgress = 0
  self.mode = isOpen(best[0], best[1]) ? 'moving' : 'digging'
}

function updateAnt(self: Ant, delta: number, timestamp: number): void {
  if (self.mode === 'digging') {
    const index = cellIndex(self.targetCol, self.targetRow)
    const digRate = (reducedMotion ? 0.0009 : 0.0022) * delta
    const current = openness[index] ?? 0
    const next = Math.min(DIG_COMPLETE, current + digRate)
    openness[index] = next
    self.digProgress = next

    if (next >= DIG_COMPLETE - 0.001) {
      lastVisited[index] = timestamp
      maybeRevealTrinket(self.targetCol, self.targetRow, timestamp)
      self.mode = 'moving'
    }
    return
  }

  const target = cellCenter(self.targetCol, self.targetRow)
  const dx = target.x - self.x
  const dy = target.y - self.y
  const distance = Math.hypot(dx, dy)
  const step = self.speed * delta * cellSize

  if (distance <= step || distance < 0.6) {
    self.x = target.x
    self.y = target.y
    self.col = self.targetCol
    self.row = self.targetRow
    lastVisited[cellIndex(self.col, self.row)] = timestamp
    pickNextTarget(self)
    return
  }

  self.x += (dx / distance) * step
  self.y += (dy / distance) * step
}

function decayGrid(timestamp: number, delta: number): void {
  if (reducedMotion) return

  const decayDelay = 9000
  const decayRate = 0.00007 * delta
  const guarded = new Set<number>()

  for (const self of ants) {
    guarded.add(cellIndex(self.col, self.row))
    guarded.add(cellIndex(self.targetCol, self.targetRow))
  }

  for (let index = 0; index < openness.length; index += 1) {
    const value = openness[index] ?? 0
    if (value < OPEN_THRESHOLD) continue
    if (guarded.has(index)) continue
    if (timestamp - (lastVisited[index] ?? 0) < decayDelay) continue

    const next = value - decayRate
    if (next < OPEN_THRESHOLD && value >= OPEN_THRESHOLD) {
      const col = index % cols
      const row = Math.floor(index / cols)
      flashes.push({ col, row, startedAt: timestamp })
      if (flashes.length > 8) flashes.shift()
    }
    openness[index] = Math.max(0.12, next)
  }
}

function drawCell(col: number, row: number, timestamp: number): void {
  if (!context) return

  const index = cellIndex(col, row)
  const value = openness[index] ?? 0
  const x = col * cellSize
  const y = row * cellSize
  const depthShade = Math.min(1, row / rows)

  if (value >= OPEN_THRESHOLD) {
    context.fillStyle = `hsla(${24 - depthShade * 10}, 18%, ${8 + depthShade * 4}%, 0.92)`
  } else {
    const lightness = 30 + (1 - depthShade) * 18 - value * 12
    context.fillStyle = `hsla(32, 42%, ${Math.max(14, lightness)}%, 1)`
  }
  context.fillRect(x, y, cellSize + 0.6, cellSize + 0.6)

  if (hasTrinket[index] && value > 0.55 && value < OPEN_THRESHOLD) {
    // Half-buried hint of something underneath before it is fully excavated.
    context.fillStyle = 'rgba(250, 204, 21, 0.25)'
    context.beginPath()
    context.arc(
      x + cellSize / 2,
      y + cellSize / 2,
      cellSize * 0.14,
      0,
      Math.PI * 2,
    )
    context.fill()
  }

  for (let i = flashes.length - 1; i >= 0; i -= 1) {
    const flash = flashes[i]!
    if (flash.col !== col || flash.row !== row) continue
    const age = timestamp - flash.startedAt
    if (age > 900) {
      flashes.splice(i, 1)
      continue
    }
    const progress = age / 900
    context.fillStyle = `hsla(38, 60%, 70%, ${(1 - progress) * 0.5})`
    for (let g = 0; g < 3; g += 1) {
      const gx = x + cellSize * (0.2 + 0.3 * g)
      const gy = y + cellSize * Math.min(0.9, 0.15 + progress * 0.8)
      context.beginPath()
      context.arc(gx, gy, 1.4, 0, Math.PI * 2)
      context.fill()
    }
  }
}

function drawTrinket(trinket: Trinket, timestamp: number): void {
  if (!context) return

  const age = timestamp - trinket.revealedAt
  const glow = Math.max(0.35, 1 - age / 20000)
  const center = cellCenter(trinket.col, trinket.row)

  context.save()
  context.translate(center.x, center.y)
  context.fillStyle = TRINKET_COLORS[trinket.kind] ?? '#fbbf24'
  context.globalAlpha = glow
  context.beginPath()
  context.moveTo(0, -cellSize * 0.32)
  context.lineTo(cellSize * 0.28, 0)
  context.lineTo(0, cellSize * 0.32)
  context.lineTo(-cellSize * 0.28, 0)
  context.closePath()
  context.fill()
  context.restore()
}

function drawAnt(self: Ant): void {
  if (!context) return

  context.save()
  context.translate(self.x, self.y)
  context.fillStyle = 'rgba(226, 232, 240, 0.92)'
  context.beginPath()
  context.arc(0, 0, cellSize * 0.16, 0, Math.PI * 2)
  context.fill()
  if (self.mode === 'digging') {
    context.strokeStyle = 'rgba(250, 204, 21, 0.55)'
    context.lineWidth = 1.2
    context.beginPath()
    context.arc(0, 0, cellSize * 0.26, 0, Math.PI * 2 * self.digProgress)
    context.stroke()
  }
  context.restore()
}

function renderFrame(timestamp: number): void {
  if (!context) return

  const elapsed = previousTimestamp ? timestamp - previousTimestamp : 16.67
  previousTimestamp = timestamp
  const delta = Math.min(2.2, Math.max(0.35, elapsed / 16.67))

  decayGrid(timestamp, delta)
  for (const self of ants) updateAnt(self, delta, timestamp)

  context.clearRect(0, 0, width, height)

  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      drawCell(col, row, timestamp)
    }
  }

  for (const trinket of trinkets) drawTrinket(trinket, timestamp)
  for (const self of ants) drawAnt(self)

  animationFrameId = window.requestAnimationFrame(renderFrame)
}

function handleMotionPreference(event: MediaQueryListEvent): void {
  reducedMotion = event.matches
  seedGrid()
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
  openness = new Float32Array(0)
  lastVisited = new Float32Array(0)
  hasTrinket = new Uint8Array(0)
  ants.length = 0
  flashes.length = 0
  trinkets.length = 0
})
</script>

<style scoped>
.ant-farm-excavation {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  opacity: 0.92;
  transform: translateZ(0);
}

@media (prefers-reduced-motion: reduce) {
  .ant-farm-excavation {
    opacity: 0.6;
  }
}
</style>
