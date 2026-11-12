<template>
  <canvas ref="canvasRef" class="shishi-odoshi-garden" />
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'

const canvasRef = ref<HTMLCanvasElement | null>(null)

const SURGE_COOLDOWN_MS = 3000
const SURGE_DECAY_PER_SEC = 0.4
const TWO_PI = Math.PI * 2

let context: CanvasRenderingContext2D | null = null
let resizeObserver: ResizeObserver | null = null
let motionQuery: MediaQueryList | null = null
let animationFrameId: number | null = null
let lastFrameTs = 0
let clock = 0
let flow = 0
let width = 1
let height = 1
let reducedMotion = false
let surge = 0
let lastSurgeTs = 0
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
  if (now - lastSurgeTs < SURGE_COOLDOWN_MS) return
  lastSurgeTs = now
  surge = 1
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

// A moonlit Japanese garden of shishi-odoshi: bamboo rockers that slowly fill
// from a trickling spout, tip to spill into the pond, then swing back and clack
// against a stone. Every rocker's state is a closed-form function of a shared
// "flow" clock (its own period and offset), so nothing per-rocker is stored.
// Hover brightens the nearest rocker's water; a rate-limited click opens the
// spouts so every rocker fills faster for a few seconds.
const FILL_END = 0.82
const TIP_END = 0.9

function hash(n: number): number {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453
  return s - Math.floor(s)
}

function smooth(t: number): number {
  const c = Math.min(1, Math.max(0, t))
  return c * c * (3 - 2 * c)
}

interface RockerState {
  angle: number
  fill: number
  spill: number
  sinceTip: number
  sinceClack: number
}

// Phase 0..FILL_END: raised and filling; FILL_END..TIP_END: tipping down and
// spilling; TIP_END..1: swinging back to rest, clacking at the very end.
function rockerState(i: number, flowTime: number): RockerState {
  const period = 5 + hash(i + 2) * 3
  const raw = flowTime / period + hash(i + 5)
  const p = raw - Math.floor(raw)
  const rest = -0.38
  const down = 0.42
  let angle = rest
  let fill = 0
  let spill = 0
  if (p < FILL_END) {
    fill = p / FILL_END
    angle = rest + fill * fill * 0.08
  } else if (p < TIP_END) {
    const t = (p - FILL_END) / (TIP_END - FILL_END)
    angle = rest + 0.08 + (down - rest - 0.08) * smooth(t * 1.6)
    fill = Math.max(0, 1 - t * 1.4)
    spill = Math.sin(Math.min(1, t) * Math.PI)
  } else {
    const t = (p - TIP_END) / (1 - TIP_END)
    angle = down + (rest - down) * (t * t)
  }
  const tipPhase = p >= FILL_END ? p - FILL_END : p + 1 - FILL_END
  return {
    angle,
    fill,
    spill,
    sinceTip: tipPhase * period,
    sinceClack: p * period,
  }
}

function drawBackdrop(): void {
  if (!context) return
  const sky = context.createLinearGradient(0, 0, 0, height)
  sky.addColorStop(0, '#0d1424')
  sky.addColorStop(0.55, '#1a2b33')
  sky.addColorStop(1, '#0e1a17')
  context.fillStyle = sky
  context.fillRect(0, 0, width, height)

  const moonX = width * 0.82
  const moonY = height * 0.18
  const moonR = Math.min(width, height) * 0.06
  const halo = context.createRadialGradient(
    moonX,
    moonY,
    0,
    moonX,
    moonY,
    moonR * 6,
  )
  halo.addColorStop(0, 'rgba(230, 240, 220, 0.35)')
  halo.addColorStop(1, 'rgba(230, 240, 220, 0)')
  context.fillStyle = halo
  context.fillRect(0, 0, width, height)
  context.fillStyle = '#eef1df'
  context.beginPath()
  context.arc(moonX, moonY, moonR, 0, TWO_PI)
  context.fill()

  // Distant bamboo grove silhouettes.
  for (let k = 0; k < 26; k += 1) {
    const x = hash(k + 40) * width
    const w = 3 + hash(k + 41) * 5
    context.fillStyle = `rgba(20, 44, 36, ${0.45 + hash(k + 42) * 0.4})`
    context.fillRect(x, height * (0.05 + hash(k + 43) * 0.2), w, height)
  }

  // Pond surface with the moon's reflection.
  const pondTop = height * 0.72
  const pond = context.createLinearGradient(0, pondTop, 0, height)
  pond.addColorStop(0, '#16303a')
  pond.addColorStop(1, '#0a1a1f')
  context.fillStyle = pond
  context.fillRect(0, pondTop, width, height - pondTop)
  context.fillStyle = 'rgba(238, 241, 223, 0.12)'
  for (let k = 0; k < 7; k += 1) {
    const w = moonR * (2.4 - k * 0.25)
    context.fillRect(moonX - w / 2, pondTop + 6 + k * 9, w, 2)
  }
}

function drawRipple(x: number, y: number, since: number, scale: number): void {
  if (!context || since > 2.6) return
  for (let ring = 0; ring < 3; ring += 1) {
    const t = since - ring * 0.35
    if (t <= 0) continue
    const r = t * scale * 0.9
    const alpha = Math.max(0, 0.45 * (1 - t / 2.3))
    if (alpha <= 0) continue
    context.strokeStyle = `rgba(190, 225, 220, ${alpha})`
    context.lineWidth = 1.2
    context.beginPath()
    context.ellipse(x, y, r, r * 0.28, 0, 0, TWO_PI)
    context.stroke()
  }
}

function drawScene(flowTime: number): void {
  if (!context) return
  drawBackdrop()

  const ROCKERS = width < 600 ? 3 : 5
  const unit = Math.min(width / (ROCKERS + 1), height * 0.42)
  const pondTop = height * 0.72
  let nearest = -1
  let nearestDist = Infinity

  for (let i = 0; i < ROCKERS; i += 1) {
    const cx = (width / (ROCKERS + 1)) * (i + 1)
    const cy = pondTop - unit * (0.18 + hash(i + 9) * 0.08)
    const d = Math.hypot(cx - pointerX, cy - pointerY)
    if (pointerX >= 0 && d < nearestDist && d < unit) {
      nearest = i
      nearestDist = d
    }
  }

  for (let i = 0; i < ROCKERS; i += 1) {
    const state = rockerState(i, flowTime)
    const cx = (width / (ROCKERS + 1)) * (i + 1)
    const cy = pondTop - unit * (0.18 + hash(i + 9) * 0.08)
    const len = unit * 0.9
    const tube = Math.max(4, unit * 0.09)
    const glow = i === nearest ? 1 : 0
    const mouthX = cx - Math.cos(state.angle) * len * 0.55
    const mouthY = cy + Math.sin(state.angle) * len * 0.55
    const spillX = cx - Math.cos(0.42) * len * 0.55

    // Ripple where the spill lands in the pond.
    drawRipple(spillX, pondTop + unit * 0.1, state.sinceTip, unit * 0.5)

    // Bamboo spout pipe feeding from the left with a thin trickle.
    const spoutX = cx - len * 0.62
    const spoutY = cy - len * 0.42
    context.fillStyle = '#4f7a3c'
    context.fillRect(
      spoutX - len * 0.5,
      spoutY - tube * 0.35,
      len * 0.5,
      tube * 0.7,
    )
    context.strokeStyle = `rgba(170, 220, 230, ${0.5 + surge * 0.4})`
    context.lineWidth = 1 + surge * 2
    context.beginPath()
    context.moveTo(spoutX, spoutY)
    context.quadraticCurveTo(
      spoutX + tube,
      spoutY + 4,
      spoutX + tube * 0.6,
      cy - len * 0.2,
    )
    context.stroke()

    // Stone the tube clacks against, and the post it pivots on.
    context.fillStyle = '#5c6260'
    context.beginPath()
    context.ellipse(
      cx + len * 0.42,
      cy + len * 0.25,
      unit * 0.12,
      unit * 0.07,
      0,
      0,
      TWO_PI,
    )
    context.fill()
    context.fillStyle = '#3b2f24'
    context.fillRect(
      cx - tube * 0.3,
      cy,
      tube * 0.6,
      pondTop - cy + unit * 0.05,
    )

    // The rocker: a bamboo tube rotating about its pivot.
    context.save()
    context.translate(cx, cy)
    context.rotate(-state.angle)
    const bamboo = context.createLinearGradient(0, -tube, 0, tube)
    bamboo.addColorStop(0, '#9fc46a')
    bamboo.addColorStop(0.5, '#6e9a45')
    bamboo.addColorStop(1, '#3f6328')
    context.fillStyle = bamboo
    context.fillRect(-len * 0.55, -tube / 2, len, tube)
    context.strokeStyle = 'rgba(30, 50, 20, 0.8)'
    context.lineWidth = 1.5
    for (const node of [-0.1, 0.25]) {
      context.beginPath()
      context.moveTo(len * node, -tube / 2)
      context.lineTo(len * node, tube / 2)
      context.stroke()
    }
    // Water inside the open (left) end.
    if (state.fill > 0.01) {
      const fillLen = len * 0.42 * state.fill
      context.fillStyle = `rgba(140, 210, 230, ${0.55 + glow * 0.35})`
      context.fillRect(-len * 0.55, -tube * 0.3, fillLen, tube * 0.6)
    }
    context.restore()

    // Spilling sheet of water while tipped.
    if (state.spill > 0.02) {
      context.strokeStyle = `rgba(170, 225, 240, ${state.spill * 0.8})`
      context.lineWidth = 2 + state.spill * 3
      context.beginPath()
      context.moveTo(mouthX, mouthY)
      context.quadraticCurveTo(
        mouthX - unit * 0.06,
        (mouthY + pondTop) / 2,
        mouthX - unit * 0.02,
        pondTop + unit * 0.08,
      )
      context.stroke()
    }

    // Clack flash as the tube strikes the stone on its return.
    if (state.sinceClack < 0.25) {
      const a = Math.max(0, 1 - state.sinceClack / 0.25)
      context.fillStyle = `rgba(255, 245, 210, ${a * 0.6})`
      context.beginPath()
      context.arc(
        cx + len * 0.45,
        cy + len * 0.22,
        unit * 0.06 * (1 + a),
        0,
        TWO_PI,
      )
      context.fill()
    }
  }

  // Foreground reeds framing the pond.
  context.strokeStyle = 'rgba(12, 28, 20, 0.9)'
  context.lineWidth = 2
  for (let k = 0; k < 18; k += 1) {
    const x = hash(k + 70) * width
    const h = height * (0.12 + hash(k + 71) * 0.14)
    const sway = Math.sin(clock * 0.6 + k) * 4
    context.beginPath()
    context.moveTo(x, height)
    context.quadraticCurveTo(
      x + sway * 0.5,
      height - h * 0.5,
      x + sway,
      height - h,
    )
    context.stroke()
  }
}

function renderFrame(timestamp: number): void {
  if (!context) return
  const dt = lastFrameTs ? Math.min(0.1, (timestamp - lastFrameTs) / 1000) : 0
  lastFrameTs = timestamp
  surge = Math.max(0, surge - SURGE_DECAY_PER_SEC * dt)
  clock += dt
  flow += dt * (1 + surge * 2.5)
  drawScene(flow)
  animationFrameId = window.requestAnimationFrame(renderFrame)
}

function handleMotionChange(event: MediaQueryListEvent): void {
  reducedMotion = event.matches
  surge = 0
  pointerX = -1
  pointerY = -1
  if (reducedMotion) {
    if (animationFrameId !== null) window.cancelAnimationFrame(animationFrameId)
    animationFrameId = null
    drawScene(3)
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
    if (reducedMotion) drawScene(3)
  })
  resizeObserver.observe(canvas)
  window.addEventListener('pointermove', handlePointerMove, { passive: true })
  window.addEventListener('pointerdown', handlePointerDown, { passive: true })
  resizeCanvas()
  if (reducedMotion) drawScene(3)
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
.shishi-odoshi-garden {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}
</style>
