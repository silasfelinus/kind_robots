<template>
  <canvas ref="canvasRef" class="laundry-line-breeze" />
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'

const canvasRef = ref<HTMLCanvasElement | null>(null)

const GUST_COOLDOWN_MS = 3000
const GUST_SPEED = 0.45 // fraction of screen width per second
const TWO_PI = Math.PI * 2

let context: CanvasRenderingContext2D | null = null
let resizeObserver: ResizeObserver | null = null
let motionQuery: MediaQueryList | null = null
let animationFrameId: number | null = null
let lastFrameTs = 0
let clock = 0
let width = 1
let height = 1
let reducedMotion = false
let gustStart = -100
let lastGustTs = 0
let pointerX = -1
let pointerY = -1

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
  if (!canvasPoint(event)) return
  const now = performance.now()
  if (now - lastGustTs < GUST_COOLDOWN_MS) return
  lastGustTs = now
  gustStart = clock
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

// A sunny back garden: two sagging clotheslines strung between posts, hung
// with sheets, towels and shirts. Every garment's billow is a closed-form
// function of the clock, its position and the gust front, so nothing is
// simulated or stored per frame. Hover makes the nearest garment flutter;
// a rate-limited click sends a gust front rolling left to right that lifts
// each piece as it passes.
const FABRIC_COLORS = [
  '#f7f3ea',
  '#8fc1e3',
  '#f4b6c2',
  '#f6d77a',
  '#a8d5a2',
  '#e88b6a',
  '#c3a6e0',
]

type GarmentKind = 'sheet' | 'towel' | 'shirt' | 'sock'
const KINDS: GarmentKind[] = [
  'sheet',
  'towel',
  'shirt',
  'towel',
  'sock',
  'shirt',
]

function hash(n: number): number {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453
  return s - Math.floor(s)
}

function drawBackdrop(groundY: number): void {
  if (!context) return
  const sky = context.createLinearGradient(0, 0, 0, groundY)
  sky.addColorStop(0, '#5aa6e0')
  sky.addColorStop(1, '#cfe9f7')
  context.fillStyle = sky
  context.fillRect(0, 0, width, groundY)

  const sunX = width * 0.82
  const sunY = height * 0.13
  const sunR = Math.min(width, height) * 0.06
  const glow = context.createRadialGradient(sunX, sunY, 0, sunX, sunY, sunR * 5)
  glow.addColorStop(0, 'rgba(255, 245, 200, 0.8)')
  glow.addColorStop(1, 'rgba(255, 245, 200, 0)')
  context.fillStyle = glow
  context.fillRect(0, 0, width, groundY)
  context.fillStyle = '#fff6cf'
  context.beginPath()
  context.arc(sunX, sunY, sunR, 0, TWO_PI)
  context.fill()

  // Puffy clouds drifting slowly right.
  for (let k = 0; k < 5; k += 1) {
    const w = width * (0.12 + hash(k + 10) * 0.12)
    const span = width + w * 2
    const x = ((hash(k + 11) * span + clock * (8 + k * 3)) % span) - w
    const y = groundY * (0.12 + hash(k + 12) * 0.35)
    context.fillStyle = 'rgba(255, 255, 255, 0.85)'
    for (let b = 0; b < 4; b += 1) {
      context.beginPath()
      context.ellipse(
        x + w * (0.2 + b * 0.2),
        y - Math.sin(b * 1.3) * w * 0.08,
        w * 0.18,
        w * 0.12,
        0,
        0,
        TWO_PI,
      )
      context.fill()
    }
  }

  // Hedge and lawn.
  context.fillStyle = '#4c8a46'
  context.beginPath()
  context.moveTo(0, groundY)
  for (let x = 0; x <= width; x += 24) {
    context.lineTo(x, groundY - 18 - Math.sin(x * 0.05) * 8 - hash(x) * 6)
  }
  context.lineTo(width, groundY)
  context.closePath()
  context.fill()
  const lawn = context.createLinearGradient(0, groundY, 0, height)
  lawn.addColorStop(0, '#7cc06a')
  lawn.addColorStop(1, '#4f9a4a')
  context.fillStyle = lawn
  context.fillRect(0, groundY, width, height - groundY)
  context.strokeStyle = 'rgba(40, 90, 40, 0.35)'
  context.lineWidth = 1
  for (let k = 0; k < 60; k += 1) {
    const gx = hash(k + 70) * width
    const gy = groundY + 6 + hash(k + 71) * (height - groundY - 8)
    const sway = Math.sin(clock * 1.2 + k) * 2
    context.beginPath()
    context.moveTo(gx, gy)
    context.lineTo(gx + sway, gy - 6)
    context.stroke()
  }
}

// Wind strength at horizontal position x: a gentle base breeze plus the
// travelling gust front, which rises fast and trails off behind.
function windAt(x: number): number {
  const front = (clock - gustStart) * GUST_SPEED * width - width * 0.1
  const behind = front - x
  let gust = 0
  if (behind > 0) gust = Math.exp(-behind / (width * 0.35))
  else gust = Math.exp(behind / (width * 0.03))
  if (clock - gustStart > 6) gust = 0
  return 0.25 + gust
}

interface Line {
  x0: number
  x1: number
  y: number
  sag: number
}

function lineY(line: Line, x: number): number {
  const t = (x - line.x0) / (line.x1 - line.x0)
  return line.y + line.sag * 4 * t * (1 - t)
}

function drawPost(x: number, top: number, groundY: number): void {
  if (!context) return
  context.fillStyle = '#7a5a3c'
  context.fillRect(x - 4, top - 6, 8, groundY - top + 10)
  context.fillRect(x - 18, top - 6, 36, 6)
}

function drawGarment(
  kind: GarmentKind,
  left: number,
  w: number,
  h: number,
  line: Line,
  color: string,
  phase: number,
  wind: number,
  flutter: number,
): void {
  if (!context) return
  const right = left + w
  const topL = lineY(line, left)
  const topR = lineY(line, right)
  // Billow: the hem swings sideways and lifts with the wind.
  const lift = Math.min(0.75, wind * 0.6)
  const wave = (k: number) =>
    Math.sin(clock * (2.4 + flutter * 5) + phase + k * 1.7) *
    (2 + wind * 6 + flutter * 6)
  const hemDx = wind * h * 0.35
  const hemH = h * (1 - lift * 0.6)
  const segments = 6

  context.fillStyle = color
  context.strokeStyle = 'rgba(60, 50, 60, 0.25)'
  context.lineWidth = 1
  context.beginPath()
  context.moveTo(left, topL)
  context.lineTo(right, topR)
  if (kind === 'shirt') {
    // Sleeves flap out to the right with the wind.
    const sy = topR + h * 0.08
    context.lineTo(right + w * 0.28 + hemDx * 0.3, sy + h * 0.15 + wave(1))
    context.lineTo(right + w * 0.2 + hemDx * 0.3, sy + h * 0.35 + wave(2))
    context.lineTo(right, sy + h * 0.3)
  }
  context.quadraticCurveTo(
    right + hemDx * 0.4 + wave(3),
    topR + hemH * 0.6,
    right + hemDx,
    topR + hemH,
  )
  for (let s = segments; s >= 0; s -= 1) {
    const t = s / segments
    const hx = left + hemDx + w * t
    const hy = topL + (topR - topL) * t + hemH + wave(s + 4) * 0.6
    context.lineTo(hx, hy)
  }
  context.quadraticCurveTo(
    left + hemDx * 0.4 + wave(11),
    topL + hemH * 0.6,
    left,
    topL,
  )
  if (kind === 'shirt') {
    const sy = topL + h * 0.08
    context.lineTo(left, sy + h * 0.3)
    context.lineTo(left - w * 0.2 + hemDx * 0.3, sy + h * 0.35 + wave(12))
    context.lineTo(left - w * 0.28 + hemDx * 0.3, sy + h * 0.15 + wave(13))
  }
  context.closePath()
  context.fill()
  context.stroke()

  // Soft fold shading and a stripe on towels.
  context.fillStyle = 'rgba(40, 40, 70, 0.08)'
  context.beginPath()
  context.moveTo(left + w * 0.45, (topL + topR) / 2)
  context.lineTo(left + w * 0.55, (topL + topR) / 2)
  context.lineTo(left + w * 0.6 + hemDx, (topL + topR) / 2 + hemH)
  context.lineTo(left + w * 0.4 + hemDx, (topL + topR) / 2 + hemH)
  context.closePath()
  context.fill()
  if (kind === 'towel') {
    context.strokeStyle = 'rgba(255, 255, 255, 0.7)'
    context.lineWidth = 3
    context.beginPath()
    context.moveTo(left + hemDx * 0.8, topL + hemH * 0.8)
    context.lineTo(right + hemDx * 0.8, topR + hemH * 0.8)
    context.stroke()
  }

  // Wooden clothespins.
  context.fillStyle = '#c99a62'
  for (const px of [left + w * 0.12, right - w * 0.12]) {
    const py = lineY(line, px)
    context.fillRect(px - 2, py - 6, 4, 12)
  }
}

function drawScene(): void {
  if (!context) return
  const groundY = height * 0.72
  drawBackdrop(groundY)

  const narrow = width < 600
  const lines: Line[] = [
    { x0: width * 0.04, x1: width * 0.96, y: height * 0.2, sag: height * 0.06 },
    {
      x0: width * 0.04,
      x1: width * 0.96,
      y: height * 0.42,
      sag: height * 0.07,
    },
  ]
  for (const line of lines) {
    drawPost(line.x0, line.y, groundY)
    drawPost(line.x1, line.y, groundY)
    context.strokeStyle = 'rgba(70, 60, 60, 0.8)'
    context.lineWidth = 1.5
    context.beginPath()
    for (let x = line.x0; x <= line.x1; x += 8) {
      const y = lineY(line, x)
      if (x === line.x0) context.moveTo(x, y)
      else context.lineTo(x, y)
    }
    context.stroke()
  }

  // Lay out garments along each line; find the one nearest the pointer.
  interface Placed {
    kind: GarmentKind
    left: number
    w: number
    h: number
    line: Line
    color: string
    phase: number
  }
  const placed: Placed[] = []
  let seed = 0
  lines.forEach((line, li) => {
    let x = line.x0 + width * 0.05
    const limit = line.x1 - width * 0.05
    while (x < limit) {
      seed += 1
      const kind = KINDS[Math.floor(hash(seed + li * 40) * KINDS.length)]!
      const unit = Math.min(width, height) * (narrow ? 0.14 : 0.1)
      const w =
        kind === 'sheet'
          ? unit * 1.8
          : kind === 'sock'
            ? unit * 0.3
            : kind === 'shirt'
              ? unit * 0.9
              : unit * 0.8
      const h =
        kind === 'sheet'
          ? unit * 1.4
          : kind === 'sock'
            ? unit * 0.7
            : unit * 1.0
      if (x + w > limit) break
      placed.push({
        kind,
        left: x,
        w,
        h,
        line,
        color:
          FABRIC_COLORS[Math.floor(hash(seed + 90) * FABRIC_COLORS.length)]!,
        phase: hash(seed + 7) * TWO_PI,
      })
      x +=
        w +
        unit * (kind === 'shirt' ? 0.55 : 0.25) +
        hash(seed + 3) * unit * 0.3
    }
  })

  let nearest = -1
  if (pointerX >= 0) {
    let best = Infinity
    placed.forEach((g, i) => {
      const cx = g.left + g.w / 2
      const cy = lineY(g.line, cx) + g.h / 2
      const d = Math.hypot(cx - pointerX, cy - pointerY)
      if (d < Math.max(g.w, g.h) && d < best) {
        best = d
        nearest = i
      }
    })
  }

  placed.forEach((g, i) => {
    const wind = reducedMotion ? 0.3 : windAt(g.left + g.w / 2)
    drawGarment(
      g.kind,
      g.left,
      g.w,
      g.h,
      g.line,
      g.color,
      g.phase,
      wind,
      i === nearest ? 1 : 0,
    )
  })

  // Leaves blown along by the gust.
  const gustAge = clock - gustStart
  if (!reducedMotion && gustAge < 5) {
    const fade = 1 - gustAge / 5
    for (let k = 0; k < 14; k += 1) {
      const x =
        (hash(k + 120) * width * 0.3 + gustAge * width * GUST_SPEED * 1.1) %
        (width + 40)
      const y =
        height * (0.15 + hash(k + 121) * 0.6) + Math.sin(clock * 3 + k) * 14
      context.save()
      context.translate(x, y)
      context.rotate(clock * (2 + hash(k + 122) * 3) + k)
      context.fillStyle = `rgba(${k % 2 ? '120, 170, 70' : '220, 160, 60'}, ${0.8 * fade})`
      context.beginPath()
      context.ellipse(0, 0, 6, 3, 0, 0, TWO_PI)
      context.fill()
      context.restore()
    }
  }
}

function renderFrame(timestamp: number): void {
  if (!context) return
  const dt = lastFrameTs ? Math.min(0.1, (timestamp - lastFrameTs) / 1000) : 0
  lastFrameTs = timestamp
  clock += dt
  drawScene()
  animationFrameId = window.requestAnimationFrame(renderFrame)
}

function drawStill(): void {
  clock = 2
  gustStart = -100
  drawScene()
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
  else animationFrameId = window.requestAnimationFrame(renderFrame)
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
.laundry-line-breeze {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}
</style>
