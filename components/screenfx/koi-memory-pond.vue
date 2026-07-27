<!-- /components/screenfx/koi-memory-pond.vue -->
<template>
  <canvas ref="canvasRef" class="koi-memory-pond" />
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'

interface Fish {
  x: number
  y: number
  vx: number
  vy: number
  angle: number
  size: number
  hue: number
  targetX: number
  targetY: number
  resting: boolean
  restUntil: number
  wigglePhase: number
  wiggleSpeed: number
  foodUntil: number
  foodX: number
  foodY: number
}

interface Leaf {
  baseX: number
  baseY: number
  driftPhase: number
  radius: number
  rotation: number
  hue: number
  dispX: number
  dispY: number
}

interface Ripple {
  x: number
  y: number
  startedAt: number
  duration: number
  strength: number
}

interface FavoriteSpot {
  x: number // normalized 0..1
  y: number // normalized 0..1
  visits: number
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
let previousTimestamp = 0
let reducedMotion = false
let nextAmbientRippleAt = 0

const fish: Fish[] = []
const leaves: Leaf[] = []
const ripples: Ripple[] = []
const pointer: PointerState = { x: 0, y: 0, active: false }
let favorites: FavoriteSpot[] = []

const FAVORITES_KEY = 'koiMemoryPond:favorites'
const MAX_FAVORITES = 5
const MAX_VISITS = 999
const MIN_FAVORITE_SPACING = 0.18 // normalized distance below which spots are treated as "the same place"

// Checked per-call (not captured at module load) so SSR and any headless test that installs a
// window shim after import both behave correctly -- same idiom as utils/rulerHooked/save.ts.
function hasWindow(): boolean {
  return typeof window !== 'undefined'
}

function safeGetFavorites(): FavoriteSpot[] {
  if (!hasWindow()) return []
  try {
    const raw = window.localStorage.getItem(FAVORITES_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed
      .filter(
        (entry): entry is FavoriteSpot =>
          entry &&
          typeof entry.x === 'number' &&
          typeof entry.y === 'number' &&
          typeof entry.visits === 'number',
      )
      .slice(0, MAX_FAVORITES)
  } catch {
    return []
  }
}

function safeSetFavorites(spots: FavoriteSpot[]): void {
  if (!hasWindow()) return
  try {
    window.localStorage.setItem(FAVORITES_KEY, JSON.stringify(spots))
  } catch {
    /* quota / privacy mode -- a wallpaper losing its memory is non-fatal */
  }
}

function randomBetween(min: number, max: number): number {
  return min + Math.random() * (max - min)
}

function fishCount(): number {
  if (reducedMotion) return 2
  return Math.round(Math.min(9, Math.max(4, (width * height) / 130000)))
}

function leafCount(): number {
  return Math.round(Math.min(7, Math.max(3, (width * height) / 220000)))
}

function distanceNormalized(a: FavoriteSpot, bx: number, by: number): number {
  return Math.hypot(a.x - bx, a.y - by)
}

// Called rarely (on a fish resting event), never per frame -- keeps the "no database write
// per frame" performance note satisfied even though this is localStorage, not a database.
function recordVisit(px: number, py: number): void {
  const nx = px / width
  const ny = py / height

  const existing = favorites.find(
    (spot) => distanceNormalized(spot, nx, ny) < MIN_FAVORITE_SPACING,
  )
  if (existing) {
    existing.visits = Math.min(MAX_VISITS, existing.visits + 1)
    safeSetFavorites(favorites)
    return
  }

  // New spot: only sometimes becomes a favorite so the list develops slowly rather than
  // filling up on the very first few rests.
  if (Math.random() >= 0.28) return

  const entry: FavoriteSpot = { x: nx, y: ny, visits: 1 }
  if (favorites.length < MAX_FAVORITES) {
    favorites.push(entry)
  } else {
    let weakest = favorites[0]!
    for (const spot of favorites) {
      if (spot.visits < weakest.visits) weakest = spot
    }
    if (weakest.visits > 1) return // established favorites are protected once they have repeat visits
    const index = favorites.indexOf(weakest)
    favorites.splice(index, 1, entry)
  }
  safeSetFavorites(favorites)
}

function pickTarget(self: Fish): void {
  const margin = 24
  const roll = reducedMotion ? 1 : Math.random()

  if (roll < 0.2 && fish.length > 1) {
    // Occasionally follow another fish rather than heading somewhere new.
    const other = fish[Math.floor(Math.random() * fish.length)]!
    if (other !== self) {
      self.targetX = Math.min(
        width - margin,
        Math.max(margin, other.x + randomBetween(-30, 30)),
      )
      self.targetY = Math.min(
        height - margin,
        Math.max(margin, other.y + randomBetween(-30, 30)),
      )
      return
    }
  }

  if (roll < 0.55 && favorites.length > 0) {
    const totalVisits = favorites.reduce((sum, spot) => sum + spot.visits, 0)
    let pick = Math.random() * totalVisits
    let chosen = favorites[0]!
    for (const spot of favorites) {
      pick -= spot.visits
      if (pick <= 0) {
        chosen = spot
        break
      }
    }
    self.targetX = Math.min(width - margin, Math.max(margin, chosen.x * width))
    self.targetY = Math.min(
      height - margin,
      Math.max(margin, chosen.y * height),
    )
    return
  }

  self.targetX = randomBetween(margin, width - margin)
  self.targetY = randomBetween(margin, height - margin)
}

function createFish(): Fish {
  const self: Fish = {
    x: Math.random() * width,
    y: Math.random() * height,
    vx: 0,
    vy: 0,
    angle: randomBetween(0, Math.PI * 2),
    size: randomBetween(9, 15),
    hue: randomBetween(8, 34),
    targetX: 0,
    targetY: 0,
    resting: false,
    restUntil: 0,
    wigglePhase: Math.random() * Math.PI * 2,
    wiggleSpeed: randomBetween(0.01, 0.018),
    foodUntil: 0,
    foodX: 0,
    foodY: 0,
  }
  pickTarget(self)
  return self
}

function seedFish(): void {
  const count = fishCount()
  while (fish.length < count) fish.push(createFish())
  if (fish.length > count) fish.splice(count)
}

function createLeaf(): Leaf {
  return {
    baseX: Math.random() * width,
    baseY: Math.random() * height,
    driftPhase: Math.random() * Math.PI * 2,
    radius: randomBetween(10, 18),
    rotation: randomBetween(0, Math.PI * 2),
    hue: randomBetween(84, 120),
    dispX: 0,
    dispY: 0,
  }
}

function seedLeaves(): void {
  const count = leafCount()
  while (leaves.length < count) leaves.push(createLeaf())
  if (leaves.length > count) leaves.splice(count)
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

const MAX_RIPPLES = 6

function spawnRipple(
  x: number,
  y: number,
  strength: number,
  duration: number,
): void {
  if (ripples.length >= MAX_RIPPLES) ripples.shift()
  ripples.push({ x, y, startedAt: performance.now(), duration, strength })
}

function handlePointerDown(event: PointerEvent): void {
  const point = canvasPoint(event.clientX, event.clientY)
  if (!point) return

  spawnRipple(point.x, point.y, 1, 1400)

  if (reducedMotion) return

  const attractRadius = 220
  const now = performance.now()
  for (const self of fish) {
    if (Math.hypot(self.x - point.x, self.y - point.y) < attractRadius) {
      self.foodX = point.x
      self.foodY = point.y
      self.foodUntil = now + 2600
      self.resting = false
    }
  }
}

function resizeCanvas(): void {
  const canvas = canvasRef.value
  if (!canvas || !context) return

  const rect = canvas.getBoundingClientRect()
  const nextWidth = Math.max(1, rect.width)
  const nextHeight = Math.max(1, rect.height)
  const scaleX = nextWidth / width
  const scaleY = nextHeight / height

  width = nextWidth
  height = nextHeight

  const pixelRatio = Math.min(window.devicePixelRatio || 1, 2)
  canvas.width = Math.round(width * pixelRatio)
  canvas.height = Math.round(height * pixelRatio)
  context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0)

  fish.forEach((self) => {
    self.x *= scaleX
    self.y *= scaleY
    self.targetX *= scaleX
    self.targetY *= scaleY
  })
  leaves.forEach((leaf) => {
    leaf.baseX *= scaleX
    leaf.baseY *= scaleY
  })

  seedFish()
  seedLeaves()
}

function updateFish(self: Fish, delta: number, now: number): void {
  self.wigglePhase += self.wiggleSpeed * delta * (self.resting ? 0.3 : 1)

  const usingFood = self.foodUntil > now
  const tx = usingFood ? self.foodX : self.targetX
  const ty = usingFood ? self.foodY : self.targetY

  if (self.resting && !usingFood) {
    if (now >= self.restUntil) {
      self.resting = false
      pickTarget(self)
    }
  } else {
    const dx = tx - self.x
    const dy = ty - self.y
    const distance = Math.hypot(dx, dy)

    if (distance < 6 && !usingFood) {
      self.resting = true
      self.restUntil =
        now +
        randomBetween(reducedMotion ? 2600 : 1200, reducedMotion ? 5200 : 3200)
      recordVisit(self.x, self.y)
    } else if (distance > 1) {
      const maxSpeed = reducedMotion ? 0.16 : usingFood ? 0.5 : 0.34
      const pull = Math.min(1, distance / 80) * maxSpeed * delta
      self.vx += (dx / distance) * pull * 0.2
      self.vy += (dy / distance) * pull * 0.2
    } else {
      self.vx *= 0.8
      self.vy *= 0.8
    }
  }

  // Gentle avoidance: fish steer away from the pointer's "shadow" rather than through it.
  if (pointer.active && !reducedMotion) {
    const distance = Math.hypot(pointer.x - self.x, pointer.y - self.y)
    const shadowRadius = 90
    if (distance < shadowRadius && distance > 2) {
      const push = (1 - distance / shadowRadius) * 0.18 * delta
      self.vx -= ((pointer.x - self.x) / distance) * push
      self.vy -= ((pointer.y - self.y) / distance) * push
    }
  }

  const speed = Math.hypot(self.vx, self.vy)
  const cap = self.resting
    ? 0.02
    : reducedMotion
      ? 0.16
      : usingFood
        ? 0.5
        : 0.34
  if (speed > cap && speed > 0) {
    self.vx = (self.vx / speed) * cap
    self.vy = (self.vy / speed) * cap
  }

  self.x += self.vx * delta
  self.y += self.vy * delta
  self.x = Math.min(width - 4, Math.max(4, self.x))
  self.y = Math.min(height - 4, Math.max(4, self.y))

  if (speed > 0.01) {
    const desiredAngle = Math.atan2(self.vy, self.vx)
    let diff = desiredAngle - self.angle
    while (diff > Math.PI) diff -= Math.PI * 2
    while (diff < -Math.PI) diff += Math.PI * 2
    self.angle += diff * Math.min(1, delta * 0.12)
  }
}

function updateLeaf(leaf: Leaf, delta: number): void {
  if (!reducedMotion) {
    leaf.driftPhase += delta * 0.006
  }

  for (const self of fish) {
    const distance = Math.hypot(
      self.x - leaf.baseX - leaf.dispX,
      self.y - leaf.baseY - leaf.dispY,
    )
    const pushRadius = 30 + leaf.radius
    if (distance < pushRadius && distance > 1) {
      const push = (1 - distance / pushRadius) * 1.4
      leaf.dispX += ((leaf.baseX - self.x) / distance) * push
      leaf.dispY += ((leaf.baseY - self.y) / distance) * push
    }
  }

  // Ease displacement back toward the resting position -- a light spring, not a snap.
  leaf.dispX *= 0.94
  leaf.dispY *= 0.94
}

function drawFish(self: Fish): void {
  if (!context) return

  const wiggle = Math.sin(self.wigglePhase) * 0.5
  const usingFood = self.foodUntil > performance.now()
  const alpha = usingFood ? 0.95 : 0.85

  context.save()
  context.translate(self.x, self.y)
  context.rotate(self.angle)

  // Tail, drawn first so the body overlaps its base.
  context.fillStyle = `hsla(${self.hue}, 70%, 55%, ${alpha})`
  context.beginPath()
  context.moveTo(-self.size * 1.1, 0)
  context.lineTo(-self.size * 1.9, -self.size * 0.55 + wiggle * self.size * 0.3)
  context.lineTo(-self.size * 1.9, self.size * 0.55 + wiggle * self.size * 0.3)
  context.closePath()
  context.fill()

  // Body.
  context.beginPath()
  context.ellipse(0, 0, self.size, self.size * 0.48, 0, 0, Math.PI * 2)
  context.fill()

  context.fillStyle = `hsla(${self.hue}, 40%, 92%, ${alpha * 0.7})`
  context.beginPath()
  context.ellipse(
    self.size * 0.15,
    0,
    self.size * 0.55,
    self.size * 0.2,
    0,
    0,
    Math.PI * 2,
  )
  context.fill()

  context.restore()
}

function drawLeaf(leaf: Leaf): void {
  if (!context) return

  const bobY = reducedMotion ? 0 : Math.sin(leaf.driftPhase) * 3

  context.save()
  context.translate(leaf.baseX + leaf.dispX, leaf.baseY + leaf.dispY + bobY)
  context.rotate(leaf.rotation)
  context.fillStyle = `hsla(${leaf.hue}, 45%, 34%, 0.55)`
  context.beginPath()
  context.ellipse(0, 0, leaf.radius, leaf.radius * 0.55, 0, 0, Math.PI * 2)
  context.fill()
  context.strokeStyle = `hsla(${leaf.hue}, 35%, 20%, 0.4)`
  context.lineWidth = 1
  context.beginPath()
  context.moveTo(-leaf.radius * 0.8, 0)
  context.lineTo(leaf.radius * 0.8, 0)
  context.stroke()
  context.restore()
}

function drawRipples(now: number): void {
  if (!context) return

  for (let i = ripples.length - 1; i >= 0; i -= 1) {
    const ripple = ripples[i]!
    const progress = (now - ripple.startedAt) / ripple.duration
    if (progress >= 1) {
      ripples.splice(i, 1)
      continue
    }

    const radius = progress * 70 * ripple.strength
    const alpha = (1 - progress) * 0.35 * ripple.strength

    context.save()
    context.strokeStyle = `hsla(196, 55%, 85%, ${alpha})`
    context.lineWidth = 1.4
    context.beginPath()
    context.arc(ripple.x, ripple.y, radius, 0, Math.PI * 2)
    context.stroke()
    context.restore()
  }
}

function maybeSpawnAmbientRipple(now: number): void {
  if (now < nextAmbientRippleAt) return

  spawnRipple(
    randomBetween(width * 0.1, width * 0.9),
    randomBetween(height * 0.1, height * 0.9),
    0.6,
    1800,
  )
  nextAmbientRippleAt =
    now +
    (reducedMotion ? randomBetween(6000, 11000) : randomBetween(4000, 9000))
}

function renderFrame(timestamp: number): void {
  if (!context) return

  const elapsed = previousTimestamp ? timestamp - previousTimestamp : 16.67
  previousTimestamp = timestamp
  const delta = Math.min(2.2, Math.max(0.35, elapsed / 16.67))
  const now = performance.now()

  context.clearRect(0, 0, width, height)

  maybeSpawnAmbientRipple(now)
  drawRipples(now)

  for (const leaf of leaves) updateLeaf(leaf, delta)
  for (const leaf of leaves) drawLeaf(leaf)

  for (const self of fish) updateFish(self, delta, now)
  for (const self of fish) drawFish(self)

  animationFrameId = window.requestAnimationFrame(renderFrame)
}

function handleMotionPreference(event: MediaQueryListEvent): void {
  reducedMotion = event.matches
  seedFish()
}

onMounted(() => {
  const canvas = canvasRef.value
  if (!canvas) return

  context = canvas.getContext('2d', { alpha: true })
  if (!context) return

  favorites = safeGetFavorites()

  motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
  reducedMotion = motionQuery.matches
  motionQuery.addEventListener('change', handleMotionPreference)

  resizeObserver = new ResizeObserver(resizeCanvas)
  resizeObserver.observe(canvas)
  resizeCanvas()

  nextAmbientRippleAt = performance.now() + randomBetween(2000, 5000)

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
  fish.length = 0
  leaves.length = 0
  ripples.length = 0
})
</script>

<style scoped>
.koi-memory-pond {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  opacity: 0.92;
  transform: translateZ(0);
}

@media (prefers-reduced-motion: reduce) {
  .koi-memory-pond {
    opacity: 0.7;
  }
}
</style>
