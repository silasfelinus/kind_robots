<!-- /components/screenfx/stained-glass-rain.vue -->
<template>
  <canvas ref="canvasRef" class="stained-glass-rain" />
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'

interface PointerState {
  x: number
  y: number
  active: boolean
}

interface Rosette {
  x: number
  y: number
  startedAt: number
  life: number
  hueBase: number
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

let cols = 0
let rows = 0
let cellSize = 80
let vSeamCount = 0

// Vertical seam boundaries (between col c and c+1), one oscillator per (row, seam).
let vPhase = new Float32Array(0)
let vFreq = new Float32Array(0)
let vOpen = new Uint8Array(0)

// Horizontal seam boundaries (between row r and r+1), one oscillator per (row, col).
let hPhase = new Float32Array(0)
let hFreq = new Float32Array(0)
let hOpen = new Uint8Array(0)

// One "rain droplet" sheen travels continuously down each vertical seam,
// visible only where that seam's lead line is currently open.
let dropPhase = new Float32Array(0)
let dropSpeedScale = new Float32Array(0)

const rosettes: Rosette[] = []
const pointer: PointerState = { x: 0, y: 0, active: false }

const OPEN_THRESHOLD = 0.2
const CLOSE_THRESHOLD = -0.2

function randomBetween(min: number, max: number): number {
  return min + Math.random() * (max - min)
}

function normalizeHue(hue: number): number {
  return ((hue % 360) + 360) % 360
}

function computeGrid(): { cols: number; rows: number; cellSize: number } {
  const targetCells = reducedMotion ? 20 : 42
  const rawCellSize = Math.sqrt((width * height) / targetCells)
  const size = Math.min(150, Math.max(52, rawCellSize))

  return {
    cols: Math.max(3, Math.ceil(width / size) + 1),
    rows: Math.max(3, Math.ceil(height / size) + 1),
    cellSize: size,
  }
}

function seedGrid(): void {
  const grid = computeGrid()
  cols = grid.cols
  rows = grid.rows
  cellSize = grid.cellSize
  vSeamCount = Math.max(0, cols - 1)

  const vCount = rows * vSeamCount
  vPhase = new Float32Array(vCount)
  vFreq = new Float32Array(vCount)
  vOpen = new Uint8Array(vCount)

  const hRows = Math.max(0, rows - 1)
  const hCount = hRows * cols
  hPhase = new Float32Array(hCount)
  hFreq = new Float32Array(hCount)
  hOpen = new Uint8Array(hCount)

  for (let i = 0; i < vCount; i += 1) {
    const phase = randomBetween(0, Math.PI * 2)
    vPhase[i] = phase
    vFreq[i] = randomBetween(0.00014, 0.00032)
    vOpen[i] = Math.sin(phase) > 0 ? 1 : 0
  }

  for (let i = 0; i < hCount; i += 1) {
    const phase = randomBetween(0, Math.PI * 2)
    hPhase[i] = phase
    hFreq[i] = randomBetween(0.0001, 0.00022)
    hOpen[i] = Math.sin(phase) > 0 ? 1 : 0
  }

  dropPhase = new Float32Array(vSeamCount)
  dropSpeedScale = new Float32Array(vSeamCount)
  for (let c = 0; c < vSeamCount; c += 1) {
    dropPhase[c] = randomBetween(-rows, rows)
    dropSpeedScale[c] = randomBetween(0.7, 1.4)
  }

  rosettes.length = 0
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

function spawnRosette(x: number, y: number): void {
  if (rosettes.length >= 2) rosettes.shift()

  rosettes.push({
    x,
    y,
    startedAt: performance.now(),
    life: reducedMotion ? 900 : 1600,
    hueBase: randomBetween(0, 360),
  })
}

function handlePointerDown(event: PointerEvent): void {
  const point = canvasPoint(event.clientX, event.clientY)
  if (!point) return

  spawnRosette(point.x, point.y)
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

function cellHue(col: number, row: number, t: number): number {
  const drift = reducedMotion ? t * 0.4 : t
  const n =
    Math.sin(col * 0.55 + row * 0.4 + drift * 0.00012) * 0.6 +
    Math.sin(col * 0.22 - row * 0.5 + drift * 0.00019) * 0.4
  const warm = Math.sin(drift * 0.00002) * 45

  return normalizeHue(215 + n * 80 + warm)
}

function pointerTilt(cx: number, cy: number): number {
  if (!pointer.active) return 0

  const dx = cx - pointer.x
  const dy = cy - pointer.y
  const radius = 190
  const falloff = Math.exp(-(dx * dx + dy * dy) / (2 * radius * radius))

  return falloff * 20
}

function drawCell(col: number, row: number, t: number): void {
  if (!context) return

  const x = col * cellSize
  const y = row * cellSize
  const cx = x + cellSize / 2
  const cy = y + cellSize / 2
  const hue = cellHue(col, row, t)
  const tilt = pointerTilt(cx, cy)

  const gradient = context.createLinearGradient(
    x,
    y,
    x + cellSize,
    y + cellSize,
  )
  gradient.addColorStop(
    0,
    `hsla(${hue}, 58%, ${Math.min(80, 48 + tilt)}%, 0.34)`,
  )
  gradient.addColorStop(1, `hsla(${normalizeHue(hue + 10)}, 62%, 24%, 0.34)`)

  context.fillStyle = gradient
  context.fillRect(x, y, cellSize, cellSize)
}

function updateSeams(t: number): void {
  for (let r = 0; r < rows; r += 1) {
    for (let c = 0; c < vSeamCount; c += 1) {
      const index = r * vSeamCount + c
      const value = Math.sin((vPhase[index] ?? 0) + t * (vFreq[index] ?? 0))
      if (!vOpen[index] && value > OPEN_THRESHOLD) vOpen[index] = 1
      else if (vOpen[index] && value < CLOSE_THRESHOLD) vOpen[index] = 0
    }
  }

  const hRows = Math.max(0, rows - 1)
  for (let r = 0; r < hRows; r += 1) {
    for (let c = 0; c < cols; c += 1) {
      const index = r * cols + c
      const value = Math.sin((hPhase[index] ?? 0) + t * (hFreq[index] ?? 0))
      if (!hOpen[index] && value > OPEN_THRESHOLD) hOpen[index] = 1
      else if (hOpen[index] && value < CLOSE_THRESHOLD) hOpen[index] = 0
    }
  }
}

function drawSeams(t: number, delta: number): void {
  if (!context) return

  const leadWidth = Math.max(1.2, cellSize * 0.055)
  context.lineCap = 'round'

  // Vertical leaded boundaries, with a rain-droplet sheen traveling down
  // seams that are currently open (drawn only over an already-visible lead).
  for (let c = 0; c < vSeamCount; c += 1) {
    if (!reducedMotion) {
      dropPhase[c] =
        (dropPhase[c] ?? 0) + delta * 0.006 * (dropSpeedScale[c] ?? 1)
      if ((dropPhase[c] ?? 0) > rows + 1) dropPhase[c] = -1
    }

    const seamX = (c + 1) * cellSize
    const dropRow = dropPhase[c] ?? -1

    for (let r = 0; r < rows; r += 1) {
      const index = r * vSeamCount + c
      if (!vOpen[index]) continue

      const y1 = r * cellSize
      const y2 = y1 + cellSize

      context.strokeStyle = 'rgba(18, 14, 22, 0.55)'
      context.lineWidth = leadWidth
      context.beginPath()
      context.moveTo(seamX, y1)
      context.lineTo(seamX, y2)
      context.stroke()

      if (reducedMotion) continue

      const distance = Math.abs(dropRow - (r + 0.5))
      if (distance > 1.1) continue

      const sheen = Math.max(0, 1 - distance / 1.1)
      context.strokeStyle = `rgba(255, 250, 235, ${sheen * 0.75})`
      context.lineWidth = leadWidth * 1.6
      context.beginPath()
      context.moveTo(seamX, y1)
      context.lineTo(seamX, y2)
      context.stroke()
    }
  }

  // Horizontal leaded boundaries stay static "came" bars -- no sheen.
  const hRows = Math.max(0, rows - 1)
  context.strokeStyle = 'rgba(18, 14, 22, 0.5)'
  context.lineWidth = leadWidth
  for (let r = 0; r < hRows; r += 1) {
    const seamY = (r + 1) * cellSize

    for (let c = 0; c < cols; c += 1) {
      const index = r * cols + c
      if (!hOpen[index]) continue

      const x1 = c * cellSize
      const x2 = x1 + cellSize

      context.beginPath()
      context.moveTo(x1, seamY)
      context.lineTo(x2, seamY)
      context.stroke()
    }
  }
}

function drawRosette(rosette: Rosette, timestamp: number): boolean {
  if (!context) return false

  const age = timestamp - rosette.startedAt
  if (age >= rosette.life) return false

  const progress = age / rosette.life
  const fade = 1 - progress
  const wedgeCount = 14
  const radius = 12 + progress * (reducedMotion ? 70 : 130)

  context.save()
  context.globalCompositeOperation = 'lighter'

  for (let i = 0; i < wedgeCount; i += 1) {
    const angle = (i / wedgeCount) * Math.PI * 2
    const wedgeAngle = (Math.PI * 2) / wedgeCount
    const hue = normalizeHue(rosette.hueBase + i * (360 / wedgeCount) * 0.4)

    context.fillStyle = `hsla(${hue}, 80%, 68%, ${fade * 0.4})`
    context.beginPath()
    context.moveTo(rosette.x, rosette.y)
    context.arc(rosette.x, rosette.y, radius, angle, angle + wedgeAngle)
    context.closePath()
    context.fill()
  }

  context.restore()
  return true
}

function renderFrame(timestamp: number): void {
  if (!context) return

  const elapsed = previousTimestamp ? timestamp - previousTimestamp : 16.67
  previousTimestamp = timestamp
  const delta = Math.min(2.2, Math.max(0.35, elapsed / 16.67))

  simTime += delta * 16.67
  if (!reducedMotion) updateSeams(simTime)

  context.clearRect(0, 0, width, height)

  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      drawCell(col, row, simTime)
    }
  }

  drawSeams(simTime, delta)

  for (let index = rosettes.length - 1; index >= 0; index -= 1) {
    const rosette = rosettes[index]
    if (!rosette || !drawRosette(rosette, timestamp)) rosettes.splice(index, 1)
  }

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
  vPhase = new Float32Array(0)
  vFreq = new Float32Array(0)
  vOpen = new Uint8Array(0)
  hPhase = new Float32Array(0)
  hFreq = new Float32Array(0)
  hOpen = new Uint8Array(0)
  dropPhase = new Float32Array(0)
  dropSpeedScale = new Float32Array(0)
  rosettes.length = 0
})
</script>

<style scoped>
.stained-glass-rain {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  opacity: 0.82;
  transform: translateZ(0);
}

@media (prefers-reduced-motion: reduce) {
  .stained-glass-rain {
    opacity: 0.5;
  }
}
</style>
