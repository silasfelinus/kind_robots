<!-- /components/content/screenfx/pocket-gremlin.vue -->
<template>
  <div class="gremlin-stage" :style="stageStyle">
    <!-- Speech bubble -->
    <Transition name="speech">
      <div v-if="speech" class="speech-bubble" :class="bubbleClass">
        {{ speech }}
      </div>
    </Transition>

    <!-- Pet canvas -->
    <canvas
      ref="canvasRef"
      class="gremlin-canvas"
      :width="SIZE"
      :height="SIZE"
    />

    <!-- Mood indicator pip -->
    <div class="mood-pip" :style="{ background: MOOD_COLORS[mood] }" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'

// ─── Types ────────────────────────────────────────────────────────────────────

type PetMood =
  | 'idle'
  | 'curious'
  | 'happy'
  | 'startled'
  | 'sleepy'
  | 'hungry'
  | 'dramatic'
  | 'chaos'

// ─── Constants ────────────────────────────────────────────────────────────────

const SIZE = 96 // canvas px
const MARGIN = 20 // from screen edge
const PAD_X = MARGIN + SIZE / 2
const PAD_Y = MARGIN + SIZE / 2

const MOOD_COLORS: Record<PetMood, string> = {
  idle: '#94a3b8',
  curious: '#60a5fa',
  happy: '#4ade80',
  startled: '#fbbf24',
  sleepy: '#a78bfa',
  hungry: '#fb923c',
  dramatic: '#f43f5e',
  chaos: '#e879f9',
}

const LINES: Record<PetMood, string[]> = {
  idle: [
    'beep?',
    'I found a pixel.',
    'Your tabs are haunted.',
    'Snack protocols: armed.',
    'I am behaving. Suspiciously.',
    'processing... nothing.',
    'static is just spicy silence.',
    '01101000 01101001',
  ],
  curious: [
    'ooh.',
    'what is that.',
    'investigating.',
    'cursor detected. intriguing.',
    'tell me more.',
  ],
  happy: [
    'excellent click.',
    'tiny joy detected.',
    'you have pleased the gremlin.',
    'morale +3',
    'beep boop ♥',
    'affection.exe running',
  ],
  startled: [
    'heck!',
    'who moved the universe?',
    'motion detected. dignity lost.',
    'AUGH',
    'not today!!',
  ],
  sleepy: [
    'screen nap initiated.',
    'wake me for snacks.',
    'dreaming of semicolons.',
    'zzzzt...',
    'do not disturb',
  ],
  hungry: [
    'snack?',
    'feed me pixels.',
    'hunger.exe critical',
    'where is the cookie',
    'click me. I am snack-deprived.',
  ],
  dramatic: [
    'you FORGOT about me.',
    'I have been alone for centuries.',
    'dramatic sigh.',
    'fine. I will just sit here.',
    'abandoned. alone. in a browser.',
    'you wound me.',
  ],
  chaos: [
    'CHAOS MODE ACTIVATED',
    'I am free!!',
    'everything is fine!!',
    'WEEEE',
    'maximum gremlin energy',
    '!!!!!!!',
  ],
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const rand = (a: number, b: number) => a + Math.random() * (b - a)
const randInt = (a: number, b: number) => Math.floor(rand(a, b + 1))
const pick = <T,>(arr: T[]): T => arr[randInt(0, arr.length - 1)]!
const lerp = (a: number, b: number, t: number) => a + (b - a) * t
const dist = (ax: number, ay: number, bx: number, by: number) =>
  Math.sqrt((ax - bx) ** 2 + (ay - by) ** 2)

// ─── Component ────────────────────────────────────────────────────────────────

const canvasRef = ref<HTMLCanvasElement | null>(null)
const mood = ref<PetMood>('idle')
const speech = ref<string | null>(null)

let rafId: number | null = null

// Position in screen space (center of canvas)
let petX = 0
let petY = 0

// Animation state
let frame = 0
let blinkTimer = 0
let isBlinking = false
let bouncePhase = 0
let wigglePhase = 0
let lookX = 0 // eye target offset -1..1
let lookY = 0
let energy = 1.0
let affection = 0.5
let lastActivity = 0 // frame of last interaction
let moodUntil = 0
let speechUntil = 0
let wanderTimer = 0
let wanderTargetX = 0
let wanderTargetY = 0
let petScreenX = 0 // screen position of canvas center
let petScreenY = 0
let mouseX = -999
let mouseY = -999
let mouseSpeed = 0
let lastMouseX = -999
let lastMouseY = -999

// ── Position style ────────────────────────────────────────────────────────────

const stageStyle = computed(() => ({
  transform: `translate(${petX - SIZE / 2}px, ${petY - SIZE / 2}px)`,
}))

const bubbleClass = computed(() => {
  // Place bubble above or below based on vertical position
  const belowMid = petY > window.innerHeight * 0.6
  return belowMid ? 'bubble-above' : 'bubble-below'
})

// ── Mood control ──────────────────────────────────────────────────────────────

const setMood = (m: PetMood, duration = 180) => {
  mood.value = m
  moodUntil = frame + duration
}

const say = (line?: string) => {
  const m = mood.value
  speech.value = line ?? pick(LINES[m])
  speechUntil = frame + 180 + speech.value.length * 4
}

// ── Draw helpers ──────────────────────────────────────────────────────────────

const drawGremlin = (ctx: CanvasRenderingContext2D) => {
  const cx = SIZE / 2
  const cy = SIZE / 2 + 4
  const m = mood.value
  const hue = {
    idle: 220,
    curious: 200,
    happy: 140,
    startled: 45,
    sleepy: 270,
    hungry: 30,
    dramatic: 350,
    chaos: 290,
  }[m]

  // Bounce offset
  const bounce =
    Math.sin(bouncePhase) * (m === 'chaos' ? 8 : m === 'happy' ? 5 : 2)
  const wiggle = Math.sin(wigglePhase) * (m === 'chaos' ? 6 : 1.5)
  const scale = m === 'dramatic' ? 0.85 + Math.sin(bouncePhase * 0.5) * 0.06 : 1

  ctx.save()
  ctx.translate(cx + wiggle, cy + bounce)
  ctx.scale(scale, scale)

  // ── Shadow ─────────────────────────────────────────────────────────────────

  ctx.beginPath()
  ctx.ellipse(0, 30, 18 * scale, 5, 0, 0, Math.PI * 2)
  ctx.fillStyle = 'rgba(0,0,0,0.18)'
  ctx.fill()

  // ── Body ───────────────────────────────────────────────────────────────────

  const bodyGrad = ctx.createRadialGradient(-6, -8, 2, 0, 0, 24)
  bodyGrad.addColorStop(0, `hsl(${hue},80%,72%)`)
  bodyGrad.addColorStop(1, `hsl(${hue},70%,50%)`)
  ctx.beginPath()
  ctx.ellipse(0, 0, 22, 24, 0, 0, Math.PI * 2)
  ctx.fillStyle = bodyGrad
  ctx.fill()

  // Body panel line
  ctx.strokeStyle = `hsla(${hue},50%,40%,0.3)`
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.arc(0, 4, 10, Math.PI * 0.3, Math.PI * 0.9)
  ctx.stroke()

  // ── Ears / antennae ────────────────────────────────────────────────────────

  const earWiggle = Math.sin(bouncePhase * 1.3) * (m === 'startled' ? 12 : 3)
  // Left ear
  ctx.strokeStyle = `hsl(${hue},65%,55%)`
  ctx.lineWidth = 2.5
  ctx.lineCap = 'round'
  ctx.beginPath()
  ctx.moveTo(-12, -18)
  ctx.quadraticCurveTo(-22 + earWiggle, -32, -18 + earWiggle, -38)
  ctx.stroke()
  // Right ear
  ctx.beginPath()
  ctx.moveTo(12, -18)
  ctx.quadraticCurveTo(22 - earWiggle, -32, 18 - earWiggle, -38)
  ctx.stroke()

  // Ear tips
  ctx.fillStyle = `hsl(${hue},80%,70%)`
  ctx.beginPath()
  ctx.arc(-18 + earWiggle, -38, 3.5, 0, Math.PI * 2)
  ctx.fill()
  ctx.beginPath()
  ctx.arc(18 - earWiggle, -38, 3.5, 0, Math.PI * 2)
  ctx.fill()

  // ── Eyes ───────────────────────────────────────────────────────────────────

  const eyeOffX = lookX * 2.5
  const eyeOffY = lookY * 2

  for (const side of [-1, 1]) {
    const ex = side * 8 + eyeOffX
    const ey = -5 + eyeOffY

    if (m === 'sleepy') {
      // Half-closed droopy eyes
      ctx.fillStyle = '#fff'
      ctx.beginPath()
      ctx.ellipse(ex, ey + 1, 5, 3, 0, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = `hsl(${hue},60%,35%)`
      ctx.beginPath()
      ctx.ellipse(ex, ey + 2, 5, 2, 0, 0, Math.PI * 2)
      ctx.fill()
      // Drooping eyelid
      ctx.fillStyle = `hsl(${hue},70%,55%)`
      ctx.beginPath()
      ctx.ellipse(ex, ey - 1, 5.5, 3.5, 0, Math.PI, Math.PI * 2)
      ctx.fill()
    } else if (isBlinking) {
      ctx.strokeStyle = `hsl(${hue},60%,35%)`
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(ex - 5, ey)
      ctx.lineTo(ex + 5, ey)
      ctx.stroke()
    } else {
      // Normal eye white
      ctx.fillStyle = '#fff'
      ctx.beginPath()
      ctx.ellipse(ex, ey, 5, 5.5, 0, 0, Math.PI * 2)
      ctx.fill()
      // Pupil
      ctx.fillStyle =
        m === 'chaos' ? `hsl(${(frame * 8) % 360},90%,55%)` : '#1a1a2e'
      const pupilSize = m === 'startled' ? 4 : m === 'curious' ? 3.5 : 3
      ctx.beginPath()
      ctx.arc(ex + eyeOffX * 0.3, ey + eyeOffY * 0.3, pupilSize, 0, Math.PI * 2)
      ctx.fill()
      // Highlight
      ctx.fillStyle = 'rgba(255,255,255,0.8)'
      ctx.beginPath()
      ctx.arc(
        ex + eyeOffX * 0.3 + 1.5,
        ey + eyeOffY * 0.3 - 1.5,
        1.2,
        0,
        Math.PI * 2,
      )
      ctx.fill()
      // Star pupils in chaos mode
      if (m === 'chaos') {
        ctx.fillStyle = '#fff'
        ctx.font = '6px serif'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText('★', ex, ey)
      }
    }
  }

  // ── Mouth ──────────────────────────────────────────────────────────────────

  ctx.strokeStyle = `hsl(${hue},50%,35%)`
  ctx.lineWidth = 1.8
  ctx.lineCap = 'round'
  ctx.beginPath()

  if (m === 'happy' || m === 'chaos') {
    // Big smile
    ctx.arc(0, 8, 8, Math.PI * 0.1, Math.PI * 0.9)
    ctx.stroke()
    // Teeth
    ctx.fillStyle = '#fff'
    ctx.fillRect(-5, 8, 3, 3)
    ctx.fillRect(0, 8, 3, 3)
  } else if (m === 'dramatic') {
    // Big frown
    ctx.arc(0, 16, 8, Math.PI * 1.1, Math.PI * 1.9)
    ctx.stroke()
  } else if (m === 'startled' || m === 'hungry') {
    // Open O mouth
    ctx.beginPath()
    ctx.arc(0, 9, 5, 0, Math.PI * 2)
    ctx.strokeStyle = `hsl(${hue},50%,35%)`
    ctx.stroke()
    ctx.fillStyle = `hsl(${hue},40%,30%)`
    ctx.fill()
  } else if (m === 'sleepy') {
    // Flat/wavy sleepy mouth
    ctx.beginPath()
    ctx.moveTo(-5, 10)
    ctx.quadraticCurveTo(0, 12, 5, 10)
    ctx.stroke()
  } else {
    // Neutral small smile
    ctx.beginPath()
    ctx.arc(0, 8, 5, Math.PI * 0.15, Math.PI * 0.85)
    ctx.stroke()
  }

  // ── Sleepy ZZZs ────────────────────────────────────────────────────────────

  if (m === 'sleepy') {
    for (let z = 0; z < 3; z++) {
      const zProgress = (frame * 0.02 + z * 0.33) % 1
      const zAlpha = zProgress < 0.5 ? zProgress * 2 : (1 - zProgress) * 2
      const zSize = 8 + z * 3 + zProgress * 4
      const zX = 20 + z * 6 + zProgress * 10
      const zY = -10 - z * 8 - zProgress * 12
      ctx.save()
      ctx.globalAlpha = zAlpha * 0.8
      ctx.font = `bold ${zSize}px monospace`
      ctx.fillStyle = `hsl(${hue},70%,72%)`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText('z', zX, zY)
      ctx.restore()
    }
  }

  // ── Chaos sparkles ─────────────────────────────────────────────────────────

  if (m === 'chaos') {
    for (let i = 0; i < 5; i++) {
      const a = (frame * 0.08 + i * 1.26) % (Math.PI * 2)
      const r = 28 + Math.sin(frame * 0.1 + i) * 6
      const sx = Math.cos(a) * r
      const sy = Math.sin(a) * r
      ctx.font = `${8 + i * 2}px serif`
      ctx.fillStyle = `hsl(${(frame * 6 + i * 72) % 360},90%,70%)`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(['✦', '★', '·', '✿', '◈'][i]!, sx, sy)
    }
  }

  ctx.restore()
}

// ── Tick ──────────────────────────────────────────────────────────────────────

onMounted(() => {
  const canvas = canvasRef.value
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  // Place pet in bottom-right initially
  petX = window.innerWidth - PAD_X
  petY = window.innerHeight - PAD_Y
  wanderTargetX = petX
  wanderTargetY = petY

  const updateScreenPos = () => {
    const rect = canvas.getBoundingClientRect()
    petScreenX = rect.left + SIZE / 2
    petScreenY = rect.top + SIZE / 2
  }

  // ── Event listeners ─────────────────────────────────────────────────────────

  const onPointerMove = (e: PointerEvent) => {
    const dx = e.clientX - lastMouseX
    const dy = e.clientY - lastMouseY
    mouseSpeed = Math.sqrt(dx * dx + dy * dy)
    lastMouseX = mouseX
    lastMouseY = mouseY
    mouseX = e.clientX
    mouseY = e.clientY

    const distToPet = dist(mouseX, mouseY, petScreenX, petScreenY)

    // Look toward cursor
    if (distToPet < 300) {
      const rawLX = (mouseX - petScreenX) / 60
      const rawLY = (mouseY - petScreenY) / 60
      lookX = lerp(lookX, Math.max(-1, Math.min(1, rawLX)), 0.12)
      lookY = lerp(lookY, Math.max(-1, Math.min(1, rawLY)), 0.12)

      if (mood.value === 'idle' || mood.value === 'sleepy') {
        setMood('curious', 120)
      }
    }

    // Fast cursor near pet = startled
    if (distToPet < 100 && mouseSpeed > 18 && mood.value !== 'startled') {
      setMood('startled', 90)
      say()
      lastActivity = frame
    }
  }

  const onClick = (e: MouseEvent) => {
    const distToPet = dist(e.clientX, e.clientY, petScreenX, petScreenY)
    if (distToPet < 60) {
      // Pet was clicked / patted
      affection = Math.min(1, affection + 0.2)
      energy = Math.min(1, energy + 0.1)
      setMood('happy', 200)
      say()
      lastActivity = frame
      bouncePhase = 0
    } else {
      // Click elsewhere — pet watches
      if (mood.value === 'sleepy' || mood.value === 'idle') {
        const angle = Math.atan2(e.clientY - petScreenY, e.clientX - petScreenX)
        lookX = Math.cos(angle) * 0.8
        lookY = Math.sin(angle) * 0.8
        if (Math.random() > 0.65 && mood.value !== 'sleepy') {
          setMood('curious', 80)
        }
      }
    }
  }

  const onResize = () => {
    petX = Math.max(PAD_X, Math.min(window.innerWidth - PAD_X, petX))
    petY = Math.max(PAD_Y, Math.min(window.innerHeight - PAD_Y, petY))
  }

  window.addEventListener('pointermove', onPointerMove)
  window.addEventListener('click', onClick)
  window.addEventListener('resize', onResize)

  // ── Main loop ────────────────────────────────────────────────────────────────

  const tick = () => {
    frame++
    const W = window.innerWidth
    const H = window.innerHeight

    updateScreenPos()

    // ── Phase advances ─────────────────────────────────────────────────────

    const moodNow = mood.value
    const speedMult = moodNow === 'chaos' ? 3 : moodNow === 'happy' ? 2 : 1
    bouncePhase += 0.06 * speedMult
    wigglePhase += 0.045 * speedMult

    // ── Blink ──────────────────────────────────────────────────────────────

    blinkTimer--
    if (blinkTimer <= 0) {
      isBlinking = true
      setTimeout(() => {
        isBlinking = false
      }, 120)
      blinkTimer = randInt(140, 300)
    }

    // ── Idle drift ─────────────────────────────────────────────────────────

    // Look drift back to center
    const distCursor = dist(mouseX, mouseY, petScreenX, petScreenY)
    if (distCursor > 280) {
      lookX = lerp(lookX, 0, 0.04)
      lookY = lerp(lookY, 0, 0.04)
    }

    // ── Wander ─────────────────────────────────────────────────────────────

    wanderTimer--
    if (wanderTimer <= 0) {
      // Pick a new spot near the edges
      const side = randInt(0, 3)
      const wanderR = 60
      const cx =
        side < 2
          ? side === 0
            ? PAD_X + rand(0, W * 0.25)
            : W - PAD_X - rand(0, W * 0.25)
          : PAD_X + rand(0, W - PAD_X * 2)
      const cy =
        side >= 2
          ? side === 2
            ? PAD_Y + rand(0, H * 0.25)
            : H - PAD_Y - rand(0, H * 0.25)
          : H - PAD_Y - rand(0, H * 0.35)
      wanderTargetX = Math.max(PAD_X, Math.min(W - PAD_X, cx))
      wanderTargetY = Math.max(PAD_Y, Math.min(H - PAD_Y, cy))
      wanderTimer = randInt(400, 900)
    }

    const wanderSpeed =
      moodNow === 'chaos' ? 1.8 : moodNow === 'dramatic' ? 0 : 0.4
    petX = lerp(petX, wanderTargetX, 0.008 * wanderSpeed)
    petY = lerp(petY, wanderTargetY, 0.008 * wanderSpeed)

    // ── Mood decay ─────────────────────────────────────────────────────────

    if (frame > moodUntil) {
      const idleFrames = frame - lastActivity

      if (idleFrames > 3000 && energy < 0.3) {
        setMood('dramatic', 600)
        if (Math.random() > 0.85) say()
      } else if (idleFrames > 1800) {
        setMood('sleepy', 400)
        energy = Math.max(0, energy - 0.0003)
      } else if (idleFrames > 900 && affection < 0.3) {
        setMood('hungry', 300)
        if (Math.random() > 0.9) say()
      } else if (Math.random() > 0.998) {
        setMood('chaos', 200)
        say()
      } else {
        mood.value = 'idle'
      }
    }

    // ── Affection decay ────────────────────────────────────────────────────

    affection = Math.max(0, affection - 0.00005)

    // ── Random idle speech ─────────────────────────────────────────────────

    if (frame > speechUntil) {
      speech.value = null
      if (Math.random() > 0.994) {
        say()
        lastActivity = frame // speech counts as activity
      }
    }

    // ── Draw ───────────────────────────────────────────────────────────────

    ctx.clearRect(0, 0, SIZE, SIZE)
    drawGremlin(ctx)

    rafId = requestAnimationFrame(tick)
  }

  rafId = requestAnimationFrame(tick)

  onBeforeUnmount(() => {
    if (rafId) cancelAnimationFrame(rafId)
    window.removeEventListener('pointermove', onPointerMove)
    window.removeEventListener('click', onClick)
    window.removeEventListener('resize', onResize)
  })
})
</script>

<style scoped>
.gremlin-stage {
  position: fixed;
  top: 0;
  left: 0;
  width: v-bind('SIZE + "px"');
  height: v-bind('SIZE + "px"');
  pointer-events: none;
  z-index: 60;
  will-change: transform;
}

.gremlin-canvas {
  display: block;
  pointer-events: none;
}

/* ── Mood pip ────────────────────────────────────────────────────────────────── */

.mood-pip {
  position: absolute;
  bottom: 6px;
  right: 6px;
  width: 7px;
  height: 7px;
  border-radius: 50%;
  opacity: 0.75;
  transition: background 0.4s ease;
  box-shadow: 0 0 4px currentColor;
}

/* ── Speech bubble ───────────────────────────────────────────────────────────── */

.speech-bubble {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(10, 10, 20, 0.88);
  border: 1px solid rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(8px);
  color: rgba(255, 255, 255, 0.9);
  font-size: 11px;
  font-family: monospace;
  font-weight: 500;
  padding: 5px 10px;
  border-radius: 10px;
  white-space: nowrap;
  pointer-events: none;
  z-index: 61;
  max-width: 200px;
  white-space: normal;
  text-align: center;
  line-height: 1.4;
}

.bubble-above {
  bottom: calc(100% + 8px);
}

.bubble-below {
  top: calc(100% + 8px);
}

/* Bubble tail */
.bubble-above::after {
  content: '';
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  border: 5px solid transparent;
  border-top-color: rgba(10, 10, 20, 0.88);
}

.bubble-below::before {
  content: '';
  position: absolute;
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%);
  border: 5px solid transparent;
  border-bottom-color: rgba(10, 10, 20, 0.88);
}

/* ── Transitions ─────────────────────────────────────────────────────────────── */

.speech-enter-active {
  transition:
    opacity 0.2s ease,
    transform 0.2s ease;
}
.speech-leave-active {
  transition:
    opacity 0.35s ease,
    transform 0.35s ease;
}
.speech-enter-from {
  opacity: 0;
  transform: translateX(-50%) translateY(6px) scale(0.92);
}
.speech-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(-4px) scale(0.95);
}
</style>
