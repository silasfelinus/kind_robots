<template>
  <canvas ref="canvasRef" class="cloud-chamber-tracks" />
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'

const canvasRef = ref<HTMLCanvasElement | null>(null)

const TWO_PI = Math.PI * 2
const MAX_TRACKS = 48
const MAX_POINTS = 90
const SOURCE_COOLDOWN_MS = 1800
const SOURCE_SECONDS = 3.2 // a dropped source sparks a fan of alpha tracks

// A diffusion cloud chamber seen from above in a dark room. Alcohol vapour
// hangs over a cold black plate, lit from one side; whenever a charged
// particle passes through, a line of droplets condenses along its path and
// then slowly diffuses, sinks and fades. Three kinds of trail appear:
// short, fat, dead-straight alpha tracks (mostly from a sealed needle
// source near the rim), long thin muon streaks that cross the whole
// chamber, and feathery electron tracks that curl into tightening spirals
// in a weak magnetic field because they lose energy as they go.
// Every track lives in a fixed-size pool and is precomputed as a short
// polyline when it is born, so nothing grows over time.
// Hovering sweeps a torch beam that brightens the vapour it lights; a
// rate-limited click drops a tiny source that sprays a fan of alphas.

type TrackKind = 'alpha' | 'beta' | 'muon'

type Track = {
  active: boolean
  kind: TrackKind
  born: number
  life: number
  count: number
  xs: Float32Array
  ys: Float32Array
}

const tracks: Track[] = Array.from({ length: MAX_TRACKS }, () => ({
  active: false,
  kind: 'alpha' as TrackKind,
  born: 0,
  life: 1,
  count: 0,
  xs: new Float32Array(MAX_POINTS),
  ys: new Float32Array(MAX_POINTS),
}))

let context: CanvasRenderingContext2D | null = null
let resizeObserver: ResizeObserver | null = null
let motionQuery: MediaQueryList | null = null
let animationFrameId: number | null = null
let lastFrameTs = 0
let clock = 0
let width = 1
let height = 1
let reducedMotion = false
let pointerX = -1
let pointerY = -1
let lastSourceTs = 0
let dropX = 0
let dropY = 0
let dropStart = -100
let nextAmbient = 0
let nextNeedle = 0
let nextDrop = 0
let seed = 1

function random(): number {
  // mulberry32: deterministic so the reduced-motion still is stable.
  seed = (seed + 0x6d2b79f5) | 0
  let t = seed
  t = Math.imul(t ^ (t >>> 15), t | 1)
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296
}

function hash(n: number): number {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453
  return s - Math.floor(s)
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
  pointerX = point ? point.x : -1
  pointerY = point ? point.y : -1
}

function handlePointerDown(event: PointerEvent): void {
  if (reducedMotion) return
  const point = canvasPoint(event)
  if (!point) return
  const now = performance.now()
  if (now - lastSourceTs < SOURCE_COOLDOWN_MS) return
  lastSourceTs = now
  dropX = point.x
  dropY = point.y
  dropStart = clock
  nextDrop = clock
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
}

function unit(): number {
  return Math.min(width, height) / 700
}

function needlePosition(): { x: number; y: number } {
  return { x: width * 0.16, y: height * 0.78 }
}

function claimTrack(): Track {
  // Reuse a free slot, otherwise retire the oldest track.
  let oldest = tracks[0] as Track
  for (const track of tracks) {
    if (!track.active) return track
    if (track.born < oldest.born) oldest = track
  }
  return oldest
}

function spawnAlpha(x: number, y: number, heading: number, born: number): void {
  const track = claimTrack()
  const u = unit()
  const length = (45 + random() * 55) * u
  const steps = 14
  let px = x
  let py = y
  let h = heading
  track.xs[0] = px
  track.ys[0] = py
  for (let i = 1; i <= steps; i += 1) {
    // Alphas barely scatter until the very end, where a nuclear recoil
    // can leave a small kink.
    if (i === steps - 2 && random() < 0.25) h += (random() - 0.5) * 1.2
    px += Math.cos(h) * (length / steps)
    py += Math.sin(h) * (length / steps)
    track.xs[i] = px
    track.ys[i] = py
  }
  track.count = steps + 1
  track.kind = 'alpha'
  track.born = born
  track.life = 2.6 + random() * 1.2
  track.active = true
}

function spawnBeta(born: number): void {
  const track = claimTrack()
  const u = unit()
  let px = random() * width
  let py = random() * height
  let h = random() * TWO_PI
  const handed = random() < 0.5 ? 1 : -1 // e- and e+ curl opposite ways
  let curvature = (0.002 + random() * 0.004) / u
  const ds = 6 * u
  const steps = Math.min(MAX_POINTS, 50 + Math.floor(random() * 40))
  track.xs[0] = px
  track.ys[0] = py
  for (let i = 1; i < steps; i += 1) {
    h += handed * curvature * ds + (random() - 0.5) * 0.18
    curvature *= 1.035 // losing energy, the radius shrinks
    px += Math.cos(h) * ds
    py += Math.sin(h) * ds
    track.xs[i] = px
    track.ys[i] = py
  }
  track.count = steps
  track.kind = 'beta'
  track.born = born
  track.life = 3 + random() * 2
  track.active = true
}

function spawnMuon(born: number): void {
  const track = claimTrack()
  // Enter on one edge, leave on the opposite one, nearly straight.
  const vertical = random() < 0.5
  const x0 = vertical ? random() * width : -20
  const y0 = vertical ? -20 : random() * height
  const x1 = vertical ? x0 + (random() - 0.5) * width * 0.8 : width + 20
  const y1 = vertical ? height + 20 : y0 + (random() - 0.5) * height * 0.8
  const bow = (random() - 0.5) * 30 * unit()
  const steps = 24
  const nx = -(y1 - y0)
  const ny = x1 - x0
  const nl = Math.hypot(nx, ny) || 1
  for (let i = 0; i < steps; i += 1) {
    const t = i / (steps - 1)
    const b = Math.sin(t * Math.PI) * bow
    track.xs[i] = x0 + (x1 - x0) * t + (nx / nl) * b
    track.ys[i] = y0 + (y1 - y0) * t + (ny / nl) * b
  }
  track.count = steps
  track.kind = 'muon'
  track.born = born
  track.life = 1.8 + random() * 1.2
  track.active = true
}

function spawnNeedleAlpha(born: number): void {
  const n = needlePosition()
  // The needle sits near the rim, so its tracks fan inward.
  const heading = -Math.PI * 0.5 + (random() - 0.3) * Math.PI * 0.9
  spawnAlpha(n.x, n.y, heading, born)
}

function scheduleSpawns(): void {
  while (clock >= nextAmbient) {
    const roll = random()
    if (roll < 0.55) spawnBeta(nextAmbient)
    else if (roll < 0.8) spawnMuon(nextAmbient)
    else
      spawnAlpha(
        random() * width,
        random() * height,
        random() * TWO_PI,
        nextAmbient,
      )
    nextAmbient += 0.18 + random() * 0.4
  }
  while (clock >= nextNeedle) {
    spawnNeedleAlpha(nextNeedle)
    nextNeedle += 0.5 + random() * 0.9
  }
  if (clock - dropStart < SOURCE_SECONDS) {
    while (clock >= nextDrop) {
      spawnAlpha(dropX, dropY, random() * TWO_PI, nextDrop)
      nextDrop += 0.06 + random() * 0.08
    }
  }
}

function torchLight(x: number, y: number): number {
  if (pointerX < 0) return 0
  const dx = x - pointerX
  const dy = y - pointerY
  const reach = 160 * Math.max(0.7, unit())
  return Math.exp(-(dx * dx + dy * dy) / (reach * reach)) * 0.9
}

function drawChamber(): void {
  if (!context) return
  context.fillStyle = '#05070d'
  context.fillRect(0, 0, width, height)

  // Side lamp: a wash of cold light from the left edge.
  const lamp = context.createLinearGradient(0, 0, width, 0)
  lamp.addColorStop(0, 'rgba(120, 160, 210, 0.16)')
  lamp.addColorStop(0.5, 'rgba(70, 100, 150, 0.05)')
  lamp.addColorStop(1, 'rgba(0, 0, 0, 0)')
  context.fillStyle = lamp
  context.fillRect(0, 0, width, height)

  // Rolling vapour sheets, closed-form in time.
  for (let k = 0; k < 3; k += 1) {
    const y = height * (0.3 + k * 0.22) + Math.sin(clock * 0.15 + k * 2) * 20
    const sheet = context.createLinearGradient(0, y - 60, 0, y + 60)
    sheet.addColorStop(0, 'rgba(160, 190, 230, 0)')
    sheet.addColorStop(0.5, `rgba(160, 190, 230, ${0.025 + k * 0.01})`)
    sheet.addColorStop(1, 'rgba(160, 190, 230, 0)')
    context.fillStyle = sheet
    context.fillRect(0, y - 60, width, 120)
  }

  if (pointerX >= 0) {
    const r = 200 * Math.max(0.7, unit())
    const beam = context.createRadialGradient(
      pointerX,
      pointerY,
      0,
      pointerX,
      pointerY,
      r,
    )
    beam.addColorStop(0, 'rgba(200, 220, 255, 0.12)')
    beam.addColorStop(1, 'rgba(200, 220, 255, 0)')
    context.fillStyle = beam
    context.fillRect(pointerX - r, pointerY - r, r * 2, r * 2)
  }
}

function drawDrizzle(): void {
  if (!context) return
  // The supersaturated layer constantly rains a few fine droplets.
  const count = width < 600 ? 60 : 130
  for (let k = 0; k < count; k += 1) {
    const speed = 6 + hash(k * 1.7) * 10
    const x = hash(k * 3.1) * width + Math.sin(clock * 0.4 + k) * 4
    const y = (hash(k * 5.3) * height + clock * speed) % height
    const a = 0.12 + hash(k * 7.9) * 0.18 + torchLight(x, y) * 0.4
    context.fillStyle = `rgba(210, 225, 245, ${a})`
    context.fillRect(x, y, 1.2, 1.2)
  }
}

function drawTrack(track: Track): void {
  if (!context) return
  const age = clock - track.born
  if (age < 0) return
  if (age >= track.life) {
    track.active = false
    return
  }
  const p = age / track.life
  // Condense fast, then diffuse: the trail widens, sinks and fades.
  const appear = Math.min(1, age / 0.12)
  const fade = (1 - p) ** 1.6
  const u = unit()
  const baseWidth =
    track.kind === 'alpha' ? 3.2 : track.kind === 'muon' ? 1.1 : 1.4
  const lineWidth =
    (baseWidth + p * (track.kind === 'alpha' ? 5 : 3)) * Math.max(0.7, u)
  const sink = p * 10 * u
  const midIndex = Math.floor(track.count / 2)
  const light =
    0.55 + torchLight(track.xs[midIndex] ?? 0, track.ys[midIndex] ?? 0)
  const alpha = appear * fade * light
  if (alpha <= 0.01) return

  context.lineCap = 'round'
  context.lineJoin = 'round'
  // Soft halo then a brighter core.
  for (let pass = 0; pass < 2; pass += 1) {
    context.strokeStyle =
      pass === 0
        ? `rgba(170, 200, 240, ${alpha * 0.25})`
        : `rgba(235, 242, 255, ${alpha * (track.kind === 'alpha' ? 0.85 : 0.65)})`
    context.lineWidth = pass === 0 ? lineWidth * 3.2 : lineWidth
    context.beginPath()
    for (let i = 0; i < track.count; i += 1) {
      const wobble = Math.sin(i * 1.7 + track.born * 13) * p * 2.5 * u
      const x = (track.xs[i] ?? 0) + wobble
      const y = (track.ys[i] ?? 0) + sink + wobble * 0.5
      if (i === 0) context.moveTo(x, y)
      else context.lineTo(x, y)
    }
    context.stroke()
  }
}

function drawSources(): void {
  if (!context) return
  const u = Math.max(0.7, unit())
  const n = needlePosition()
  // The sealed needle source on its little stand.
  context.strokeStyle = 'rgba(150, 160, 175, 0.8)'
  context.lineWidth = 2 * u
  context.beginPath()
  context.moveTo(n.x - 40 * u, n.y + 26 * u)
  context.lineTo(n.x, n.y)
  context.stroke()
  context.fillStyle = 'rgba(200, 120, 90, 0.9)'
  context.beginPath()
  context.arc(n.x, n.y, 3 * u, 0, TWO_PI)
  context.fill()

  const dropAge = clock - dropStart
  if (dropAge >= 0 && dropAge < SOURCE_SECONDS + 1) {
    const a = Math.max(0, 1 - dropAge / (SOURCE_SECONDS + 1))
    context.fillStyle = `rgba(255, 170, 120, ${a})`
    context.beginPath()
    context.arc(dropX, dropY, 3.5 * u, 0, TWO_PI)
    context.fill()
  }
}

function drawFrame(): void {
  if (!context) return
  drawChamber()
  drawDrizzle()
  for (const track of tracks) if (track.active) drawTrack(track)
  drawSources()

  // The round chamber wall, dark at the corners.
  const vignette = context.createRadialGradient(
    width / 2,
    height / 2,
    Math.min(width, height) * 0.3,
    width / 2,
    height / 2,
    Math.max(width, height) * 0.75,
  )
  vignette.addColorStop(0, 'rgba(0, 0, 0, 0)')
  vignette.addColorStop(1, 'rgba(0, 0, 0, 0.7)')
  context.fillStyle = vignette
  context.fillRect(0, 0, width, height)
}

function resetPool(): void {
  for (const track of tracks) track.active = false
  nextAmbient = clock
  nextNeedle = clock
  dropStart = -100
}

function renderFrame(timestamp: number): void {
  if (!context) return
  const dt = lastFrameTs ? Math.min(0.1, (timestamp - lastFrameTs) / 1000) : 0
  lastFrameTs = timestamp
  clock += dt
  scheduleSpawns()
  drawFrame()
  animationFrameId = window.requestAnimationFrame(renderFrame)
}

function drawStill(): void {
  // A deterministic frame with tracks at every stage of fading.
  seed = 7
  clock = 0
  pointerX = -1
  pointerY = -1
  resetPool()
  clock = 4.5
  scheduleSpawns()
  drawFrame()
}

function handleMotionChange(event: MediaQueryListEvent): void {
  reducedMotion = event.matches
  pointerX = -1
  pointerY = -1
  if (reducedMotion) {
    if (animationFrameId !== null) window.cancelAnimationFrame(animationFrameId)
    animationFrameId = null
    drawStill()
  } else if (animationFrameId === null) {
    lastFrameTs = 0
    resetPool()
    animationFrameId = window.requestAnimationFrame(renderFrame)
  }
}

onMounted(() => {
  const canvas = canvasRef.value
  if (!canvas) return
  context = canvas.getContext('2d')
  if (!context) return

  motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
  reducedMotion = motionQuery.matches
  motionQuery.addEventListener('change', handleMotionChange)

  resizeObserver = new ResizeObserver(() => {
    resizeCanvas()
    if (reducedMotion) drawStill()
  })
  resizeObserver.observe(canvas)
  window.addEventListener('pointermove', handlePointerMove, { passive: true })
  window.addEventListener('pointerdown', handlePointerDown, { passive: true })
  resizeCanvas()
  if (reducedMotion) drawStill()
  else {
    seed = Math.floor(Math.random() * 1e9)
    resetPool()
    animationFrameId = window.requestAnimationFrame(renderFrame)
  }
})

onBeforeUnmount(() => {
  if (animationFrameId !== null) window.cancelAnimationFrame(animationFrameId)
  resizeObserver?.disconnect()
  motionQuery?.removeEventListener('change', handleMotionChange)
  window.removeEventListener('pointermove', handlePointerMove)
  window.removeEventListener('pointerdown', handlePointerDown)
  context = null
})
</script>

<style scoped>
.cloud-chamber-tracks {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}
</style>
