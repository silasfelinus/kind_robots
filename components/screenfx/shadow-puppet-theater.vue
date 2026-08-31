<!-- /components/screenfx/shadow-puppet-theater.vue -->
<template>
  <canvas ref="canvasRef" class="shadow-puppet-theater" />
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'

// A backlit paper screen where jointed shadow-puppet cutouts perform short
// wordless vignettes (a bird released from a cage, a boat crossing choppy
// water, a lantern-bearer climbing a hill). See PITCHES.yaml
// (shadow-puppet-theater) for the pitch and SPEC.md for the experience
// contract this build satisfies.

// ---- Path2D helpers ---------------------------------------------------
// Puppet body parts are built once per mount (not rebuilt per frame); only
// their per-joint rotation/translation changes each frame via
// save()/translate()/rotate()/restore(), per the pitch's technique note.

function ovalPath(rx: number, ry: number): Path2D {
  const path = new Path2D()
  path.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2)
  return path
}

// A tapered limb/wing/rod shape. The proximal joint sits at local (0, 0);
// the shape extends toward local +x, so rotating this bone rotates it
// around its proximal joint exactly like a real puppet rod.
function limbPath(length: number, width: number): Path2D {
  const path = new Path2D()
  const rNear = width / 2
  const rFar = width / 2.6
  path.moveTo(0, -rNear)
  path.lineTo(length * 0.7, -rFar)
  path.quadraticCurveTo(length, -rFar * 0.5, length, 0)
  path.quadraticCurveTo(length, rFar * 0.5, length * 0.7, rFar)
  path.lineTo(0, rNear)
  path.closePath()
  return path
}

function trianglePath(base: number, height: number): Path2D {
  const path = new Path2D()
  path.moveTo(0, -height / 2)
  path.lineTo(base, 0)
  path.lineTo(0, height / 2)
  path.closePath()
  return path
}

function polygonPath(points: ReadonlyArray<readonly [number, number]>): Path2D {
  const path = new Path2D()
  const first = points[0]
  if (!first) return path
  path.moveTo(first[0], first[1])
  for (let i = 1; i < points.length; i += 1) {
    const point = points[i]!
    path.lineTo(point[0], point[1])
  }
  path.closePath()
  return path
}

// ---- Cached silhouette cutouts -----------------------------------------

const BIRD_BODY = limbPath(24, 13)
const BIRD_HEAD = ovalPath(5.5, 5)
const BIRD_BEAK = trianglePath(6, 5)
const BIRD_WING = limbPath(19, 9)
const BIRD_TAIL = trianglePath(9, 10)

const FIGURE_TORSO = limbPath(24, 11)
const FIGURE_THIGH = limbPath(15, 7)
const FIGURE_SHIN = limbPath(15, 5.5)
const FIGURE_ARM = limbPath(13, 5)
const FIGURE_ROD = limbPath(16, 2.4)
const FIGURE_HEAD = ovalPath(5.5, 6)
const LANTERN_BODY = polygonPath([
  [-6, -8],
  [6, -8],
  [8, 0],
  [6, 8],
  [-6, 8],
  [-8, 0],
])

const BOAT_HULL = polygonPath([
  [-26, 4],
  [-15, -7],
  [15, -7],
  [26, 4],
  [15, 9],
  [-15, 9],
])
const BOAT_MAST = limbPath(24, 3)
const BOAT_SAIL = trianglePath(14, 20)
const BOAT_ROWER_BODY = ovalPath(6, 8)
const BOAT_OAR = limbPath(20, 2.6)

const HAND_SHADOW = polygonPath([
  [0, 0],
  [4, -18],
  [8, -30],
  [11, -28],
  [9, -16],
  [14, -32],
  [17, -30],
  [14, -17],
  [19, -30],
  [22, -27],
  [18, -15],
  [23, -24],
  [26, -20],
  [18, -6],
  [10, 2],
])

// ---- Types --------------------------------------------------------------

type VignetteId = 'bird' | 'boat' | 'lantern'

interface PointerState {
  x: number
  y: number
  active: boolean
}

const VIGNETTE_ORDER: readonly VignetteId[] = ['bird', 'boat', 'lantern']
const VIGNETTE_ACTIVE_MS = 13000
const VIGNETTE_HOLD_MS = 1800
const VIGNETTE_TOTAL_MS = VIGNETTE_ACTIVE_MS + VIGNETTE_HOLD_MS

const PUPPET_FILL = 'rgba(32, 20, 12, 0.92)'
const SCENERY_STROKE = 'rgba(48, 32, 18, 0.55)'
const SCENERY_FILL = 'rgba(44, 30, 17, 0.5)'

// ---- Mutable render state (fresh per mount) ------------------------------

const canvasRef = ref<HTMLCanvasElement | null>(null)

let animationFrameId: number | null = null
let resizeObserver: ResizeObserver | null = null
let motionQuery: MediaQueryList | null = null
let context: CanvasRenderingContext2D | null = null
let width = 1
let height = 1
let previousTimestamp = 0
let reducedMotion = false

let sceneTime = 0
let vignetteIndex = 0
let vignetteElapsed = 0
let wingPhase = 0
let gaitPhase = 0
let rowPhase = 0
let lanternSwingPhase = 0
let handAlpha = 0

const backlight = { x: 0, y: 0 }
const pointer: PointerState = { x: 0, y: 0, active: false }

function puppetScale(): number {
  return Math.max(0.7, Math.min(width, height) / 460)
}

function hillY(xFrac: number): number {
  return height * (0.82 - xFrac * 0.42)
}

// ---- Backlit paper screen -------------------------------------------------

function drawBacklitScreen(): void {
  if (!context) return
  context.fillStyle = 'rgba(18, 12, 8, 0.14)'
  context.fillRect(0, 0, width, height)

  const radius = Math.max(width, height) * 0.62
  const gradient = context.createRadialGradient(
    backlight.x,
    backlight.y,
    0,
    backlight.x,
    backlight.y,
    radius,
  )
  gradient.addColorStop(0, 'rgba(255, 214, 150, 0.42)')
  gradient.addColorStop(0.45, 'rgba(255, 190, 120, 0.22)')
  gradient.addColorStop(1, 'rgba(30, 18, 10, 0)')
  context.fillStyle = gradient
  context.fillRect(0, 0, width, height)
}

function updateBacklightDrift(): void {
  const driftX = Math.sin(sceneTime * 0.00026) * width * 0.2
  const driftY = Math.sin(sceneTime * 0.00019 + 1.4) * height * 0.11
  backlight.x = width * 0.5 + driftX
  backlight.y = height * 0.3 + driftY
}

// A puppet is drawn twice: a soft, blurred, backlight-offset duplicate
// first (the diffuse penumbra), then a crisp full-alpha copy on top. The
// offset direction and blur amount track the backlight's position, so the
// cast-shadow angle/softness visibly changes as the light drifts, while the
// crisp copy (constant alpha, constant fill) always stays legible -- it
// never flattens into the background and never washes out.
function drawPuppetWithShadow(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  draw: (ctx: CanvasRenderingContext2D) => void,
): void {
  const dx = x - backlight.x
  const dy = y - backlight.y
  const dist = Math.max(1, Math.hypot(dx, dy))
  const maxDist = Math.max(width, height) * 0.55
  const proximity = Math.min(1, dist / maxDist)
  const offsetX = (dx / dist) * (2 + proximity * 7)
  const offsetY = (dy / dist) * (2 + proximity * 7)
  const blur = 1 + proximity * 3.5

  ctx.save()
  ctx.translate(x + offsetX, y + offsetY)
  ctx.filter = `blur(${blur.toFixed(1)}px)`
  ctx.globalAlpha = 0.32
  draw(ctx)
  ctx.restore()

  ctx.save()
  ctx.translate(x, y)
  ctx.filter = 'none'
  ctx.globalAlpha = 1
  draw(ctx)
  ctx.restore()
}

// ---- Scenery (recomputed per frame from width/height, not cached) -------

function drawCageScenery(t: number): void {
  if (!context) return
  const cx = width * 0.24
  const cy = height * 0.34
  const cageW = Math.max(70, Math.min(width, height) * 0.16)
  const cageH = cageW * 1.15

  context.strokeStyle = SCENERY_STROKE
  context.lineWidth = Math.max(1.5, cageW * 0.02)
  context.lineCap = 'round'

  context.beginPath()
  context.moveTo(cx, 0)
  context.lineTo(cx, cy - cageH / 2)
  context.stroke()

  context.strokeRect(cx - cageW / 2, cy - cageH / 2, cageW, cageH)

  const barCount = 5
  context.beginPath()
  for (let i = 1; i < barCount; i += 1) {
    const barX = cx - cageW / 2 + (cageW / barCount) * i
    context.moveTo(barX, cy - cageH / 2)
    context.lineTo(barX, cy + cageH / 2)
  }
  context.stroke()

  const doorOpenT = Math.min(1, Math.max(0, (t - 0.08) / 0.16))
  const doorAngle = doorOpenT * -1.15
  const hingeX = cx + cageW / 2 - cageW / barCount
  const hingeY = cy - cageH / 2

  context.save()
  context.translate(hingeX, hingeY)
  context.rotate(doorAngle)
  context.beginPath()
  context.moveTo(0, 0)
  context.lineTo(0, cageH)
  context.stroke()
  context.restore()
}

function drawWaterScenery(): void {
  if (!context) return
  const baseline = height * 0.74

  context.strokeStyle = SCENERY_STROKE
  context.lineWidth = 1.4

  const bands = [
    { offset: 0, amp: height * 0.012 },
    { offset: 18, amp: height * 0.018 },
    { offset: 40, amp: height * 0.01 },
  ]
  for (const band of bands) {
    context.beginPath()
    const steps = 28
    for (let i = 0; i <= steps; i += 1) {
      const x = (i / steps) * width
      const y =
        baseline +
        band.offset +
        Math.sin(i * 0.6 + sceneTime * 0.0016 + band.offset) * band.amp
      if (i === 0) context.moveTo(x, y)
      else context.lineTo(x, y)
    }
    context.stroke()
  }

  context.fillStyle = SCENERY_FILL
  context.fillRect(
    width * 0.86,
    baseline - height * 0.1,
    Math.max(4, width * 0.01),
    height * 0.16,
  )
}

function drawHillScenery(): void {
  if (!context) return
  context.beginPath()
  context.moveTo(0, height)
  const steps = 20
  for (let i = 0; i <= steps; i += 1) {
    const xFrac = i / steps
    context.lineTo(xFrac * width, hillY(xFrac))
  }
  context.lineTo(width, height)
  context.closePath()
  context.fillStyle = SCENERY_FILL
  context.fill()
}

function drawScenery(vignette: VignetteId, t: number): void {
  if (vignette === 'bird') drawCageScenery(t)
  else if (vignette === 'boat') drawWaterScenery()
  else drawHillScenery()
}

// ---- Bird puppet ----------------------------------------------------------

function drawBirdParts(
  ctx: CanvasRenderingContext2D,
  angle: number,
  scale: number,
  phase: number,
  amplitude: number,
): void {
  ctx.rotate(angle)
  ctx.scale(scale, scale)
  ctx.fillStyle = PUPPET_FILL

  ctx.save()
  ctx.translate(11, -1)
  ctx.rotate(Math.PI * 0.95 + Math.sin(phase + 0.6) * amplitude)
  ctx.fill(BIRD_WING)
  ctx.restore()

  ctx.save()
  ctx.rotate(Math.PI)
  ctx.fill(BIRD_TAIL)
  ctx.restore()

  ctx.fill(BIRD_BODY)

  ctx.save()
  ctx.translate(11, -1)
  ctx.rotate(Math.PI * 0.95 + Math.sin(phase) * amplitude)
  ctx.fill(BIRD_WING)
  ctx.restore()

  ctx.save()
  ctx.translate(24, -2)
  ctx.rotate(Math.sin(phase * 0.3) * 0.08)
  ctx.fill(BIRD_HEAD)
  ctx.save()
  ctx.translate(5, 0)
  ctx.fill(BIRD_BEAK)
  ctx.restore()
  ctx.restore()
}

function drawBirdVignette(t: number): void {
  if (!context) return
  const cx = width * 0.24
  const cy = height * 0.34
  const cageW = Math.max(70, Math.min(width, height) * 0.16)
  const cageH = cageW * 1.15
  const perchY = cy + cageH * 0.18
  const doorX = cx + cageW * 0.42
  const doorY = cy

  let x = cx
  let y = perchY
  let angle = 0
  let amplitude = 0.14 + Math.sin(wingPhase * 0.6) * 0.03

  if (t >= 0.22 && t < 0.42) {
    const hopT = (t - 0.22) / 0.2
    x = cx + (doorX - cx) * hopT
    y = perchY + (doorY - perchY) * hopT
    amplitude = 0.18
  } else if (t >= 0.42) {
    const flyT = (t - 0.42) / 0.58
    const eased = flyT * flyT * (3 - 2 * flyT)
    x = doorX + eased * width * 0.7
    y = doorY - eased ** 1.2 * height * 0.42
    angle = -0.15 - eased * 0.35
    amplitude = 0.32 + eased * 0.24
  }

  drawPuppetWithShadow(context, x, y, (ctx) =>
    drawBirdParts(ctx, angle, puppetScale(), wingPhase, amplitude),
  )
}

// ---- Boat puppet ------------------------------------------------------

function drawBoatParts(
  ctx: CanvasRenderingContext2D,
  tilt: number,
  scale: number,
  phase: number,
): void {
  ctx.rotate(tilt)
  ctx.scale(scale, scale)
  ctx.fillStyle = PUPPET_FILL

  ctx.fill(BOAT_HULL)

  ctx.save()
  ctx.translate(-2, -7)
  ctx.rotate(-Math.PI / 2)
  ctx.fill(BOAT_MAST)
  ctx.restore()

  ctx.save()
  ctx.translate(-2, -29)
  ctx.rotate(Math.sin(phase * 0.4) * 0.05)
  ctx.fill(BOAT_SAIL)
  ctx.restore()

  ctx.save()
  ctx.translate(2, -9)
  ctx.fill(BOAT_ROWER_BODY)
  ctx.save()
  ctx.translate(0, -3)
  ctx.rotate(Math.PI * 0.15 + Math.sin(phase) * 0.55)
  ctx.fill(BOAT_OAR)
  ctx.restore()
  ctx.restore()
}

function drawBoatVignette(t: number): void {
  if (!context) return
  const baseline = height * 0.74
  const startX = -width * 0.12
  const dockX = width * 0.84
  const eased = t * t * (3 - 2 * t)
  const x = startX + (dockX - startX) * eased
  const bob =
    Math.sin(sceneTime * 0.006) * height * 0.012 +
    Math.sin(sceneTime * 0.013 + 1.1) * height * 0.006
  const y = baseline + bob
  const settle = t < 1 ? 1 : 0.35
  const tilt = Math.sin(sceneTime * 0.007 + 0.4) * 0.05 * settle

  drawPuppetWithShadow(context, x, y, (ctx) =>
    drawBoatParts(ctx, tilt, puppetScale() * 1.05, rowPhase * settle),
  )
}

// ---- Lantern-bearer puppet ----------------------------------------------

function drawFigureParts(
  ctx: CanvasRenderingContext2D,
  lean: number,
  scale: number,
  gait: number,
  lanternSwing: number,
): void {
  ctx.rotate(lean)
  ctx.scale(scale, scale)
  ctx.fillStyle = PUPPET_FILL

  const hipSwingFar = Math.sin(gait + Math.PI) * 0.5
  const kneeBendFar = Math.max(0, Math.sin(gait + Math.PI / 2)) * 0.7
  const hipSwingNear = Math.sin(gait) * 0.5
  const kneeBendNear = Math.max(0, Math.sin(gait - Math.PI / 2)) * 0.7

  // far leg
  ctx.save()
  ctx.rotate(Math.PI / 2 + hipSwingFar)
  ctx.fill(FIGURE_THIGH)
  ctx.save()
  ctx.translate(15, 0)
  ctx.rotate(kneeBendFar)
  ctx.fill(FIGURE_SHIN)
  ctx.restore()
  ctx.restore()

  // torso group
  ctx.save()
  ctx.rotate(-Math.PI / 2)
  ctx.fill(FIGURE_TORSO)

  ctx.save()
  ctx.translate(18, 3)
  ctx.rotate(Math.PI / 2 - hipSwingNear * 0.6)
  ctx.fill(FIGURE_ARM)
  ctx.restore()

  ctx.save()
  ctx.translate(18, -3)
  ctx.rotate(Math.PI / 2 + 0.3)
  ctx.fill(FIGURE_ARM)
  ctx.save()
  ctx.translate(13, 0)
  ctx.rotate(Math.PI / 2 + Math.sin(lanternSwing) * 0.18)
  ctx.fill(FIGURE_ROD)
  ctx.save()
  ctx.translate(16, 0)
  ctx.fillStyle = 'rgba(255, 200, 120, 0.55)'
  ctx.beginPath()
  ctx.arc(0, 0, 9, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = PUPPET_FILL
  ctx.fill(LANTERN_BODY)
  ctx.restore()
  ctx.restore()
  ctx.restore()

  ctx.save()
  ctx.translate(24, -1)
  ctx.fill(FIGURE_HEAD)
  ctx.restore()

  ctx.restore()

  // near leg
  ctx.save()
  ctx.rotate(Math.PI / 2 + hipSwingNear)
  ctx.fill(FIGURE_THIGH)
  ctx.save()
  ctx.translate(15, 0)
  ctx.rotate(kneeBendNear)
  ctx.fill(FIGURE_SHIN)
  ctx.restore()
  ctx.restore()
}

function drawLanternVignette(t: number): void {
  if (!context) return
  const xFrac = 0.08 + t * 0.78
  const x = xFrac * width
  const groundY = hillY(xFrac) - Math.max(20, Math.min(width, height) * 0.05)
  const slope =
    hillY(Math.min(1, xFrac + 0.02)) - hillY(Math.max(0, xFrac - 0.02))
  const lean = Math.atan2(slope, width * 0.04) * 0.4
  const bob = Math.abs(Math.sin(gaitPhase * 2)) * height * 0.006

  drawPuppetWithShadow(context, x, groundY - bob, (ctx) =>
    drawFigureParts(
      ctx,
      lean,
      puppetScale() * 0.95,
      gaitPhase,
      lanternSwingPhase,
    ),
  )
}

// ---- Hand-shadow (optional, additive, non-blocking pointer joiner) ------

function updateHandShadow(deltaMs: number): void {
  const target = pointer.active ? 1 : 0
  handAlpha += (target - handAlpha) * Math.min(1, deltaMs * 0.006)
}

function drawHandShadow(): void {
  if (!context || handAlpha < 0.01) return
  context.save()
  context.translate(pointer.x, pointer.y)
  const scale = puppetScale() * 0.9
  context.scale(scale, scale)
  context.globalAlpha = handAlpha * 0.4
  context.filter = 'blur(1.5px)'
  context.fillStyle = PUPPET_FILL
  context.fill(HAND_SHADOW)
  context.restore()
}

// ---- Pointer + resize plumbing ------------------------------------------

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
  if (!point) {
    pointer.active = false
    return
  }
  pointer.x = point.x
  pointer.y = point.y
  pointer.active = true
}

function advanceVignette(): void {
  vignetteIndex = (vignetteIndex + 1) % VIGNETTE_ORDER.length
  vignetteElapsed = 0
}

function handlePointerDown(event: PointerEvent): void {
  if (reducedMotion) return
  const point = canvasPoint(event.clientX, event.clientY)
  if (!point) return
  advanceVignette()
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

  backlight.x = width * 0.5
  backlight.y = height * 0.32
}

// ---- Main render loop -----------------------------------------------------

function renderFullScene(deltaMs: number): void {
  if (!context) return

  sceneTime += deltaMs
  updateBacklightDrift()
  drawBacklitScreen()

  vignetteElapsed += deltaMs
  if (vignetteElapsed >= VIGNETTE_TOTAL_MS) {
    vignetteIndex = (vignetteIndex + 1) % VIGNETTE_ORDER.length
    vignetteElapsed = 0
  }

  const activeT = Math.min(1, vignetteElapsed / VIGNETTE_ACTIVE_MS)
  wingPhase += deltaMs * 0.006
  gaitPhase += deltaMs * 0.005
  rowPhase += deltaMs * 0.0045
  lanternSwingPhase += deltaMs * 0.0035

  const vignette = VIGNETTE_ORDER[vignetteIndex] ?? 'bird'
  drawScenery(vignette, activeT)

  if (vignette === 'bird') drawBirdVignette(activeT)
  else if (vignette === 'boat') drawBoatVignette(activeT)
  else drawLanternVignette(activeT)

  updateHandShadow(deltaMs)
  drawHandShadow()
}

function renderReducedMotion(deltaMs: number): void {
  if (!context) return
  wingPhase += deltaMs * 0.0018
  drawBacklitScreen()

  const x = width * 0.5
  const y = height * 0.55
  const amplitude = 0.22 + Math.sin(wingPhase) * 0.05

  drawPuppetWithShadow(context, x, y, (ctx) =>
    drawBirdParts(ctx, 0, puppetScale(), wingPhase, amplitude),
  )
}

function renderFrame(timestamp: number): void {
  if (!context) return

  const elapsed = previousTimestamp ? timestamp - previousTimestamp : 16.67
  previousTimestamp = timestamp
  const deltaMs = Math.min(48, Math.max(2, elapsed))

  context.clearRect(0, 0, width, height)

  if (reducedMotion) {
    renderReducedMotion(deltaMs)
  } else {
    renderFullScene(deltaMs)
  }

  animationFrameId = window.requestAnimationFrame(renderFrame)
}

function handleMotionPreference(event: MediaQueryListEvent): void {
  reducedMotion = event.matches
  if (reducedMotion) {
    pointer.active = false
    handAlpha = 0
    backlight.x = width * 0.5
    backlight.y = height * 0.32
  } else {
    vignetteIndex = 0
    vignetteElapsed = 0
  }
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
})
</script>

<style scoped>
.shadow-puppet-theater {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  opacity: 0.9;
  transform: translateZ(0);
}

@media (prefers-reduced-motion: reduce) {
  .shadow-puppet-theater {
    opacity: 0.68;
  }
}
</style>
