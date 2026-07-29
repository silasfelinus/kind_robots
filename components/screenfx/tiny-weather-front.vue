<!-- /components/screenfx/tiny-weather-front.vue -->
<template>
  <canvas ref="canvasRef" class="tiny-weather-front" />
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'

type CellType = 'rain' | 'sun' | 'tornado'
type CellPhase = 'forming' | 'active' | 'dissipating'

interface WeatherCell {
  id: number
  type: CellType
  x: number
  y: number
  vx: number
  vy: number
  radius: number
  phase: CellPhase
  phaseAge: number
  formDuration: number
  activeDuration: number
  dissipateDuration: number
  updraft: boolean
  spinSign: number
}

interface Raindrop {
  cellId: number
  relX: number
  fallY: number
  speed: number
}

interface SwirlLeaf {
  angle: number
  angularSpeed: number
  radiusFrac: number
  height: number
  verticalSpeed: number
  size: number
  color: string
}

interface Spark {
  x: number
  y: number
  vx: number
  vy: number
  age: number
  life: number
}

const canvasRef = ref<HTMLCanvasElement | null>(null)

let animationFrameId: number | null = null
let resizeObserver: ResizeObserver | null = null
let motionQuery: MediaQueryList | null = null
let context: CanvasRenderingContext2D | null = null

let width = 1
let height = 1
let reducedMotion = false
let previousTimestamp = 0
let currentScale = 1

let cells: WeatherCell[] = []
let raindrops: Raindrop[] = []
let leaves: SwirlLeaf[] = []
let sparks: Spark[] = []

let nextCellId = 1
let spawnCooldown = 0
let mergeCooldown = 0
let clickCooldown = 0

let lastPointerX = 0
let lastPointerY = 0
let lastPointerMoveAt = 0

const LEAF_COLORS = ['#a16207', '#65a30d', '#b45309', '#92400e']
const MAX_RADIUS = 210
const MAX_LEAVES = 9
const MAX_SPARKS = 20
const MERGE_CHECK_MS = 500
const MAX_DRIFT = 0.05

function randomBetween(min: number, max: number): number {
  return min + Math.random() * (max - min)
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

function maxCells(): number {
  return reducedMotion ? 3 : 6
}

function maxRaindrops(): number {
  return reducedMotion ? 40 : 150
}

function computeScale(): number {
  return clamp(Math.min(width, height) / 600, 0.6, 1.6)
}

function phaseAlpha(cell: WeatherCell): number {
  if (cell.phase === 'forming')
    return clamp(cell.phaseAge / cell.formDuration, 0, 1)
  if (cell.phase === 'dissipating')
    return 1 - clamp(cell.phaseAge / cell.dissipateDuration, 0, 1)
  return 1
}

function phaseRadius(cell: WeatherCell): number {
  if (cell.phase === 'forming') {
    const t = clamp(cell.phaseAge / cell.formDuration, 0, 1)
    return cell.radius * (0.55 + 0.45 * t)
  }
  if (cell.phase === 'dissipating') {
    const t = clamp(cell.phaseAge / cell.dissipateDuration, 0, 1)
    return cell.radius * (1 - 0.35 * t)
  }
  return cell.radius
}

function pickCellType(): CellType {
  if (
    !reducedMotion &&
    !cells.some((cell) => cell.type === 'tornado') &&
    Math.random() < 0.08
  ) {
    return 'tornado'
  }
  return Math.random() < 0.5 ? 'rain' : 'sun'
}

function spawnCell(updraft: boolean, atX?: number, atY?: number): void {
  const type: CellType = updraft ? 'sun' : pickCellType()
  const isTornado = type === 'tornado'
  const radius =
    (updraft
      ? randomBetween(55, 85)
      : isTornado
        ? randomBetween(60, 110)
        : randomBetween(80, 150)) * currentScale

  let x: number
  let y: number
  let vx: number
  let vy: number

  if (updraft && atX !== undefined && atY !== undefined) {
    x = atX
    y = atY
    vx = 0
    vy = randomBetween(-0.012, -0.004)
  } else {
    const dir = Math.random() < 0.5 ? -1 : 1
    vx = randomBetween(0.01, 0.03) * dir
    vy = randomBetween(-0.006, 0.006)
    x = dir > 0 ? -radius * 0.6 : width + radius * 0.6
    y = randomBetween(radius, Math.max(radius, height - radius))
  }

  cells.push({
    id: nextCellId,
    type,
    x,
    y,
    vx,
    vy,
    radius,
    phase: 'forming',
    phaseAge: 0,
    formDuration: updraft ? 220 : randomBetween(500, 900),
    activeDuration: updraft
      ? randomBetween(900, 1400)
      : isTornado
        ? randomBetween(4000, 7000)
        : randomBetween(7000, 13000),
    dissipateDuration: updraft
      ? randomBetween(500, 750)
      : randomBetween(900, 1600),
    updraft,
    spinSign: isTornado ? (Math.random() < 0.5 ? -1 : 1) : 1,
  })
  nextCellId += 1
}

function mergeCells(a: WeatherCell, b: WeatherCell): void {
  const survivor = a.radius >= b.radius ? a : b
  const absorbed = survivor === a ? b : a
  const wA = a.radius * a.radius
  const wB = b.radius * b.radius
  const totalW = wA + wB

  survivor.x = (a.x * wA + b.x * wB) / totalW
  survivor.y = (a.y * wA + b.y * wB) / totalW
  survivor.vx = (a.vx * wA + b.vx * wB) / totalW
  survivor.vy = (a.vy * wA + b.vy * wB) / totalW
  survivor.radius = Math.min(MAX_RADIUS, Math.sqrt(wA + wB))

  const index = cells.indexOf(absorbed)
  if (index >= 0) cells.splice(index, 1)
}

function tryMergeOnce(): void {
  for (let i = 0; i < cells.length; i += 1) {
    const a = cells[i]
    if (!a || a.phase !== 'active' || a.updraft) continue
    for (let j = i + 1; j < cells.length; j += 1) {
      const b = cells[j]
      if (!b || b.phase !== 'active' || b.updraft) continue
      const dist = Math.hypot(a.x - b.x, a.y - b.y)
      if (dist < (a.radius + b.radius) * 0.55) {
        mergeCells(a, b)
        return
      }
    }
  }
}

function updateCells(elapsed: number): void {
  for (const cell of cells) {
    cell.phaseAge += elapsed
    cell.x += cell.vx * elapsed
    cell.y += cell.vy * elapsed

    if (cell.phase === 'forming' && cell.phaseAge >= cell.formDuration) {
      cell.phase = 'active'
      cell.phaseAge = 0
    } else if (cell.phase === 'active') {
      const offscreen =
        cell.x < -cell.radius * 1.6 ||
        cell.x > width + cell.radius * 1.6 ||
        cell.y < -cell.radius * 1.6 ||
        cell.y > height + cell.radius * 1.6
      if (cell.phaseAge >= cell.activeDuration || offscreen) {
        cell.phase = 'dissipating'
        cell.phaseAge = 0
      }
    }
  }

  cells = cells.filter(
    (cell) =>
      !(
        cell.phase === 'dissipating' && cell.phaseAge >= cell.dissipateDuration
      ),
  )
}

function updateRaindrops(elapsed: number): void {
  const cap = maxRaindrops()
  const rainCells = cells.filter(
    (cell) => cell.type === 'rain' && cell.phase !== 'forming',
  )

  if (rainCells.length > 0 && raindrops.length < cap) {
    for (const cell of rainCells) {
      if (raindrops.length >= cap) break
      if (Math.random() < 0.4 * (elapsed / 16.67)) {
        raindrops.push({
          cellId: cell.id,
          relX: randomBetween(-0.85, 0.85),
          fallY: 0,
          speed: randomBetween(0.0009, 0.0015),
        })
      }
    }
  }

  const fallScale = reducedMotion ? 0.5 : 1
  raindrops = raindrops.filter((drop) => {
    const cell = cells.find((c) => c.id === drop.cellId)
    if (!cell) return false
    drop.fallY += drop.speed * elapsed * fallScale
    return drop.fallY <= 1
  })
}

function updateLeaves(elapsed: number): void {
  const tornado = cells.find((cell) => cell.type === 'tornado')
  if (!tornado || reducedMotion) {
    if (leaves.length > 0) leaves = []
    return
  }

  if (leaves.length < MAX_LEAVES && Math.random() < 0.05 * (elapsed / 16.67)) {
    leaves.push({
      angle: randomBetween(0, Math.PI * 2),
      angularSpeed: randomBetween(0.0018, 0.0035) * tornado.spinSign,
      radiusFrac: randomBetween(0.2, 0.95),
      height: randomBetween(0, 1),
      verticalSpeed: randomBetween(0.00025, 0.00055),
      size: randomBetween(3, 6),
      color:
        LEAF_COLORS[Math.floor(Math.random() * LEAF_COLORS.length)] ??
        '#a16207',
    })
  }

  for (const leaf of leaves) {
    leaf.angle += leaf.angularSpeed * elapsed
    leaf.height += leaf.verticalSpeed * elapsed
    if (leaf.height > 1) {
      leaf.height = 0
      leaf.radiusFrac = randomBetween(0.2, 0.95)
    }
  }
}

function spawnSparkBurst(x: number, y: number): void {
  for (let i = 0; i < 10; i += 1) {
    if (sparks.length >= MAX_SPARKS) break
    sparks.push({
      x,
      y,
      vx: randomBetween(-0.02, 0.02),
      vy: randomBetween(-0.09, -0.045),
      age: 0,
      life: randomBetween(700, 1100),
    })
  }
}

function updateSparks(elapsed: number): void {
  if (sparks.length === 0) return
  sparks = sparks.filter((spark) => {
    spark.age += elapsed
    spark.x += spark.vx * elapsed
    spark.y += spark.vy * elapsed
    return spark.age < spark.life
  })
}

function enforceReducedMotionCaps(): void {
  if (!reducedMotion) return

  for (const cell of cells) {
    if (cell.type === 'tornado' && cell.phase !== 'dissipating') {
      cell.phase = 'dissipating'
      cell.phaseAge = 0
    }
  }

  const ambient = cells.filter(
    (cell) => !cell.updraft && cell.phase !== 'dissipating',
  )
  const cap = maxCells()
  if (ambient.length > cap) {
    for (const cell of ambient.slice(0, ambient.length - cap)) {
      cell.phase = 'dissipating'
      cell.phaseAge = 0
    }
  }
}

function drawCell(cell: WeatherCell): void {
  if (!context) return
  const alpha = phaseAlpha(cell)
  const radius = phaseRadius(cell)
  if (alpha <= 0.01 || radius <= 1) return

  context.save()
  context.globalAlpha = alpha

  const gradient = context.createRadialGradient(
    cell.x,
    cell.y,
    0,
    cell.x,
    cell.y,
    radius,
  )
  if (cell.type === 'rain') {
    gradient.addColorStop(0, 'rgba(71, 85, 105, 0.45)')
    gradient.addColorStop(1, 'rgba(71, 85, 105, 0)')
  } else if (cell.type === 'tornado') {
    gradient.addColorStop(0, 'rgba(87, 83, 78, 0.5)')
    gradient.addColorStop(1, 'rgba(87, 83, 78, 0)')
  } else {
    gradient.addColorStop(
      0,
      cell.updraft ? 'rgba(251, 191, 36, 0.55)' : 'rgba(250, 204, 21, 0.4)',
    )
    gradient.addColorStop(1, 'rgba(250, 204, 21, 0)')
  }

  context.fillStyle = gradient
  context.beginPath()
  context.arc(cell.x, cell.y, radius, 0, Math.PI * 2)
  context.fill()

  if (cell.type === 'tornado') {
    const wobble = Math.sin(cell.phaseAge * 0.002 + cell.id) * 0.06
    context.translate(cell.x, cell.y)
    context.rotate(wobble)
    context.beginPath()
    context.ellipse(0, 0, radius * 0.22, radius * 0.9, 0, 0, Math.PI * 2)
    context.fillStyle = `rgba(68, 64, 60, ${alpha * 0.35})`
    context.fill()
  }

  context.restore()
}

function drawRaindrop(drop: Raindrop): void {
  if (!context) return
  const cell = cells.find((c) => c.id === drop.cellId)
  if (!cell) return

  const alpha = phaseAlpha(cell)
  if (alpha <= 0.01) return

  const x = cell.x + drop.relX * cell.radius
  const yTop = cell.y - cell.radius + drop.fallY * cell.radius * 2.1
  const length = 9 * currentScale
  const edgeFade = 1 - Math.abs(drop.fallY - 0.5) * 0.4

  context.save()
  context.globalAlpha = alpha * 0.6 * edgeFade
  context.strokeStyle = 'rgba(226, 232, 240, 0.9)'
  context.lineWidth = 1.4
  context.lineCap = 'round'
  context.beginPath()
  context.moveTo(x, yTop)
  context.lineTo(x, yTop + length)
  context.stroke()
  context.restore()
}

function drawLeaf(leaf: SwirlLeaf, tornado: WeatherCell): void {
  if (!context) return
  const alpha = phaseAlpha(tornado)
  if (alpha <= 0.01) return
  const radius = phaseRadius(tornado)
  const x = tornado.x + Math.cos(leaf.angle) * radius * leaf.radiusFrac
  const y = tornado.y + (0.5 - leaf.height) * radius * 1.4

  context.save()
  context.globalAlpha = alpha * 0.85
  context.translate(x, y)
  context.rotate(leaf.angle + Math.PI / 2)
  context.fillStyle = leaf.color
  context.beginPath()
  context.ellipse(0, 0, leaf.size, leaf.size * 0.5, 0, 0, Math.PI * 2)
  context.fill()
  context.restore()
}

function drawSpark(spark: Spark): void {
  if (!context) return
  const fade = Math.max(0, 1 - spark.age / spark.life)
  context.save()
  context.globalAlpha = fade * 0.85
  context.fillStyle = 'rgba(253, 224, 71, 0.9)'
  context.beginPath()
  context.arc(spark.x, spark.y, 2.4, 0, Math.PI * 2)
  context.fill()
  context.restore()
}

function render(): void {
  if (!context) return
  context.clearRect(0, 0, width, height)

  for (const cell of cells) drawCell(cell)
  for (const drop of raindrops) drawRaindrop(drop)

  const tornado = cells.find((cell) => cell.type === 'tornado')
  if (tornado) for (const leaf of leaves) drawLeaf(leaf, tornado)

  for (const spark of sparks) drawSpark(spark)
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

  currentScale = computeScale()
}

function renderFrame(timestamp: number): void {
  if (!context) return

  const elapsed = previousTimestamp
    ? Math.min(100, timestamp - previousTimestamp)
    : 16.67
  previousTimestamp = timestamp

  spawnCooldown -= elapsed
  mergeCooldown -= elapsed
  clickCooldown = Math.max(0, clickCooldown - elapsed)

  updateCells(elapsed)

  if (mergeCooldown <= 0) {
    tryMergeOnce()
    mergeCooldown = MERGE_CHECK_MS
  }

  const ambientCount = cells.filter((cell) => !cell.updraft).length
  if (spawnCooldown <= 0 && ambientCount < maxCells()) {
    spawnCell(false)
    spawnCooldown = randomBetween(1800, 3400)
  }

  updateRaindrops(elapsed)
  updateLeaves(elapsed)
  updateSparks(elapsed)

  render()

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
  if (reducedMotion) return
  const point = canvasPoint(event.clientX, event.clientY)
  if (!point) return

  const now = performance.now()
  const dtMs = lastPointerMoveAt ? Math.max(1, now - lastPointerMoveAt) : 16
  const vx = (point.x - lastPointerX) / dtMs
  const vy = (point.y - lastPointerY) / dtMs
  lastPointerX = point.x
  lastPointerY = point.y
  lastPointerMoveAt = now

  const speed = Math.hypot(vx, vy)
  if (speed < 0.02) return

  for (const cell of cells) {
    if (cell.phase !== 'active' || cell.updraft) continue
    const dist = Math.hypot(cell.x - point.x, cell.y - point.y)
    const threshold = cell.radius * 1.4
    if (dist >= threshold) continue

    const falloff = 1 - dist / threshold
    const impulse = falloff * 0.35
    cell.vx = clamp(cell.vx + vx * impulse, -MAX_DRIFT, MAX_DRIFT)
    cell.vy = clamp(cell.vy + vy * impulse, -MAX_DRIFT, MAX_DRIFT)
  }
}

function handlePointerDown(event: PointerEvent): void {
  if (reducedMotion) return
  if (clickCooldown > 0) return
  const point = canvasPoint(event.clientX, event.clientY)
  if (!point) return

  spawnCell(true, point.x, point.y)
  spawnSparkBurst(point.x, point.y)
  clickCooldown = 900
}

function handleMotionPreference(event: MediaQueryListEvent): void {
  reducedMotion = event.matches
  enforceReducedMotionCaps()
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
  enforceReducedMotionCaps()

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
  cells = []
  raindrops = []
  leaves = []
  sparks = []
  nextCellId = 1
  spawnCooldown = 0
  mergeCooldown = 0
  clickCooldown = 0
  previousTimestamp = 0
})
</script>

<style scoped>
.tiny-weather-front {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  opacity: 0.9;
  transform: translateZ(0);
}

@media (prefers-reduced-motion: reduce) {
  .tiny-weather-front {
    opacity: 0.72;
  }
}
</style>
