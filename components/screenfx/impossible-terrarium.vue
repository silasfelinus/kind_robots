<!-- /components/screenfx/impossible-terrarium.vue -->
<template>
  <canvas ref="canvasRef" class="impossible-terrarium" />
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'

// Fixed grammar: each pocket is a rectangular tile region with its own "down" direction.
// Pockets share the terrarium's glass bounds but disagree about which way gravity points,
// which is what makes routes between them read as Escher-like rather than a single scene.
type GravityDir = 'down' | 'up' | 'left' | 'right'

interface Pocket {
  x: number
  y: number
  w: number
  h: number
  gravity: GravityDir
  hue: number
  rotationOffset: number // pointer-driven local rotation, radians
}

interface Inhabitant {
  pocketIndex: number
  // Position along the pocket's local "floor" axis, 0..1, plus a small perpendicular bob.
  t: number
  speed: number
  bobPhase: number
  size: number
  hue: number
  crossingDoorAt: number | null // timestamp when a door crossing started, else null
  crossingFrom: number
  crossingTo: number
  crossingProgress: number
}

interface Door {
  pocketA: number
  pocketB: number
  ax: number
  ay: number
  bx: number
  by: number
  openUntil: number
}

interface Droplet {
  pocketIndex: number
  t: number // 0..1 along the gravity axis, 0 = spawn edge
  perp: number // 0..1 across the perpendicular axis
  speed: number
  kind: 'water' | 'spore'
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
let glowPulse = 0

const pockets: Pocket[] = []
const inhabitants: Inhabitant[] = []
const doors: Door[] = []
const droplets: Droplet[] = []

const MAX_DOOR_OPEN_MS = 3200

function randomBetween(min: number, max: number): number {
  return min + Math.random() * (max - min)
}

function gravityAxis(gravity: GravityDir): { dx: number; dy: number } {
  switch (gravity) {
    case 'down':
      return { dx: 0, dy: 1 }
    case 'up':
      return { dx: 0, dy: -1 }
    case 'left':
      return { dx: -1, dy: 0 }
    case 'right':
      return { dx: 1, dy: 0 }
  }
}

// Small fixed tile grammar: three pockets laid out so their rectangles tile the terrarium
// without overlap, each assigned a distinct gravity direction (at least three, per the
// pitch's acceptance criteria). A fourth pocket is added on wider canvases for variety.
function buildPockets(): void {
  pockets.length = 0

  const margin = Math.max(10, Math.min(width, height) * 0.04)
  const usableW = width - margin * 2
  const usableH = height - margin * 2

  const wide = usableW > usableH * 1.15

  if (wide) {
    const colW = usableW / 3
    pockets.push(
      {
        x: margin,
        y: margin,
        w: colW * 0.9,
        h: usableH,
        gravity: 'down',
        hue: 152,
        rotationOffset: 0,
      },
      {
        x: margin + colW * 0.9,
        y: margin,
        w: colW * 1.2,
        h: usableH * 0.55,
        gravity: 'right',
        hue: 40,
        rotationOffset: 0,
      },
      {
        x: margin + colW * 0.9,
        y: margin + usableH * 0.55,
        w: colW * 1.2,
        h: usableH * 0.45,
        gravity: 'up',
        hue: 300,
        rotationOffset: 0,
      },
      {
        x: margin + colW * 2.1,
        y: margin,
        w: colW * 0.9,
        h: usableH,
        gravity: 'left',
        hue: 200,
        rotationOffset: 0,
      },
    )
  } else {
    const rowH = usableH / 3
    pockets.push(
      {
        x: margin,
        y: margin,
        w: usableW,
        h: rowH * 0.9,
        gravity: 'down',
        hue: 152,
        rotationOffset: 0,
      },
      {
        x: margin,
        y: margin + rowH * 0.9,
        w: usableW * 0.55,
        h: rowH * 1.2,
        gravity: 'right',
        hue: 40,
        rotationOffset: 0,
      },
      {
        x: margin + usableW * 0.55,
        y: margin + rowH * 0.9,
        w: usableW * 0.45,
        h: rowH * 1.2,
        gravity: 'up',
        hue: 300,
        rotationOffset: 0,
      },
    )
  }
}

// Doors sit at the shared edge between adjacent pockets; only pockets that are actually
// neighbors (share a boundary) get a door between them.
function buildDoors(): void {
  doors.length = 0
  for (let i = 0; i < pockets.length; i += 1) {
    for (let j = i + 1; j < pockets.length; j += 1) {
      const a = pockets[i]!
      const b = pockets[j]!
      const shareVertical =
        Math.abs(a.x + a.w - b.x) < 1 || Math.abs(b.x + b.w - a.x) < 1
      const shareHorizontal =
        Math.abs(a.y + a.h - b.y) < 1 || Math.abs(b.y + b.h - a.y) < 1
      if (!shareVertical && !shareHorizontal) continue

      const ax = a.x + a.w / 2
      const ay = a.y + a.h / 2
      const bx = b.x + b.w / 2
      const by = b.y + b.h / 2
      doors.push({ pocketA: i, pocketB: j, ax, ay, bx, by, openUntil: 0 })
    }
  }
}

function pocketPoint(
  pocket: Pocket,
  t: number,
  perp: number,
): { x: number; y: number } {
  const axis = gravityAxis(pocket.gravity)
  // "floor" runs along the axis perpendicular to gravity; perp offsets away from the floor.
  if (axis.dx !== 0) {
    // gravity is horizontal -> floor is vertical
    const floorX =
      axis.dx > 0 ? pocket.x + pocket.w * 0.12 : pocket.x + pocket.w * 0.88
    return {
      x: floorX + axis.dx * perp * pocket.w * 0.55,
      y: pocket.y + t * pocket.h,
    }
  }
  const floorY =
    axis.dy > 0 ? pocket.y + pocket.h * 0.88 : pocket.y + pocket.h * 0.12
  return {
    x: pocket.x + t * pocket.w,
    y: floorY + axis.dy * perp * pocket.h * 0.55,
  }
}

function inhabitantCount(): number {
  if (reducedMotion) return Math.min(3, pockets.length)
  return Math.min(9, Math.max(4, pockets.length * 2))
}

function createInhabitant(): Inhabitant {
  const pocketIndex = Math.floor(Math.random() * pockets.length)
  return {
    pocketIndex,
    t: Math.random(),
    speed: randomBetween(0.00012, 0.00028),
    bobPhase: Math.random() * Math.PI * 2,
    size: randomBetween(4, 7),
    hue: randomBetween(20, 50),
    crossingDoorAt: null,
    crossingFrom: pocketIndex,
    crossingTo: pocketIndex,
    crossingProgress: 0,
  }
}

function seedInhabitants(): void {
  const count = inhabitantCount()
  while (inhabitants.length < count) inhabitants.push(createInhabitant())
  if (inhabitants.length > count) inhabitants.splice(count)
}

function createDroplet(kind: 'water' | 'spore'): Droplet {
  return {
    pocketIndex: Math.floor(Math.random() * pockets.length),
    t: 0,
    perp: Math.random(),
    speed:
      kind === 'water'
        ? randomBetween(0.00035, 0.0006)
        : randomBetween(0.00015, 0.00028),
    kind,
  }
}

function dropletCount(): number {
  if (reducedMotion) return 0
  return Math.min(14, Math.max(6, pockets.length * 3))
}

function seedDroplets(): void {
  const count = dropletCount()
  while (droplets.length < count)
    droplets.push(createDroplet(Math.random() < 0.6 ? 'water' : 'spore'))
  if (droplets.length > count) droplets.splice(count)
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

function pocketAt(x: number, y: number): number {
  for (let i = 0; i < pockets.length; i += 1) {
    const p = pockets[i]!
    if (x >= p.x && x <= p.x + p.w && y >= p.y && y <= p.y + p.h) return i
  }
  return -1
}

// Pointer rotates only the local gravity pocket it's over -- a purely visual "tilt" of that
// pocket's contents rather than changing the fixed gravity grammar itself.
function handlePointerMove(event: PointerEvent): void {
  const point = canvasPoint(event.clientX, event.clientY)
  if (!point || reducedMotion) return
  const index = pocketAt(point.x, point.y)
  for (let i = 0; i < pockets.length; i += 1) {
    const pocket = pockets[i]!
    const target = i === index ? randomBetween(-0.05, 0.05) : 0
    pocket.rotationOffset += (target - pocket.rotationOffset) * 0.08
  }
}

// Click opens a temporary door between the clicked pocket and its nearest neighbor door.
function handlePointerDown(event: PointerEvent): void {
  const point = canvasPoint(event.clientX, event.clientY)
  if (!point) return
  const index = pocketAt(point.x, point.y)
  if (index === -1) return

  let nearest: Door | null = null
  let nearestDistance = Infinity
  for (const door of doors) {
    if (door.pocketA !== index && door.pocketB !== index) continue
    const distance =
      Math.hypot(door.ax - point.x, door.ay - point.y) +
      Math.hypot(door.bx - point.x, door.by - point.y)
    if (distance < nearestDistance) {
      nearestDistance = distance
      nearest = door
    }
  }
  if (nearest) {
    nearest.openUntil = performance.now() + MAX_DOOR_OPEN_MS
  }
  glowPulse = 1
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

  buildPockets()
  buildDoors()
  seedInhabitants()
  seedDroplets()
}

function updateInhabitant(self: Inhabitant, delta: number, now: number): void {
  self.bobPhase += delta * 0.05

  if (self.crossingDoorAt !== null) {
    self.crossingProgress += delta * 0.018
    if (self.crossingProgress >= 1) {
      self.pocketIndex = self.crossingTo
      self.crossingDoorAt = null
      self.crossingProgress = 0
      self.t = 0.5
    }
    return
  }

  self.t += self.speed * delta * (reducedMotion ? 0.4 : 1)
  if (self.t >= 1) {
    self.t = 1

    // At a pocket's far end: try an open door to a neighbor, else turn back.
    const openDoor = doors.find(
      (door) =>
        (door.pocketA === self.pocketIndex ||
          door.pocketB === self.pocketIndex) &&
        door.openUntil > now,
    )
    if (openDoor && Math.random() < 0.5) {
      self.crossingFrom = self.pocketIndex
      self.crossingTo =
        openDoor.pocketA === self.pocketIndex
          ? openDoor.pocketB
          : openDoor.pocketA
      self.crossingDoorAt = now
      self.crossingProgress = 0
      return
    }

    self.speed = -Math.abs(self.speed)
  } else if (self.t <= 0) {
    self.t = 0
    self.speed = Math.abs(self.speed)
  }
}

function updateDroplet(self: Droplet, delta: number): void {
  self.t += self.speed * delta
  if (self.t > 1.05) {
    self.t = 0
    self.pocketIndex = Math.floor(Math.random() * pockets.length)
    self.perp = Math.random()
  }
}

function drawPocketFrame(pocket: Pocket): void {
  if (!context) return
  context.save()
  context.strokeStyle = `hsla(${pocket.hue}, 30%, 85%, 0.28)`
  context.lineWidth = 1
  context.strokeRect(pocket.x, pocket.y, pocket.w, pocket.h)

  // A faint gravity arrow near the pocket's floor edge keeps the disagreeing directions legible.
  const axis = gravityAxis(pocket.gravity)
  const cx = pocket.x + pocket.w / 2
  const cy = pocket.y + pocket.h / 2
  const arrowLen = Math.min(pocket.w, pocket.h) * 0.12
  context.strokeStyle = `hsla(${pocket.hue}, 45%, 70%, 0.35)`
  context.lineWidth = 1.4
  context.beginPath()
  context.moveTo(cx, cy)
  context.lineTo(cx + axis.dx * arrowLen, cy + axis.dy * arrowLen)
  context.stroke()
  context.restore()
}

function drawInhabitant(self: Inhabitant): void {
  if (!context) return

  const bob = Math.sin(self.bobPhase) * 1.6

  let point: { x: number; y: number }
  if (self.crossingDoorAt !== null) {
    const from = pockets[self.crossingFrom]
    const to = pockets[self.crossingTo]
    if (!from || !to) return
    const fromDoor = pocketPoint(
      from,
      from.gravity === 'left' || from.gravity === 'right' ? 0.5 : 1,
      0.5,
    )
    const toDoor = pocketPoint(to, 0.5, 0.5)
    point = {
      x: fromDoor.x + (toDoor.x - fromDoor.x) * self.crossingProgress,
      y: fromDoor.y + (toDoor.y - fromDoor.y) * self.crossingProgress,
    }
  } else {
    const pocket = pockets[self.pocketIndex]
    if (!pocket) return
    point = pocketPoint(pocket, self.t, 0.5)
  }

  context.save()
  context.translate(point.x, point.y + bob)
  context.fillStyle = `hsla(${self.hue}, 65%, 60%, 0.9)`
  context.beginPath()
  context.ellipse(0, 0, self.size, self.size * 0.7, 0, 0, Math.PI * 2)
  context.fill()
  context.restore()
}

function drawDroplet(self: Droplet): void {
  if (!context) return
  const pocket = pockets[self.pocketIndex]
  if (!pocket) return
  const point = pocketPoint(pocket, self.t, self.perp)
  const alpha = self.kind === 'water' ? 0.5 * (1 - self.t) : 0.35

  context.save()
  context.fillStyle =
    self.kind === 'water'
      ? `hsla(200, 70%, 75%, ${alpha})`
      : `hsla(${pocket.hue}, 50%, 80%, ${alpha})`
  context.beginPath()
  context.arc(
    point.x,
    point.y,
    self.kind === 'water' ? 1.6 : 1.1,
    0,
    Math.PI * 2,
  )
  context.fill()
  context.restore()
}

function drawDoors(now: number, glow: number): void {
  if (!context) return
  for (const door of doors) {
    const open = door.openUntil > now
    if (!open && !reducedMotion) continue

    const remaining = open ? (door.openUntil - now) / MAX_DOOR_OPEN_MS : 0
    context.save()
    context.strokeStyle = `hsla(45, 90%, 70%, ${0.15 + remaining * 0.5 + glow * 0.35})`
    context.lineWidth = 2.4 + glow * 1.6
    context.beginPath()
    context.moveTo(door.ax, door.ay)
    context.lineTo(door.bx, door.by)
    context.stroke()
    context.restore()
  }
}

function renderFrame(timestamp: number): void {
  if (!context) return

  const elapsed = previousTimestamp ? timestamp - previousTimestamp : 16.67
  previousTimestamp = timestamp
  const delta = Math.min(2.2, Math.max(0.35, elapsed / 16.67))
  const now = performance.now()

  context.clearRect(0, 0, width, height)

  glowPulse *= 0.94

  for (const pocket of pockets) drawPocketFrame(pocket)
  drawDoors(now, glowPulse)

  if (!reducedMotion) {
    for (const droplet of droplets) updateDroplet(droplet, delta)
    for (const droplet of droplets) drawDroplet(droplet)
  }

  for (const inhabitant of inhabitants) updateInhabitant(inhabitant, delta, now)
  for (const inhabitant of inhabitants) drawInhabitant(inhabitant)

  animationFrameId = window.requestAnimationFrame(renderFrame)
}

function handleMotionPreference(event: MediaQueryListEvent): void {
  reducedMotion = event.matches
  seedInhabitants()
  seedDroplets()
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
  pockets.length = 0
  doors.length = 0
  inhabitants.length = 0
  droplets.length = 0
})
</script>

<style scoped>
.impossible-terrarium {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  opacity: 0.92;
  transform: translateZ(0);
}

@media (prefers-reduced-motion: reduce) {
  .impossible-terrarium {
    opacity: 0.75;
  }
}
</style>
