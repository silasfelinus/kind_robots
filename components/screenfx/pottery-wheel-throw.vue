<template>
  <canvas ref="canvasRef" class="pottery-wheel-throw" />
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'

const canvasRef = ref<HTMLCanvasElement | null>(null)

const KICK_COOLDOWN_MS = 2500
const KICK_DURATION = 3 // seconds a click-triggered kick takes to coast down
const TWO_PI = Math.PI * 2
const FORM_SECONDS = 8 // each form holds, then the clay flows into the next
const MORPH_SECONDS = 3.2
const PROFILE_SAMPLES = 48

let context: CanvasRenderingContext2D | null = null
let resizeObserver: ResizeObserver | null = null
let motionQuery: MediaQueryList | null = null
let animationFrameId: number | null = null
let lastFrameTs = 0
let clock = 0
let spin = 0
let width = 1
let height = 1
let reducedMotion = false
let kickStart = -100
let lastKickTs = 0
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
  if (now - lastKickTs < KICK_COOLDOWN_MS) return
  lastKickTs = now
  kickStart = clock
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

// A potter's wheel in a quiet studio at dusk. A lump of wet clay spins on
// the wheel head and is thrown, one form flowing into the next: a squat
// cylinder, a tall vase, an open bowl, a long-necked bottle, a round jar.
// The pot is a surface of revolution whose profile is a closed-form blend of
// the current and next form, so nothing accumulates per frame. Throwing
// rings and slip marks slide around the turning clay. Hovering beside the pot
// presses a fingertip groove into it; a rate-limited click kicks the wheel
// so it spins faster for a moment.

function hash(n: number): number {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453
  return s - Math.floor(s)
}

function smooth(t: number): number {
  const c = Math.min(1, Math.max(0, t))
  return c * c * (3 - 2 * c)
}

// Each form: overall height (as a fraction of the clay budget) and radii at
// evenly spaced heights from foot to rim, as fractions of the max radius.
type Form = { tall: number; radii: number[] }

const FORMS: Form[] = [
  { tall: 0.42, radii: [0.82, 0.86, 0.84, 0.8, 0.74, 0.64, 0.5] }, // lump
  { tall: 0.72, radii: [0.52, 0.55, 0.55, 0.54, 0.54, 0.55, 0.57] }, // cylinder
  { tall: 1, radii: [0.34, 0.5, 0.62, 0.6, 0.42, 0.26, 0.24, 0.32] }, // vase
  { tall: 0.46, radii: [0.3, 0.5, 0.7, 0.86, 0.96, 1] }, // bowl
  { tall: 0.98, radii: [0.4, 0.6, 0.66, 0.5, 0.22, 0.14, 0.13, 0.17] }, // bottle
  { tall: 0.66, radii: [0.42, 0.66, 0.78, 0.8, 0.72, 0.5, 0.36, 0.4] }, // jar
]

function sampleForm(form: Form, u: number): number {
  const r = form.radii
  const pos = u * (r.length - 1)
  const i = Math.min(r.length - 2, Math.floor(pos))
  const f = smooth(pos - i)
  const a = r[i] ?? 0
  const b = r[i + 1] ?? a
  return a + (b - a) * f
}

type Profile = { tall: number; radii: number[] }

function currentProfile(): Profile {
  const span = FORM_SECONDS * FORMS.length
  const t = ((clock % span) + span) % span
  const index = Math.floor(t / FORM_SECONDS)
  const local = t - index * FORM_SECONDS
  const from = FORMS[index] ?? FORMS[0]!
  const to = FORMS[(index + 1) % FORMS.length] ?? FORMS[0]!
  const k = smooth((local - (FORM_SECONDS - MORPH_SECONDS)) / MORPH_SECONDS)
  const radii: number[] = []
  for (let s = 0; s <= PROFILE_SAMPLES; s += 1) {
    const u = s / PROFILE_SAMPLES
    const a = sampleForm(from, u)
    const b = sampleForm(to, u)
    // Mid-morph the clay gathers a little, as if coned and re-opened.
    const gather = 1 - Math.sin(k * Math.PI) * 0.12
    radii.push((a + (b - a) * k) * gather)
  }
  return { tall: from.tall + (to.tall - from.tall) * k, radii }
}

function spinRate(): number {
  const age = clock - kickStart
  const kick =
    age >= 0 && age < KICK_DURATION ? (1 - age / KICK_DURATION) ** 2 : 0
  return 2.4 + kick * 6
}

type Layout = {
  cx: number
  base: number // y of the wheel head surface
  maxR: number
  maxH: number
}

function layout(): Layout {
  const narrow = width < 600
  const maxH = height * (narrow ? 0.34 : 0.4)
  return {
    cx: width / 2,
    base: height * 0.7,
    maxR: Math.min(width * (narrow ? 0.3 : 0.17), maxH * 0.48),
    maxH,
  }
}

function drawStudio(): void {
  if (!context) return
  const wall = context.createLinearGradient(0, 0, 0, height)
  wall.addColorStop(0, '#3a2c2a')
  wall.addColorStop(0.62, '#5a4232')
  wall.addColorStop(1, '#2c201b')
  context.fillStyle = wall
  context.fillRect(0, 0, width, height)

  // A tall window letting in amber dusk light from the left.
  const winX = width * 0.08
  const winW = Math.min(width * 0.18, 160)
  const winY = height * 0.08
  const winH = height * 0.42
  const sky = context.createLinearGradient(0, winY, 0, winY + winH)
  sky.addColorStop(0, '#f2b26b')
  sky.addColorStop(1, '#c46a4a')
  context.fillStyle = sky
  context.fillRect(winX, winY, winW, winH)
  context.strokeStyle = '#24190f'
  context.lineWidth = 4
  context.strokeRect(winX, winY, winW, winH)
  context.beginPath()
  context.moveTo(winX + winW / 2, winY)
  context.lineTo(winX + winW / 2, winY + winH)
  context.moveTo(winX, winY + winH / 2)
  context.lineTo(winX + winW, winY + winH / 2)
  context.stroke()

  // A warm shaft of light falling across the room.
  const shaft = context.createLinearGradient(winX, winY, width * 0.7, height)
  shaft.addColorStop(0, 'rgba(255, 196, 120, 0.18)')
  shaft.addColorStop(1, 'rgba(255, 196, 120, 0)')
  context.fillStyle = shaft
  context.beginPath()
  context.moveTo(winX, winY)
  context.lineTo(winX + winW, winY)
  context.lineTo(width * 0.85, height)
  context.lineTo(width * 0.3, height)
  context.closePath()
  context.fill()

  // A shelf of bisque pots drying along the back wall, right side.
  const shelfY = height * 0.3
  const shelfL = width * 0.58
  const shelfR = width * 0.96
  context.fillStyle = '#2a1c14'
  context.fillRect(shelfL, shelfY, shelfR - shelfL, 6)
  const pots = width < 600 ? 3 : 6
  for (let p = 0; p < pots; p += 1) {
    const x = shelfL + ((p + 0.5) / pots) * (shelfR - shelfL)
    const h = 22 + hash(p * 3.1) * 34
    const w = 10 + hash(p * 5.7) * 14
    context.fillStyle = p % 2 === 0 ? '#c99a78' : '#b88466'
    context.beginPath()
    context.moveTo(x - w * 0.6, shelfY)
    context.quadraticCurveTo(
      x - w * 1.2,
      shelfY - h * 0.6,
      x - w * 0.4,
      shelfY - h,
    )
    context.lineTo(x + w * 0.4, shelfY - h)
    context.quadraticCurveTo(x + w * 1.2, shelfY - h * 0.6, x + w * 0.6, shelfY)
    context.closePath()
    context.fill()
  }

  // Floor.
  context.fillStyle = '#22170f'
  context.fillRect(0, height * 0.86, width, height * 0.14)
}

function drawWheel(l: Layout): void {
  if (!context) return
  const headR = l.maxR * 1.45
  const panR = Math.min(headR * 1.45, width * 0.47)
  const tilt = 0.22
  // Splash pan around the wheel.
  context.fillStyle = '#3a3836'
  context.beginPath()
  context.ellipse(l.cx, l.base + 14, panR, panR * tilt, 0, 0, TWO_PI)
  context.fill()
  context.fillStyle = '#4c4844'
  context.fillRect(l.cx - panR, l.base + 14, panR * 2, height * 0.16)
  context.fillStyle = '#2e2b29'
  context.beginPath()
  context.ellipse(
    l.cx,
    l.base + 14 + height * 0.16,
    panR,
    panR * tilt,
    0,
    0,
    Math.PI,
  )
  context.fill()

  // The wheel head itself, with spokes of slip that show it turning.
  context.fillStyle = '#7d7a76'
  context.beginPath()
  context.ellipse(l.cx, l.base + 6, headR, headR * tilt, 0, 0, TWO_PI)
  context.fill()
  context.fillStyle = '#a19c95'
  context.beginPath()
  context.ellipse(l.cx, l.base, headR, headR * tilt, 0, 0, TWO_PI)
  context.fill()
  context.strokeStyle = 'rgba(110, 76, 52, 0.55)'
  context.lineWidth = 2
  for (let s = 0; s < 6; s += 1) {
    const a = spin + (s * TWO_PI) / 6
    context.beginPath()
    context.moveTo(
      l.cx + Math.cos(a) * headR * 0.55,
      l.base + Math.sin(a) * headR * 0.55 * tilt,
    )
    context.lineTo(
      l.cx + Math.cos(a + 0.25) * headR * 0.92,
      l.base + Math.sin(a + 0.25) * headR * 0.92 * tilt,
    )
    context.stroke()
  }
}

// Fingertip groove pressed in where the pointer hovers beside the pot.
function grooveAt(l: Layout, y: number, r: number): number {
  if (pointerX < 0) return 0
  const dx = Math.abs(pointerX - l.cx) - r
  if (dx > l.maxR * 0.9) return 0
  const dy = (y - pointerY) / (l.maxH * 0.05)
  return (
    Math.exp(-dy * dy) * l.maxR * 0.08 * (1 - Math.max(0, dx) / (l.maxR * 0.9))
  )
}

function drawPot(l: Layout): void {
  if (!context) return
  const profile = currentProfile()
  const potH = l.maxH * profile.tall
  const points: { y: number; r: number }[] = profile.radii.map((rr, s) => {
    const y = l.base - (s / PROFILE_SAMPLES) * potH
    const r = rr * l.maxR
    return { y, r: Math.max(2, r - grooveAt(l, y, r)) }
  })

  // Body: lit from the window on the left, wet clay sheen.
  const body = context.createLinearGradient(l.cx - l.maxR, 0, l.cx + l.maxR, 0)
  body.addColorStop(0, '#d48e62')
  body.addColorStop(0.3, '#b86f45')
  body.addColorStop(0.75, '#7e4528')
  body.addColorStop(1, '#4e2a18')
  context.fillStyle = body
  context.beginPath()
  points.forEach((p, s) => {
    if (s === 0) context?.moveTo(l.cx - p.r, p.y)
    else context?.lineTo(l.cx - p.r, p.y)
  })
  for (let s = points.length - 1; s >= 0; s -= 1) {
    const p = points[s]
    if (p) context.lineTo(l.cx + p.r, p.y)
  }
  context.closePath()
  context.fill()

  context.save()
  context.clip()
  // Throwing rings: faint horizontal ridges that wobble as the clay turns.
  const rings = 14
  for (let k = 1; k < rings; k += 1) {
    const s = Math.round((k / rings) * PROFILE_SAMPLES)
    const p = points[s]
    if (!p) continue
    const wobble = Math.sin(spin * 1 + k * 1.9) * 0.6
    context.strokeStyle = 'rgba(60, 30, 16, 0.28)'
    context.lineWidth = 1
    context.beginPath()
    context.ellipse(l.cx, p.y + wobble, p.r, p.r * 0.07, 0, 0, Math.PI)
    context.stroke()
  }
  // Slip streaks sliding around the turning surface.
  const streaks = 9
  for (let k = 0; k < streaks; k += 1) {
    const a = spin + hash(k * 4.3) * TWO_PI
    const facing = Math.sin(a)
    if (facing <= 0) continue
    const s0 = Math.floor(hash(k * 2.7) * PROFILE_SAMPLES * 0.7)
    const s1 = Math.min(PROFILE_SAMPLES, s0 + 6 + Math.floor(hash(k) * 10))
    context.strokeStyle = `rgba(240, 196, 160, ${0.35 * facing})`
    context.lineWidth = 1.6
    context.beginPath()
    for (let s = s0; s <= s1; s += 1) {
      const p = points[s]
      if (!p) continue
      const x = l.cx + Math.cos(a) * p.r
      if (s === s0) context.moveTo(x, p.y)
      else context.lineTo(x, p.y)
    }
    context.stroke()
  }
  // Wet highlight along the lit side.
  const shine = context.createLinearGradient(l.cx - l.maxR, 0, l.cx, 0)
  shine.addColorStop(0, 'rgba(255, 220, 190, 0)')
  shine.addColorStop(0.55, 'rgba(255, 220, 190, 0.22)')
  shine.addColorStop(1, 'rgba(255, 220, 190, 0)')
  context.fillStyle = shine
  context.fillRect(
    l.cx - l.maxR * 1.2,
    l.base - potH - 4,
    l.maxR * 1.2,
    potH + 8,
  )
  context.restore()

  // Rim: an ellipse showing the opening at the top.
  const rim = points[points.length - 1]
  if (rim) {
    context.fillStyle = '#4a2716'
    context.beginPath()
    context.ellipse(l.cx, rim.y, rim.r, rim.r * 0.18, 0, 0, TWO_PI)
    context.fill()
    context.strokeStyle = '#d99a70'
    context.lineWidth = 2
    context.stroke()
  }
}

function drawHand(l: Layout): void {
  if (!context || pointerX < 0) return
  if (Math.abs(pointerX - l.cx) > l.maxR * 2.2) return
  if (pointerY < l.base - l.maxH * 1.05 || pointerY > l.base) return
  // A soft, clay-slicked fingertip glow where the groove is pressed.
  const glow = context.createRadialGradient(
    pointerX,
    pointerY,
    0,
    pointerX,
    pointerY,
    28,
  )
  glow.addColorStop(0, 'rgba(240, 190, 150, 0.35)')
  glow.addColorStop(1, 'rgba(240, 190, 150, 0)')
  context.fillStyle = glow
  context.fillRect(pointerX - 28, pointerY - 28, 56, 56)
}

function drawDust(): void {
  if (!context) return
  // Motes of clay dust drifting through the window light.
  const motes = width < 600 ? 24 : 50
  for (let m = 0; m < motes; m += 1) {
    const x =
      ((hash(m * 1.7) + clock * 0.006 * (0.5 + hash(m))) % 1) * width * 0.8 +
      width * 0.08
    const y =
      height * (0.1 + hash(m * 3.1) * 0.7) + Math.sin(clock * 0.4 + m) * 8
    const a = 0.25 + 0.25 * Math.sin(clock * 0.7 + m * 2.3)
    context.fillStyle = `rgba(255, 214, 160, ${a})`
    context.fillRect(x, y, 1.6, 1.6)
  }
}

function drawScene(): void {
  if (!context) return
  drawStudio()
  const l = layout()
  drawWheel(l)
  drawPot(l)
  drawHand(l)
  drawDust()
  // Gentle vignette.
  const vignette = context.createRadialGradient(
    width / 2,
    height * 0.55,
    Math.min(width, height) * 0.3,
    width / 2,
    height * 0.55,
    Math.max(width, height) * 0.75,
  )
  vignette.addColorStop(0, 'rgba(0, 0, 0, 0)')
  vignette.addColorStop(1, 'rgba(0, 0, 0, 0.45)')
  context.fillStyle = vignette
  context.fillRect(0, 0, width, height)
}

function renderFrame(timestamp: number): void {
  if (!context) return
  const dt = lastFrameTs ? Math.min(0.1, (timestamp - lastFrameTs) / 1000) : 0
  lastFrameTs = timestamp
  clock += dt
  spin = (spin + dt * spinRate()) % TWO_PI
  drawScene()
  animationFrameId = window.requestAnimationFrame(renderFrame)
}

function drawStill(): void {
  // Hold a finished vase, mid-form, with the wheel at rest.
  clock = FORM_SECONDS * 2 + 2
  spin = 0.6
  kickStart = -100
  pointerX = -1
  pointerY = -1
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
.pottery-wheel-throw {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}
</style>
