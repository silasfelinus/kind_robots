<template>
  <canvas ref="canvasRef" class="prism-sun-catcher" />
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'

const canvasRef = ref<HTMLCanvasElement | null>(null)

const TWO_PI = Math.PI * 2
const PRISM_COUNT = 7
const FACETS = 8
const MOTE_COUNT = 140
const FLICK_COOLDOWN_MS = 450
const SPECTRUM_W = 256
const SPECTRUM_H = 64

// A row of cut-glass sun-catchers hanging on threads in a sunny window.
// Each crystal is two coupled pendulums: a slow torsion pendulum (the thread
// twisting and untwisting) and a swing pendulum (the thread swaying in the
// draught). The facets are drawn from the current twist so the glass really
// turns, and every crystal throws a refracted spectrum onto the wall whose
// position follows twice the twist angle, the way a real prism's deviation
// does, fading as the facet turns away from the sun. Dust motes drift
// through the sunbeam. Moving the pointer stirs a draught that sways and
// twists nearby crystals; a rate-limited click flicks the nearest one into
// a spin, sending its rainbows racing around the room.

interface Prism {
  anchorX: number
  length: number
  size: number
  shape: number
  hueShift: number
  twist: number
  twistVel: number
  twistRest: number
  twistStiffness: number
  swing: number
  swingVel: number
  bobX: number
  bobY: number
  flash: number
}

const prisms: Prism[] = []
const moteX = new Float32Array(MOTE_COUNT)
const moteY = new Float32Array(MOTE_COUNT)
const moteVx = new Float32Array(MOTE_COUNT)
const moteVy = new Float32Array(MOTE_COUNT)
const moteR = new Float32Array(MOTE_COUNT)
const motePhase = new Float32Array(MOTE_COUNT)

let context: CanvasRenderingContext2D | null = null
let spectrumSprite: HTMLCanvasElement | null = null
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
let pointerVx = 0
let pointerVy = 0
let lastPointerTs = 0
let lastFlickTs = 0
let pendingFlickX = -1
let pendingFlickY = -1
let seed = 1

// Window and rod geometry, recomputed on resize.
let winX0 = 0
let winX1 = 1
let winY0 = 0
let winY1 = 1
let rodY = 0
let throwX = 1
let throwY = 0.3
let landscape = true

function random(): number {
  // mulberry32: deterministic so the reduced-motion still is stable.
  seed = (seed + 0x6d2b79f5) | 0
  let t = seed
  t = Math.imul(t ^ (t >>> 15), t | 1)
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296
}

function unit(): number {
  return Math.min(width, height) / 700
}

function buildSpectrumSprite(): void {
  // One soft refracted band, red to violet, rendered once and stamped
  // (rotated, stretched, faded) for every rainbow in the room.
  const sprite = document.createElement('canvas')
  sprite.width = SPECTRUM_W
  sprite.height = SPECTRUM_H
  const g = sprite.getContext('2d')
  if (!g) return
  const bands = [
    [255, 60, 60],
    [255, 150, 40],
    [255, 230, 70],
    [90, 230, 110],
    [60, 170, 255],
    [90, 90, 240],
    [170, 80, 230],
  ]
  for (let b = 0; b < bands.length; b += 1) {
    const color = bands[b] ?? [255, 255, 255]
    const cx = ((b + 0.5) / bands.length) * SPECTRUM_W * 0.8 + SPECTRUM_W * 0.1
    const grad = g.createRadialGradient(
      cx,
      SPECTRUM_H / 2,
      0,
      cx,
      SPECTRUM_H / 2,
      SPECTRUM_W * 0.11,
    )
    grad.addColorStop(0, `rgba(${color[0]}, ${color[1]}, ${color[2]}, 0.7)`)
    grad.addColorStop(1, `rgba(${color[0]}, ${color[1]}, ${color[2]}, 0)`)
    g.fillStyle = grad
    g.save()
    g.translate(cx, SPECTRUM_H / 2)
    g.scale(1, 2.4)
    g.translate(-cx, -SPECTRUM_H / 2)
    g.fillRect(0, 0, SPECTRUM_W, SPECTRUM_H)
    g.restore()
  }
  spectrumSprite = sprite
}

function buildScene(): void {
  prisms.length = 0
  for (let i = 0; i < PRISM_COUNT; i += 1) {
    const rest = random() * TWO_PI
    prisms.push({
      anchorX: (i + 0.5) / PRISM_COUNT + (random() - 0.5) * 0.04,
      length: 0.35 + random() * 0.4,
      size: 0.8 + random() * 0.45,
      shape: Math.floor(random() * 3),
      hueShift: (random() - 0.5) * 0.6,
      twist: rest + (random() - 0.5) * 2,
      twistVel: (random() - 0.5) * 0.6,
      twistRest: rest,
      twistStiffness: 0.25 + random() * 0.35,
      swing: (random() - 0.5) * 0.08,
      swingVel: 0,
      bobX: 0,
      bobY: 0,
      flash: 0,
    })
  }
  for (let m = 0; m < MOTE_COUNT; m += 1) {
    moteX[m] = random()
    moteY[m] = random()
    moteVx[m] = (random() - 0.5) * 6
    moteVy[m] = (random() - 0.5) * 4
    moteR[m] = 0.5 + random() * 1.3
    motePhase[m] = random() * TWO_PI
  }
}

function layoutScene(): void {
  landscape = width >= height * 1.05
  if (landscape) {
    winX0 = width * 0.07
    winX1 = width * 0.5
    winY0 = height * 0.08
    winY1 = height * 0.72
    throwX = 1
    throwY = 0.28
  } else {
    winX0 = width * 0.1
    winX1 = width * 0.9
    winY0 = height * 0.06
    winY1 = height * 0.46
    throwX = 0.35
    throwY = 1
  }
  const norm = Math.hypot(throwX, throwY)
  throwX /= norm
  throwY /= norm
  rodY = winY0 + (winY1 - winY0) * 0.06
  updateBobs()
}

function threadLength(p: Prism): number {
  return (winY1 - rodY) * p.length * 0.8
}

function anchorPx(p: Prism): number {
  return winX0 + (winX1 - winX0) * (0.08 + p.anchorX * 0.84)
}

function updateBobs(): void {
  for (const p of prisms) {
    const len = threadLength(p)
    p.bobX = anchorPx(p) + Math.sin(p.swing) * len
    p.bobY = rodY + Math.cos(p.swing) * len
  }
}

function breeze(t: number, x: number): number {
  // A slow wandering draught from the open sash, varying along the rod.
  return (
    Math.sin(t * 0.31 + x * 3.1) * 0.5 +
    Math.sin(t * 0.73 + x * 7.3 + 1.7) * 0.3 +
    Math.sin(t * 1.9 + x * 13.0) * 0.12
  )
}

function stepPhysics(h: number): void {
  const u = Math.max(0.6, unit())
  const reach = 150 * u
  for (const p of prisms) {
    const len = Math.max(20, threadLength(p))
    const draught = breeze(clock, p.anchorX) * 0.35
    let swingForce = draught * 0.6
    let torque = draught * 0.45

    if (pointerX >= 0) {
      const dx = p.bobX - pointerX
      const dy = p.bobY - pointerY
      const dist = Math.hypot(dx, dy)
      if (dist < reach) {
        const falloff = 1 - dist / reach
        // The pointer's motion is a puff of air: it pushes the crystal along
        // and, striking it off-centre, sets the thread twisting.
        swingForce += (pointerVx / 400) * falloff * 6
        torque +=
          ((pointerVx * dy - pointerVy * dx) / (reach * 400)) * falloff * 18
      }
    }

    // Swing: a damped pendulum, gravity scaled to the thread length.
    const g = 900 * u
    const swingAcc =
      -(g / len) * Math.sin(p.swing) - p.swingVel * 0.9 + swingForce
    p.swingVel += swingAcc * h
    p.swing += p.swingVel * h
    p.swing = Math.max(-0.9, Math.min(0.9, p.swing))

    // Twist: a lightly damped torsion pendulum about the thread's rest twist.
    const twistAcc =
      -p.twistStiffness * (p.twist - p.twistRest) - p.twistVel * 0.18 + torque
    p.twistVel += twistAcc * h
    p.twist += p.twistVel * h
    // The thread slowly forgets its twist so long spins settle somewhere new.
    p.twistRest += (p.twist - p.twistRest) * 0.02 * h
    p.flash = Math.max(0, p.flash - h * 1.6)
  }
}

function stepMotes(dt: number): void {
  const u = Math.max(0.6, unit())
  for (let m = 0; m < MOTE_COUNT; m += 1) {
    let vx = moteVx[m] ?? 0
    let vy = moteVy[m] ?? 0
    let x = (moteX[m] ?? 0) * width
    let y = (moteY[m] ?? 0) * height
    vx += breeze(clock * 0.7, (moteY[m] ?? 0) * 2) * 3 * dt
    vy += (Math.sin(clock * 0.5 + (motePhase[m] ?? 0)) * 2 - 0.6) * dt
    if (pointerX >= 0) {
      const dx = x - pointerX
      const dy = y - pointerY
      const d2 = dx * dx + dy * dy
      const r = 110 * u
      if (d2 < r * r) {
        const f = 1 - Math.sqrt(d2) / r
        vx += pointerVx * f * 0.04
        vy += pointerVy * f * 0.04
      }
    }
    vx *= 1 - Math.min(1, dt * 0.8)
    vy *= 1 - Math.min(1, dt * 0.8)
    x += vx * dt * u
    y += vy * dt * u
    if (x < 0) x += width
    if (x > width) x -= width
    if (y < 0) y += height
    if (y > height) y -= height
    moteVx[m] = vx
    moteVy[m] = vy
    moteX[m] = x / width
    moteY[m] = y / height
  }
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
  const now = performance.now()
  if (!point) {
    pointerX = -1
    pointerY = -1
    return
  }
  if (pointerX >= 0 && lastPointerTs) {
    const dt = Math.max(8, now - lastPointerTs) / 1000
    pointerVx = Math.max(-1600, Math.min(1600, (point.x - pointerX) / dt))
    pointerVy = Math.max(-1600, Math.min(1600, (point.y - pointerY) / dt))
  }
  lastPointerTs = now
  pointerX = point.x
  pointerY = point.y
}

function handlePointerDown(event: PointerEvent): void {
  if (reducedMotion) return
  const point = canvasPoint(event)
  if (!point) return
  const now = performance.now()
  if (now - lastFlickTs < FLICK_COOLDOWN_MS) return
  lastFlickTs = now
  pendingFlickX = point.x
  pendingFlickY = point.y
}

function applyFlick(): void {
  // Flick the crystal nearest the click: a hard spin and a nudge sideways.
  let best: Prism | null = null
  let bestDist = Infinity
  for (const p of prisms) {
    const d = Math.hypot(p.bobX - pendingFlickX, p.bobY - pendingFlickY)
    if (d < bestDist) {
      bestDist = d
      best = p
    }
  }
  if (best) {
    const side = pendingFlickX < best.bobX ? 1 : -1
    best.twistVel += side * (7 + random() * 4)
    best.swingVel += side * 0.9
    best.flash = 1
  }
  pendingFlickX = -1
  pendingFlickY = -1
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
  layoutScene()
}

function drawRoom(): void {
  if (!context) return
  // Warm plaster wall in late-afternoon light.
  const wall = context.createLinearGradient(0, 0, width, height)
  wall.addColorStop(0, '#f1dcc0')
  wall.addColorStop(0.55, '#d9b993')
  wall.addColorStop(1, '#9c7a5e')
  context.fillStyle = wall
  context.fillRect(0, 0, width, height)

  // Sky through the glass.
  const sky = context.createLinearGradient(0, winY0, 0, winY1)
  sky.addColorStop(0, '#9fc7e8')
  sky.addColorStop(0.6, '#f4dcae')
  sky.addColorStop(1, '#f6c98a')
  context.fillStyle = sky
  context.fillRect(winX0, winY0, winX1 - winX0, winY1 - winY0)

  // The low sun, just outside the upper corner of the window.
  const sunX = winX0 + (winX1 - winX0) * 0.22
  const sunY = winY0 + (winY1 - winY0) * 0.3
  const sun = context.createRadialGradient(
    sunX,
    sunY,
    0,
    sunX,
    sunY,
    (winX1 - winX0) * 0.6,
  )
  sun.addColorStop(0, 'rgba(255, 250, 225, 0.95)')
  sun.addColorStop(0.15, 'rgba(255, 236, 190, 0.6)')
  sun.addColorStop(1, 'rgba(255, 220, 160, 0)')
  context.fillStyle = sun
  context.fillRect(winX0, winY0, winX1 - winX0, winY1 - winY0)

  // A distant hill line along the bottom panes.
  context.fillStyle = 'rgba(120, 140, 110, 0.55)'
  context.beginPath()
  context.moveTo(winX0, winY1)
  for (let i = 0; i <= 24; i += 1) {
    const x = winX0 + ((winX1 - winX0) * i) / 24
    const y =
      winY1 -
      (winY1 - winY0) *
        (0.12 + Math.sin(i * 0.7) * 0.03 + Math.sin(i * 1.9) * 0.015)
    context.lineTo(x, y)
  }
  context.lineTo(winX1, winY1)
  context.closePath()
  context.fill()

  // Sunbeam falling into the room through the glass.
  context.save()
  context.globalCompositeOperation = 'lighter'
  const beam = context.createLinearGradient(
    winX0,
    winY0,
    winX1 + throwX * width * 0.5,
    winY1 + throwY * height * 0.5,
  )
  beam.addColorStop(0, 'rgba(255, 220, 160, 0.1)')
  beam.addColorStop(1, 'rgba(255, 220, 160, 0)')
  context.fillStyle = beam
  context.beginPath()
  context.moveTo(winX1, winY0)
  context.lineTo(winX1 + throwX * width, winY0 + throwY * height)
  context.lineTo(winX1 + throwX * width, winY1 + throwY * height)
  context.lineTo(winX1, winY1)
  context.closePath()
  context.fill()
  context.restore()
}

function drawFrameAndRod(): void {
  if (!context) return
  const u = Math.max(0.6, unit())
  const frame = 14 * u
  const midX = (winX0 + winX1) / 2
  const midY = winY0 + (winY1 - winY0) * 0.55
  context.fillStyle = '#f7efe2'
  // Outer frame
  context.fillRect(
    winX0 - frame,
    winY0 - frame,
    winX1 - winX0 + frame * 2,
    frame,
  )
  context.fillRect(winX0 - frame, winY1, winX1 - winX0 + frame * 2, frame * 1.6)
  context.fillRect(winX0 - frame, winY0, frame, winY1 - winY0)
  context.fillRect(winX1, winY0, frame, winY1 - winY0)
  // Mullions
  context.fillRect(midX - frame * 0.3, winY0, frame * 0.6, winY1 - winY0)
  context.fillRect(winX0, midY - frame * 0.3, winX1 - winX0, frame * 0.6)
  // Sill shadow
  context.fillStyle = 'rgba(90, 60, 40, 0.25)'
  context.fillRect(
    winX0 - frame,
    winY1 + frame * 1.6,
    winX1 - winX0 + frame * 2,
    frame * 0.5,
  )

  // Brass curtain rod with finials.
  const rodGrad = context.createLinearGradient(0, rodY - 3 * u, 0, rodY + 3 * u)
  rodGrad.addColorStop(0, '#f3d58e')
  rodGrad.addColorStop(0.5, '#b7852f')
  rodGrad.addColorStop(1, '#6f4e1c')
  context.fillStyle = rodGrad
  context.fillRect(
    winX0 - frame * 1.6,
    rodY - 3 * u,
    winX1 - winX0 + frame * 3.2,
    6 * u,
  )
  context.beginPath()
  context.arc(winX0 - frame * 1.6, rodY, 6 * u, 0, TWO_PI)
  context.arc(winX1 + frame * 1.6, rodY, 6 * u, 0, TWO_PI)
  context.fill()
}

function prismFacing(p: Prism): number {
  // How squarely the crystal's best facet faces the sun, 0..1.
  return Math.pow(Math.abs(Math.cos(p.twist * (FACETS / 2) * 0.5)), 2)
}

function drawRainbows(): void {
  if (!context || !spectrumSprite) return
  const u = Math.max(0.6, unit())
  context.save()
  // Rainbows land on the wall, never on the glass itself.
  context.beginPath()
  context.rect(0, 0, width, height)
  context.rect(winX0, winY0, winX1 - winX0, winY1 - winY0)
  context.clip('evenodd')
  context.globalCompositeOperation = 'lighter'
  const span = Math.min(width, height)
  for (const p of prisms) {
    // Two refracted spectra per crystal, deviated by twice the twist.
    for (let k = 0; k < 2; k += 1) {
      const a = 2 * p.twist + k * Math.PI * 0.85 + p.hueShift
      const facing =
        Math.max(0, Math.cos(a * 0.5 + k)) * (0.35 + prismFacing(p) * 0.65)
      const alpha = Math.min(1, facing * (0.7 + p.flash * 0.6))
      if (alpha < 0.03) continue
      // Far enough to clear the window, then swept by the deviation angle.
      const clear = landscape
        ? (winX1 - p.bobX) / throwX + width * 0.06
        : (winY1 - p.bobY) / throwY + height * 0.05
      const throwLen = clear + span * 0.3 * (1 + Math.sin(a))
      const lateral = Math.cos(a) * span * (landscape ? 0.4 : 0.3)
      const sx = p.bobX + throwX * throwLen - throwY * lateral
      const sy = p.bobY + throwY * throwLen + throwX * lateral
      const spin = a * 0.25 + Math.atan2(throwY, throwX) + Math.PI / 2
      const len = (95 + 70 * p.size) * u * (0.7 + 0.5 * Math.abs(Math.sin(a)))
      context.globalAlpha = alpha
      context.save()
      context.translate(sx, sy)
      context.rotate(spin)
      context.drawImage(spectrumSprite, -len / 2, -len * 0.14, len, len * 0.28)
      context.restore()
    }
  }
  context.restore()
  context.globalAlpha = 1
}

function drawThreads(): void {
  if (!context) return
  const u = Math.max(0.6, unit())
  context.strokeStyle = 'rgba(250, 245, 235, 0.55)'
  context.lineWidth = 0.7 * u
  context.beginPath()
  for (const p of prisms) {
    context.moveTo(anchorPx(p), rodY)
    context.lineTo(p.bobX, p.bobY)
  }
  context.stroke()
}

function drawPrism(p: Prism): void {
  if (!context) return
  const u = Math.max(0.6, unit())
  const r = 16 * p.size * u
  // Profile: [height from top, radius fraction] pairs per shape.
  const profiles = [
    // Teardrop: short crown, long pavilion.
    [
      [0, 0],
      [0.6, 0.75],
      [1.1, 1],
      [3.2, 0],
    ],
    // Octahedron.
    [
      [0, 0],
      [1.4, 1],
      [2.8, 0],
    ],
    // Long hexagonal pendant.
    [
      [0, 0],
      [0.5, 0.8],
      [2.4, 0.8],
      [3.1, 0],
    ],
  ]
  const profile = profiles[p.shape] ?? profiles[0] ?? []
  context.save()
  context.translate(p.bobX, p.bobY)
  context.rotate(-p.swing)
  const halfFacet = Math.PI / FACETS
  for (let band = 0; band < profile.length - 1; band += 1) {
    const top = profile[band] ?? [0, 0]
    const bottom = profile[band + 1] ?? [0, 0]
    const y0 = (top[0] ?? 0) * r
    const y1 = (bottom[0] ?? 0) * r
    const r0 = (top[1] ?? 0) * r
    const r1 = (bottom[1] ?? 0) * r
    for (let f = 0; f < FACETS; f += 1) {
      const centre = p.twist + (f / FACETS) * TWO_PI
      if (Math.cos(centre) <= 0) continue
      const left = Math.sin(centre - halfFacet)
      const right = Math.sin(centre + halfFacet)
      // Light from the window side; facets turning toward it blaze.
      const light = Math.max(0, Math.cos(centre + 0.9))
      const tilt = band === 0 ? 0.15 : 0
      const glow = 0.18 + light * 0.6 + tilt + p.flash * 0.25
      const hue = ((((centre / TWO_PI) * 360 + band * 40) % 360) + 360) % 360
      const sparkle = Math.pow(light, 18)
      context.fillStyle = `hsla(${hue.toFixed(0)}, ${(30 + sparkle * 60).toFixed(0)}%, ${(70 + glow * 25).toFixed(0)}%, ${(0.35 + glow * 0.45).toFixed(2)})`
      context.beginPath()
      context.moveTo(left * r0, y0)
      context.lineTo(right * r0, y0)
      context.lineTo(right * r1, y1)
      context.lineTo(left * r1, y1)
      context.closePath()
      context.fill()
    }
  }
  // Crisp facet edges.
  context.strokeStyle = 'rgba(255, 255, 255, 0.55)'
  context.lineWidth = 0.6 * u
  context.beginPath()
  for (let band = 0; band < profile.length - 1; band += 1) {
    const top = profile[band] ?? [0, 0]
    const bottom = profile[band + 1] ?? [0, 0]
    for (let f = 0; f < FACETS; f += 1) {
      const edge = p.twist + (f / FACETS) * TWO_PI - halfFacet
      if (Math.cos(edge) < -0.05) continue
      const s = Math.sin(edge)
      context.moveTo(s * (top[1] ?? 0) * r, (top[0] ?? 0) * r)
      context.lineTo(s * (bottom[1] ?? 0) * r, (bottom[0] ?? 0) * r)
    }
  }
  context.stroke()
  // Brass cap where the thread ties on.
  context.fillStyle = '#c99a45'
  context.beginPath()
  context.arc(0, -1.5 * u, 2 * u, 0, TWO_PI)
  context.fill()

  // A star glint when the best facet swings into the sun.
  const glint =
    prismFacing(p) * Math.max(0, Math.cos(p.twist * 3 + clock * 0.5)) + p.flash
  if (glint > 0.55) {
    const len = (glint - 0.45) * 22 * u
    const gy = r * 0.9
    context.strokeStyle = `rgba(255, 252, 235, ${Math.min(0.9, glint - 0.3).toFixed(2)})`
    context.lineWidth = 0.9 * u
    context.beginPath()
    context.moveTo(-len, gy)
    context.lineTo(len, gy)
    context.moveTo(0, gy - len)
    context.lineTo(0, gy + len)
    context.stroke()
  }
  context.restore()
}

function drawMotes(): void {
  if (!context) return
  const u = Math.max(0.6, unit())
  context.save()
  context.globalCompositeOperation = 'lighter'
  context.fillStyle = 'rgba(255, 240, 200, 0.55)'
  context.beginPath()
  for (let m = 0; m < MOTE_COUNT; m += 1) {
    const x = (moteX[m] ?? 0) * width
    const y = (moteY[m] ?? 0) * height
    const twinkle = 0.5 + 0.5 * Math.sin(clock * 1.7 + (motePhase[m] ?? 0))
    const r = (moteR[m] ?? 1) * u * (0.6 + twinkle * 0.6)
    context.moveTo(x + r, y)
    context.arc(x, y, r, 0, TWO_PI)
  }
  context.fill()
  context.restore()
}

function drawFrame(): void {
  if (!context) return
  updateBobs()
  drawRoom()
  drawRainbows()
  drawFrameAndRod()
  drawThreads()
  for (const p of prisms) drawPrism(p)
  drawMotes()

  const vignette = context.createRadialGradient(
    width / 2,
    height / 2,
    Math.min(width, height) * 0.35,
    width / 2,
    height / 2,
    Math.max(width, height) * 0.78,
  )
  vignette.addColorStop(0, 'rgba(0, 0, 0, 0)')
  vignette.addColorStop(1, 'rgba(40, 22, 10, 0.45)')
  context.fillStyle = vignette
  context.fillRect(0, 0, width, height)
}

function renderFrame(timestamp: number): void {
  if (!context) return
  const dt = lastFrameTs ? Math.min(0.1, (timestamp - lastFrameTs) / 1000) : 0
  lastFrameTs = timestamp
  const steps = Math.max(1, Math.ceil(dt * 120))
  const h = dt / steps
  for (let s = 0; s < steps; s += 1) {
    clock += h
    stepPhysics(h)
    updateBobs()
  }
  if (pendingFlickX >= 0) applyFlick()
  // The puff of air from a pointer gesture dies away quickly.
  const decay = Math.exp(-dt * 6)
  pointerVx *= decay
  pointerVy *= decay
  stepMotes(dt)
  drawFrame()
  animationFrameId = window.requestAnimationFrame(renderFrame)
}

function startLive(): void {
  buildScene()
  layoutScene()
  clock = 0
  pendingFlickX = -1
  pendingFlickY = -1
}

function drawStill(): void {
  // A deterministic, settled window with every rainbow in place.
  seed = 11
  pointerX = -1
  pointerY = -1
  pointerVx = 0
  pointerVy = 0
  buildScene()
  for (const p of prisms) {
    p.swing = 0
    p.twist = p.twistRest
  }
  layoutScene()
  clock = 3
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
    seed = Math.floor(Math.random() * 1e9)
    startLive()
    animationFrameId = window.requestAnimationFrame(renderFrame)
  }
}

onMounted(() => {
  const canvas = canvasRef.value
  if (!canvas) return
  context = canvas.getContext('2d')
  if (!context) return
  buildSpectrumSprite()

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
  if (reducedMotion) {
    resizeCanvas()
    drawStill()
  } else {
    seed = Math.floor(Math.random() * 1e9)
    startLive()
    resizeCanvas()
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
  spectrumSprite = null
})
</script>

<style scoped>
.prism-sun-catcher {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}
</style>
