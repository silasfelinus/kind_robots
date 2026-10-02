<template>
  <canvas ref="canvasRef" class="crease-fold-atlas" />
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'

const canvasRef = ref<HTMLCanvasElement | null>(null)

const COLUMNS = 8
const ROWS = 5
const COLUMN_HINGES = COLUMNS - 1
const ROW_HINGES = ROWS - 1
const HINGE_COUNT = COLUMN_HINGES + ROW_HINGES
const TRANSITION_MS = 4200
// Each hinge starts a little after the previous one so the sheet ripples.
const HINGE_STAGGER_MS = 240
const FLAT_HOLD_MS = 1400
const FOLDED_HOLD_MS = 4800
const CLICK_COOLDOWN_MS = 1500
const NUDGE_RADIUS = 110
const NUDGE_MAX_RAD = 0.2
const NUDGE_DECAY = 0.94
const REDUCED_STATE = 3
const REDUCED_BREATHE_MS = 24000
const VIEW_TILT = 0.62
const BACKGROUND_TOP = '#1d1b2e'
const BACKGROUND_BOTTOM = '#2e2a3d'

interface FoldState {
  name: string
  // Column hinge angles followed by row hinge angles, in radians.
  angles: number[]
  hold: number
}

function alternating(count: number, amount: number): number[] {
  return Array.from({ length: count }, (_, i) =>
    i % 2 === 0 ? amount : -amount,
  )
}

const ZERO_COLUMNS = new Array<number>(COLUMN_HINGES).fill(0)
const ZERO_ROWS = new Array<number>(ROW_HINGES).fill(0)

// Fixed rotation of named shapes; every second shape is the flat sheet.
const STATES: FoldState[] = [
  { name: 'flat', angles: [...ZERO_COLUMNS, ...ZERO_ROWS], hold: FLAT_HOLD_MS },
  {
    name: 'accordion',
    angles: [...alternating(COLUMN_HINGES, 1.15), ...ZERO_ROWS],
    hold: FOLDED_HOLD_MS,
  },
  { name: 'flat', angles: [...ZERO_COLUMNS, ...ZERO_ROWS], hold: FLAT_HOLD_MS },
  {
    name: 'arch',
    angles: [0.55, 0.55, 0.55, 0, -0.55, -0.55, -0.55, ...ZERO_ROWS],
    hold: FOLDED_HOLD_MS,
  },
  { name: 'flat', angles: [...ZERO_COLUMNS, ...ZERO_ROWS], hold: FLAT_HOLD_MS },
  {
    name: 'eggcrate',
    angles: [
      ...alternating(COLUMN_HINGES, 0.9),
      ...alternating(ROW_HINGES, 0.8),
    ],
    hold: FOLDED_HOLD_MS,
  },
  { name: 'flat', angles: [...ZERO_COLUMNS, ...ZERO_ROWS], hold: FLAT_HOLD_MS },
  {
    name: 'stairs',
    angles: [1.4, -1.4, 0, 1.4, -1.4, 0, 1.4, ...ZERO_ROWS],
    hold: FOLDED_HOLD_MS,
  },
  { name: 'flat', angles: [...ZERO_COLUMNS, ...ZERO_ROWS], hold: FLAT_HOLD_MS },
  {
    name: 'bowl',
    angles: [0.5, 0.5, 0.5, 0, -0.5, -0.5, -0.5, 0.45, 0.45, -0.45, -0.45],
    hold: FOLDED_HOLD_MS,
  },
]

type Mat3 = [
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
]
type Vec3 = [number, number, number]

function mul(a: Mat3, b: Mat3): Mat3 {
  const out = new Array<number>(9)
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 3; c++) {
      out[r * 3 + c] =
        (a[r * 3] as number) * (b[c] as number) +
        (a[r * 3 + 1] as number) * (b[3 + c] as number) +
        (a[r * 3 + 2] as number) * (b[6 + c] as number)
    }
  }
  return out as Mat3
}

function apply(m: Mat3, v: Vec3): Vec3 {
  return [
    m[0] * v[0] + m[1] * v[1] + m[2] * v[2],
    m[3] * v[0] + m[4] * v[1] + m[5] * v[2],
    m[6] * v[0] + m[7] * v[1] + m[8] * v[2],
  ]
}

function rotY(a: number): Mat3 {
  const c = Math.cos(a)
  const s = Math.sin(a)
  return [c, 0, s, 0, 1, 0, -s, 0, c]
}

function rotX(a: number): Mat3 {
  const c = Math.cos(a)
  const s = Math.sin(a)
  return [1, 0, 0, 0, c, -s, 0, s, c]
}

interface Frame {
  origin: Vec3
  rot: Mat3
}

interface Panel {
  column: number
  row: number
  corners: Vec3[]
  center: Vec3
  normal: Vec3
}

const IDENTITY: Mat3 = [1, 0, 0, 0, 1, 0, 0, 0, 1]

function step(frame: Frame, offset: Vec3, rot: Mat3): Frame {
  const moved = apply(frame.rot, offset)
  return {
    origin: [
      frame.origin[0] + moved[0],
      frame.origin[1] + moved[1],
      frame.origin[2] + moved[2],
    ],
    rot: mul(frame.rot, rot),
  }
}

function buildPanels(angles: number[]): Panel[] {
  const panels: Panel[] = []
  let columnFrame: Frame = { origin: [0, 0, 0], rot: IDENTITY }
  for (let c = 0; c < COLUMNS; c++) {
    if (c > 0) {
      columnFrame = step(columnFrame, [1, 0, 0], rotY(angles[c - 1] as number))
    }
    let rowFrame = columnFrame
    for (let r = 0; r < ROWS; r++) {
      if (r > 0) {
        rowFrame = step(
          rowFrame,
          [0, -1, 0],
          rotX(angles[COLUMN_HINGES + r - 1] as number),
        )
      }
      const local: Vec3[] = [
        [0, 0, 0],
        [1, 0, 0],
        [1, -1, 0],
        [0, -1, 0],
      ]
      const corners = local.map((p) => {
        const w = apply(rowFrame.rot, p)
        return [
          w[0] + rowFrame.origin[0],
          w[1] + rowFrame.origin[1],
          w[2] + rowFrame.origin[2],
        ] as Vec3
      })
      const center = apply(rowFrame.rot, [0.5, -0.5, 0])
      panels.push({
        column: c,
        row: r,
        corners,
        center: [
          center[0] + rowFrame.origin[0],
          center[1] + rowFrame.origin[1],
          center[2] + rowFrame.origin[2],
        ],
        normal: apply(rowFrame.rot, [0, 0, 1]),
      })
    }
  }
  return panels
}

function seeded(seed: number): () => number {
  let state = seed >>> 0
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0
    return state / 4294967296
  }
}

// Deterministic per-hinge start delay: index order plus a small fixed jitter.
const HINGE_DELAYS: number[] = (() => {
  const random = seeded(4417)
  return Array.from(
    { length: HINGE_COUNT },
    (_, i) => i * HINGE_STAGGER_MS + random() * HINGE_STAGGER_MS,
  )
})()
const MAX_DELAY = Math.max(...HINGE_DELAYS)

let context: CanvasRenderingContext2D | null = null
let resizeObserver: ResizeObserver | null = null
let motionQuery: MediaQueryList | null = null
let animationFrameId: number | null = null
let width = 1
let height = 1
let previousTimestamp = 0
let reducedMotion = false
let stateIndex = 1
let stateTimeMs = 0
let fromAngles: number[] = [...(STATES[0] as FoldState).angles]
let currentAngles: number[] = [...fromAngles]
let nudges: number[] = new Array<number>(HINGE_COUNT).fill(0)
let lastClickTs = 0
let pointerActive = false
let pointerX = 0
let pointerY = 0
let lastScreenCenters: { column: number; row: number; x: number; y: number }[] =
  []

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value))
}

function smooth(value: number): number {
  const t = clamp01(value)
  return t * t * (3 - 2 * t)
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
  pointerActive = Boolean(point)
  if (point) {
    pointerX = point.x
    pointerY = point.y
  }
}

function beginTransition(next: number): void {
  fromAngles = [...currentAngles]
  stateIndex = next % STATES.length
  stateTimeMs = 0
}

function handlePointerDown(event: PointerEvent): void {
  if (reducedMotion) return
  if (!canvasPoint(event)) return
  const now = performance.now()
  if (now - lastClickTs < CLICK_COOLDOWN_MS) return
  lastClickTs = now
  beginTransition(stateIndex + 1)
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

function updateAngles(delta: number): void {
  const state = STATES[stateIndex] as FoldState
  stateTimeMs += delta
  for (let i = 0; i < HINGE_COUNT; i++) {
    const target = state.angles[i] as number
    const from = fromAngles[i] as number
    const progress = smooth(
      (stateTimeMs - (HINGE_DELAYS[i] as number)) / TRANSITION_MS,
    )
    currentAngles[i] = from + (target - from) * progress
  }
  if (stateTimeMs > TRANSITION_MS + MAX_DELAY + state.hold) {
    beginTransition(stateIndex + 1)
  }
}

function updateNudges(): void {
  for (let i = 0; i < HINGE_COUNT; i++) {
    nudges[i] = (nudges[i] as number) * NUDGE_DECAY
  }
  if (!pointerActive) return
  for (const spot of lastScreenCenters) {
    if (Math.hypot(pointerX - spot.x, pointerY - spot.y) > NUDGE_RADIUS)
      continue
    // Nudge the two hinges that bound the panel under the pointer.
    const columnHinge = Math.max(0, spot.column - 1)
    const rowHinge = COLUMN_HINGES + Math.max(0, spot.row - 1)
    if (spot.column > 0) {
      nudges[columnHinge] = Math.min(
        NUDGE_MAX_RAD,
        (nudges[columnHinge] as number) + 0.012,
      )
    }
    if (spot.row > 0) {
      nudges[rowHinge] = Math.min(
        NUDGE_MAX_RAD,
        (nudges[rowHinge] as number) + 0.012,
      )
    }
  }
}

function renderFrame(timestamp: number): void {
  if (!context) return
  const elapsed = previousTimestamp ? timestamp - previousTimestamp : 16.67
  previousTimestamp = timestamp
  const delta = Math.min(50, Math.max(4, elapsed))

  let angles: number[]
  if (reducedMotion) {
    angles = (STATES[REDUCED_STATE] as FoldState).angles
  } else {
    updateAngles(delta)
    updateNudges()
    angles = currentAngles.map((a, i) => a + (nudges[i] as number))
  }

  const background = context.createLinearGradient(0, 0, 0, height)
  background.addColorStop(0, BACKGROUND_TOP)
  background.addColorStop(1, BACKGROUND_BOTTOM)
  context.fillStyle = background
  context.fillRect(0, 0, width, height)

  const panels = buildPanels(angles)
  // Recentre the folded form so it never drifts off the surface.
  const mean: Vec3 = [0, 0, 0]
  for (const panel of panels) {
    mean[0] += panel.center[0] / panels.length
    mean[1] += panel.center[1] / panels.length
    mean[2] += panel.center[2] / panels.length
  }
  const yaw = reducedMotion ? -0.5 : -0.5 + Math.sin(timestamp / 14000) * 0.35
  const view = mul(rotX(VIEW_TILT), rotY(yaw))
  const scale = Math.min((width * 0.9) / 9, (height * 0.8) / 6.5)
  const camera = scale * 22
  const cx = width / 2
  const cy = height / 2

  const project = (p: Vec3): { x: number; y: number; z: number } => {
    const v = apply(view, [p[0] - mean[0], p[1] - mean[1], p[2] - mean[2]])
    const k = camera / (camera - v[2] * scale)
    return { x: cx + v[0] * scale * k, y: cy - v[1] * scale * k, z: v[2] }
  }

  const breathe = reducedMotion
    ? Math.sin(
        (2 * Math.PI * (timestamp % REDUCED_BREATHE_MS)) / REDUCED_BREATHE_MS,
      ) * 0.04
    : 0
  const light: Vec3 = [-0.4, 0.7, 0.6]

  const drawn = panels
    .map((panel) => {
      const centre = project(panel.center)
      const normal = apply(view, panel.normal)
      return { panel, centre, normal }
    })
    .sort((a, b) => a.centre.z - b.centre.z)

  lastScreenCenters = drawn.map((d) => ({
    column: d.panel.column,
    row: d.panel.row,
    x: d.centre.x,
    y: d.centre.y,
  }))

  for (const { panel, normal } of drawn) {
    const facing = normal[2] >= 0
    const sign = facing ? 1 : -1
    const lit = Math.abs(
      sign *
        (normal[0] * light[0] + normal[1] * light[1] + normal[2] * light[2]),
    )
    const hue = facing ? 38 : 205
    const saturation = facing ? 55 : 35
    const lightness = 34 + lit * 36 + breathe * 100
    context.fillStyle = `hsl(${hue}, ${saturation}%, ${lightness}%)`
    context.strokeStyle = 'rgba(20, 16, 30, 0.55)'
    context.lineWidth = 1
    context.beginPath()
    panel.corners.forEach((corner, i) => {
      const p = project(corner)
      if (i === 0) context.moveTo(p.x, p.y)
      else context.lineTo(p.x, p.y)
    })
    context.closePath()
    context.fill()
    context.stroke()
  }

  animationFrameId = window.requestAnimationFrame(renderFrame)
}

function handleMotionChange(event: MediaQueryListEvent): void {
  reducedMotion = event.matches
  nudges = new Array<number>(HINGE_COUNT).fill(0)
  if (!reducedMotion) {
    fromAngles = [...currentAngles]
    stateTimeMs = 0
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

  resizeObserver = new ResizeObserver(resizeCanvas)
  resizeObserver.observe(canvas)
  window.addEventListener('pointermove', handlePointerMove, { passive: true })
  window.addEventListener('pointerdown', handlePointerDown, { passive: true })
  resizeCanvas()
  animationFrameId = window.requestAnimationFrame(renderFrame)
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
.crease-fold-atlas {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}
</style>
