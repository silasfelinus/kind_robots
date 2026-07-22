<!-- /components/screenfx/clockwork-greenhouse.vue -->
<template>
  <canvas ref="canvasRef" class="clockwork-greenhouse" />
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'

type Phase = 'growing' | 'bloom' | 'seed' | 'reset'

interface Plant {
  id: number
  x: number
  maxHeight: number
  hue: number
  phase: Phase
  phaseStart: number
  phaseDurations: Record<Phase, number>
  swayPhase: number
  swaySpeed: number
  leafCount: number
  temporary: boolean
}

interface Pollinator {
  x: number
  y: number
  angle: number
  targetId: number | null
  spinSpeed: number
}

interface Spark {
  x: number
  y: number
  startedAt: number
  hue: number
}

interface PointerState {
  x: number
  y: number
  active: boolean
}

const canvasRef = ref<HTMLCanvasElement | null>(null)

let animationFrameId: number | null = null
let resizeObserver: ResizeObserver | null = null
let motionQuery: MediaQueryList | null = null
let context: CanvasRenderingContext2D | null = null
let width = 1
let height = 1
let groundY = 1
let previousTimestamp = 0
let reducedMotion = false
let simTime = 0
let nextPlantId = 0

let leafPath: Path2D | null = null
let petalPath: Path2D | null = null

let plants: Plant[] = []
const pollinators: Pollinator[] = []
const sparks: Spark[] = []
const pointer: PointerState = { x: 0, y: 0, active: false }

const PHASE_ORDER: Phase[] = ['growing', 'bloom', 'seed', 'reset']
const MAX_TEMPORARY = 2
const WARMTH_RADIUS = 170

function randomBetween(min: number, max: number): number {
  return min + Math.random() * (max - min)
}

function easeInOutQuad(t: number): number {
  const clamped = Math.min(1, Math.max(0, t))
  return clamped < 0.5
    ? 2 * clamped * clamped
    : 1 - Math.pow(-2 * clamped + 2, 2) / 2
}

function buildLeafPath(): Path2D {
  const path = new Path2D()
  path.moveTo(0, 0)
  path.quadraticCurveTo(0.55, -0.35, 0, -1)
  path.quadraticCurveTo(-0.55, -0.35, 0, 0)
  path.closePath()
  return path
}

function buildPetalPath(): Path2D {
  const path = new Path2D()
  path.moveTo(0, 0)
  path.quadraticCurveTo(0.4, -0.55, 0, -1.05)
  path.quadraticCurveTo(-0.4, -0.55, 0, 0)
  path.closePath()
  return path
}

function phaseDurations(): Record<Phase, number> {
  return {
    growing: randomBetween(4600, 5800),
    bloom: randomBetween(6200, 7800),
    seed: randomBetween(3600, 4600),
    reset: randomBetween(2200, 3000),
  }
}

function createPlant(x: number, temporary: boolean): Plant {
  return {
    id: nextPlantId++,
    x,
    maxHeight: randomBetween(reducedMotion ? 90 : 70, 150),
    hue: randomBetween(95, 165),
    phase: 'growing',
    phaseStart: simTime - (temporary ? 0 : randomBetween(0, 6000)),
    phaseDurations: phaseDurations(),
    swayPhase: randomBetween(0, Math.PI * 2),
    swaySpeed: randomBetween(0.0006, 0.0011),
    leafCount: Math.floor(randomBetween(3, 6)),
    temporary,
  }
}

function seedGarden(): void {
  const targetCount = reducedMotion ? 4 : 6
  const spacing = width / (targetCount + 1)

  plants = []
  for (let i = 0; i < targetCount; i += 1) {
    const x = spacing * (i + 1) + randomBetween(-spacing * 0.18, spacing * 0.18)
    const plant = createPlant(x, false)
    if (reducedMotion) {
      plant.phase = 'bloom'
      plant.phaseStart = simTime - plant.phaseDurations.bloom * 0.4
    }
    plants.push(plant)
  }

  pollinators.length = 0
  const pollinatorCount = reducedMotion ? 1 : 2
  for (let i = 0; i < pollinatorCount; i += 1) {
    pollinators.push({
      x: randomBetween(0, width),
      y: groundY - randomBetween(40, 90),
      angle: randomBetween(0, Math.PI * 2),
      targetId: null,
      spinSpeed: randomBetween(0.0022, 0.0036),
    })
  }

  sparks.length = 0
}

function resizeCanvas(): void {
  const canvas = canvasRef.value
  if (!canvas || !context) return

  const rect = canvas.getBoundingClientRect()
  width = Math.max(1, rect.width)
  height = Math.max(1, rect.height)
  groundY = height * 0.86

  const pixelRatio = Math.min(window.devicePixelRatio || 1, 2)
  canvas.width = Math.round(width * pixelRatio)
  canvas.height = Math.round(height * pixelRatio)
  context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0)

  seedGarden()
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
  const point = canvasPoint(event.clientX, event.clientY)
  if (!point) return

  const temporaryPlants = plants.filter((plant) => plant.temporary)
  if (temporaryPlants.length >= MAX_TEMPORARY) {
    const oldest = temporaryPlants[0]
    if (oldest) plants.splice(plants.indexOf(oldest), 1)
  }

  plants.push(createPlant(point.x, true))
}

function warmthMultiplier(plant: Plant): number {
  if (!pointer.active || plant.phase !== 'growing') return 1

  const dx = plant.x - pointer.x
  const dy = groundY - pointer.y
  const distance = Math.sqrt(dx * dx + dy * dy)
  const falloff = Math.max(0, 1 - distance / WARMTH_RADIUS)

  return 1 + falloff * 2.4
}

function advancePlant(plant: Plant, delta: number): boolean {
  if (reducedMotion) return true

  const multiplier = warmthMultiplier(plant)
  plant.phaseStart -= delta * (multiplier - 1)

  const elapsed = simTime - plant.phaseStart
  const duration = plant.phaseDurations[plant.phase]

  if (elapsed < duration) return true

  const currentIndex = PHASE_ORDER.indexOf(plant.phase)
  const isLastPhase = currentIndex === PHASE_ORDER.length - 1

  if (plant.temporary && isLastPhase) return false

  plant.phase =
    PHASE_ORDER[(currentIndex + 1) % PHASE_ORDER.length] ?? 'growing'
  plant.phaseStart = simTime
  if (plant.phase === 'growing') {
    plant.hue = randomBetween(95, 165)
    plant.phaseDurations = phaseDurations()
  }

  return true
}

function phaseProgress(plant: Plant): number {
  if (reducedMotion) return 1
  const elapsed = simTime - plant.phaseStart
  return Math.min(1, Math.max(0, elapsed / plant.phaseDurations[plant.phase]))
}

function drawStem(plant: Plant, stemHeight: number, sway: number): void {
  if (!context || stemHeight <= 1) return

  const baseX = plant.x
  const topX = baseX + sway
  const topY = groundY - stemHeight

  context.strokeStyle = 'rgba(96, 66, 34, 0.85)'
  context.lineWidth = 3.4
  context.lineCap = 'round'
  context.beginPath()
  context.moveTo(baseX, groundY)
  context.quadraticCurveTo(
    baseX + sway * 0.5,
    groundY - stemHeight * 0.55,
    topX,
    topY,
  )
  context.stroke()

  const leafRows = plant.leafCount
  for (let i = 0; i < leafRows; i += 1) {
    const t = (i + 1) / (leafRows + 1)
    if (t > stemHeight / plant.maxHeight) break

    const leafY = groundY - stemHeight * t
    const leafX = baseX + sway * t
    const side = i % 2 === 0 ? 1 : -1
    const scale = 16 + t * 10

    if (!leafPath) continue
    context.save()
    context.translate(leafX, leafY)
    context.rotate(side * 0.55)
    context.scale(side * scale * 0.05, scale * 0.05)
    context.fillStyle = `hsla(${plant.hue}, 52%, 34%, 0.9)`
    context.fill(leafPath)
    context.restore()
  }
}

function drawBloom(
  plant: Plant,
  topX: number,
  topY: number,
  openAmount: number,
): void {
  if (!context || !petalPath || openAmount <= 0.02) return

  const petalCount = 6
  const scale = 24 * openAmount

  context.save()
  context.translate(topX, topY)
  for (let i = 0; i < petalCount; i += 1) {
    const angle = (i / petalCount) * Math.PI * 2
    context.save()
    context.rotate(angle)
    context.scale(scale * 0.032, scale * 0.032)
    context.fillStyle = `hsla(${plant.hue - 60}, 70%, ${58 + i * 1.5}%, 0.92)`
    context.fill(petalPath)
    context.restore()
  }

  context.beginPath()
  context.arc(0, 0, 6 + openAmount * 3, 0, Math.PI * 2)
  context.fillStyle = `hsla(${plant.hue - 20}, 80%, 62%, 0.95)`
  context.fill()
  context.restore()
}

function drawSeedPod(
  plant: Plant,
  topX: number,
  topY: number,
  progress: number,
  resetting: boolean,
): void {
  if (!context) return

  const grow = resetting ? 1 - progress : Math.min(1, progress * 1.6)
  if (grow <= 0.02) return

  const radius = 9 * grow
  const dropOffset = resetting ? progress * 26 : 0

  context.save()
  context.translate(topX, topY + dropOffset)
  context.globalAlpha = resetting ? Math.max(0, 1 - progress * 1.3) : 1
  context.beginPath()
  context.arc(0, 0, radius, 0, Math.PI * 2)
  context.fillStyle = 'hsla(38, 62%, 46%, 0.95)'
  context.fill()
  context.strokeStyle = 'hsla(30, 55%, 30%, 0.9)'
  context.lineWidth = 1.4
  for (let i = 0; i < 5; i += 1) {
    const angle = (i / 5) * Math.PI * 2
    context.beginPath()
    context.moveTo(0, 0)
    context.lineTo(Math.cos(angle) * radius, Math.sin(angle) * radius)
    context.stroke()
  }
  context.restore()
}

function drawPlant(plant: Plant): void {
  const progress = phaseProgress(plant)
  const sway = reducedMotion
    ? Math.sin(plant.swayPhase) * 3
    : Math.sin(plant.swayPhase + simTime * plant.swaySpeed) * 6

  let stemHeight = plant.maxHeight
  if (plant.phase === 'growing') {
    stemHeight = plant.maxHeight * easeInOutQuad(progress)
  } else if (plant.phase === 'reset') {
    stemHeight = plant.maxHeight * (1 - easeInOutQuad(progress))
  }

  drawStem(plant, stemHeight, sway)

  const topX = plant.x + sway
  const topY = groundY - stemHeight

  if (plant.phase === 'bloom') {
    const openAmount = Math.min(1, progress / 0.25)
    drawBloom(plant, topX, topY, openAmount)
  } else if (plant.phase === 'seed') {
    drawSeedPod(plant, topX, topY, progress, false)
  } else if (plant.phase === 'reset') {
    drawSeedPod(plant, topX, topY, progress, true)
  }
}

function nearestBloomTarget(
  pollinator: Pollinator,
  exclude: number | null,
): Plant | null {
  let closest: Plant | null = null
  let closestDistance = Infinity

  for (const plant of plants) {
    if (plant.phase !== 'bloom' || plant.id === exclude) continue

    const dx = plant.x - pollinator.x
    const dy = groundY - plant.maxHeight - pollinator.y
    const distance = dx * dx + dy * dy

    if (distance < closestDistance) {
      closestDistance = distance
      closest = plant
    }
  }

  return closest
}

function spawnSpark(x: number, y: number, hue: number): void {
  if (sparks.length >= 4) sparks.shift()
  sparks.push({ x, y, startedAt: performance.now(), hue })
}

function updatePollinator(pollinator: Pollinator, delta: number): void {
  pollinator.angle += delta * pollinator.spinSpeed * (reducedMotion ? 0.3 : 1)

  const target =
    pollinator.targetId !== null
      ? plants.find(
          (plant) =>
            plant.id === pollinator.targetId && plant.phase === 'bloom',
        )
      : undefined

  if (!target) {
    const next = nearestBloomTarget(pollinator, pollinator.targetId)
    pollinator.targetId = next ? next.id : null
    if (!next) {
      pollinator.x +=
        Math.sin(simTime * 0.0003 + pollinator.angle) * delta * 0.01
      return
    }
  }

  const current = plants.find((plant) => plant.id === pollinator.targetId)
  if (!current) return

  const targetX = current.x
  const targetY = groundY - current.maxHeight
  const dx = targetX - pollinator.x
  const dy = targetY - pollinator.y
  const distance = Math.sqrt(dx * dx + dy * dy)

  if (distance < 6) {
    spawnSpark(pollinator.x, pollinator.y, current.hue)
    const next = nearestBloomTarget(pollinator, current.id)
    pollinator.targetId = next ? next.id : null
    return
  }

  const speed = (reducedMotion ? 0.02 : 0.05) * delta
  pollinator.x += (dx / distance) * speed
  pollinator.y += (dy / distance) * speed
}

function drawPollinator(pollinator: Pollinator): void {
  if (!context) return

  const radius = 7
  const teeth = 8

  context.save()
  context.translate(pollinator.x, pollinator.y)
  context.rotate(pollinator.angle)
  context.fillStyle = 'hsla(42, 55%, 62%, 0.95)'
  context.beginPath()
  for (let i = 0; i < teeth; i += 1) {
    const angle = (i / teeth) * Math.PI * 2
    const toothRadius = i % 2 === 0 ? radius : radius * 0.72
    const x = Math.cos(angle) * toothRadius
    const y = Math.sin(angle) * toothRadius
    if (i === 0) context.moveTo(x, y)
    else context.lineTo(x, y)
  }
  context.closePath()
  context.fill()

  context.beginPath()
  context.arc(0, 0, radius * 0.4, 0, Math.PI * 2)
  context.fillStyle = 'hsla(220, 20%, 18%, 0.9)'
  context.fill()
  context.restore()
}

function drawSpark(spark: Spark, timestamp: number): boolean {
  if (!context) return false

  const age = timestamp - spark.startedAt
  const life = 550
  if (age >= life) return false

  const progress = age / life
  const radius = 3 + progress * 14

  context.save()
  context.globalAlpha = 1 - progress
  context.strokeStyle = `hsla(${spark.hue}, 80%, 70%, 0.9)`
  context.lineWidth = 1.6
  context.beginPath()
  context.arc(spark.x, spark.y, radius, 0, Math.PI * 2)
  context.stroke()
  context.restore()

  return true
}

function renderFrame(timestamp: number): void {
  if (!context) return

  const elapsed = previousTimestamp ? timestamp - previousTimestamp : 16.67
  previousTimestamp = timestamp
  const delta = Math.min(2.2, Math.max(0.35, elapsed / 16.67)) * 16.67

  simTime += delta

  context.clearRect(0, 0, width, height)

  const lightDrift = Math.sin(simTime * 0.00006) * 0.5 + 0.5
  const skyGradient = context.createLinearGradient(0, 0, 0, height)
  skyGradient.addColorStop(0, `hsla(150, ${30 + lightDrift * 12}%, 14%, 0.35)`)
  skyGradient.addColorStop(1, `hsla(90, ${25 + lightDrift * 10}%, 10%, 0.35)`)
  context.fillStyle = skyGradient
  context.fillRect(0, 0, width, height)

  context.strokeStyle = 'rgba(120, 96, 60, 0.4)'
  context.lineWidth = 2
  context.beginPath()
  context.moveTo(0, groundY + 2)
  context.lineTo(width, groundY + 2)
  context.stroke()

  for (let index = plants.length - 1; index >= 0; index -= 1) {
    const plant = plants[index]
    if (!plant) continue
    if (!advancePlant(plant, delta)) {
      plants.splice(index, 1)
      continue
    }
    drawPlant(plant)
  }

  for (const pollinator of pollinators) {
    updatePollinator(pollinator, delta)
    drawPollinator(pollinator)
  }

  for (let index = sparks.length - 1; index >= 0; index -= 1) {
    const spark = sparks[index]
    if (!spark || !drawSpark(spark, timestamp)) sparks.splice(index, 1)
  }

  animationFrameId = window.requestAnimationFrame(renderFrame)
}

function handleMotionPreference(event: MediaQueryListEvent): void {
  reducedMotion = event.matches
  seedGarden()
}

onMounted(() => {
  const canvas = canvasRef.value
  if (!canvas) return

  context = canvas.getContext('2d', { alpha: true })
  if (!context) return

  leafPath = buildLeafPath()
  petalPath = buildPetalPath()

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
  leafPath = null
  petalPath = null
  plants = []
  pollinators.length = 0
  sparks.length = 0
})
</script>

<style scoped>
.clockwork-greenhouse {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  opacity: 0.85;
  transform: translateZ(0);
}

@media (prefers-reduced-motion: reduce) {
  .clockwork-greenhouse {
    opacity: 0.6;
  }
}
</style>
