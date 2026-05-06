<!-- /components/content/screenfx/wandering-creatures.vue -->
<template>
  <div class="creature-stage">
    <div
      v-for="c in creatures"
      :key="c.id"
      class="creature"
      :style="creatureStyle(c)"
    >
      <Icon :name="c.icon" :style="iconStyle(c)" />
      <!-- Rest indicator -->
      <div v-if="c.state === 'resting'" class="zzz">z</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'

// ─── Types ────────────────────────────────────────────────────────────────────

type CreatureState = 'wander' | 'resting' | 'flee' | 'follow' | 'edge'

type Personality =
  | 'flutterer' // butterfly: gentle sinusoidal drift, occasional hover-pause
  | 'plodder' // snail: very slow, straight lines, long rests
  | 'zigzagger' // bee: fast, sharp turns, never rests
  | 'edger' // cat: hugs screen edges, sudden bursts
  | 'drifter' // ghost: slow sinusoidal float, passes through all zones
  | 'schooler' // fish: tries to stay near other fish
  | 'pacer' // robot: deliberate back-and-forth in a lane
  | 'bouncer' // star: pinballs with constant speed

interface Creature {
  id: number
  icon: string
  personality: Personality
  x: number
  y: number
  vx: number
  vy: number
  angle: number // visual facing angle (degrees)
  targetAngle: number // steering target
  speed: number // base speed
  size: number
  state: CreatureState
  stateTimer: number // frames until state change
  phase: number // for sinusoidal wobble
  flipX: boolean // mirror icon horizontally
  hue: number // CSS hue-rotate for color variety
  opacity: number
  targetOpacity: number
  laneY: number // for pacer personality
}

// ─── Config ───────────────────────────────────────────────────────────────────

const CREATURE_DEFS: {
  icon: string
  personality: Personality
  count: number
  size: number
  hue: number
}[] = [
  {
    icon: 'kind-icon:butterfly',
    personality: 'flutterer',
    count: 3,
    size: 32,
    hue: 280,
  },
  {
    icon: 'kind-icon:bee',
    personality: 'zigzagger',
    count: 2,
    size: 28,
    hue: 45,
  },
  {
    icon: 'kind-icon:snail',
    personality: 'plodder',
    count: 2,
    size: 36,
    hue: 120,
  },
  { icon: 'kind-icon:cat', personality: 'edger', count: 2, size: 34, hue: 30 },
  {
    icon: 'kind-icon:ghost',
    personality: 'drifter',
    count: 2,
    size: 38,
    hue: 200,
  },
  {
    icon: 'kind-icon:fish',
    personality: 'schooler',
    count: 3,
    size: 30,
    hue: 190,
  },
  {
    icon: 'kind-icon:robot',
    personality: 'pacer',
    count: 2,
    size: 36,
    hue: 160,
  },
  {
    icon: 'kind-icon:star',
    personality: 'bouncer',
    count: 2,
    size: 26,
    hue: 55,
  },
]

const BASE_SPEEDS: Record<Personality, number> = {
  flutterer: 0.9,
  plodder: 0.25,
  zigzagger: 2.8,
  edger: 1.4,
  drifter: 0.55,
  schooler: 1.1,
  pacer: 0.8,
  bouncer: 2.2,
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const rand = (a: number, b: number) => a + Math.random() * (b - a)
const randInt = (a: number, b: number) => Math.floor(rand(a, b + 1))
const lerp = (a: number, b: number, t: number) => a + (b - a) * t
const angleDiff = (a: number, b: number) => {
  let d = ((((b - a) % 360) + 540) % 360) - 180
  return d
}

// ─── Component ────────────────────────────────────────────────────────────────

const creatures = ref<Creature[]>([])
let rafId: number | null = null
let W = window.innerWidth
let H = window.innerHeight

const buildCreatures = () => {
  let id = 0
  const all: Creature[] = []

  for (const def of CREATURE_DEFS) {
    for (let i = 0; i < def.count; i++) {
      const speed = BASE_SPEEDS[def.personality]
      const angle = rand(0, 360)
      all.push({
        id: id++,
        icon: def.icon,
        personality: def.personality,
        x: rand(def.size, W - def.size),
        y: rand(def.size, H - def.size),
        vx: Math.cos((angle * Math.PI) / 180) * speed,
        vy: Math.sin((angle * Math.PI) / 180) * speed,
        angle,
        targetAngle: angle,
        speed,
        size: def.size,
        state: 'wander',
        stateTimer: randInt(120, 400),
        phase: rand(0, Math.PI * 2),
        flipX: Math.random() > 0.5,
        hue: def.hue + randInt(-20, 20),
        opacity: 0,
        targetOpacity: 0.88,
        laneY: rand(H * 0.2, H * 0.8),
      })
    }
  }

  creatures.value = all
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const creatureStyle = (c: Creature) => ({
  transform: `translate(${c.x - c.size / 2}px, ${c.y - c.size / 2}px)`,
  width: `${c.size}px`,
  height: `${c.size}px`,
  opacity: c.opacity,
})

const iconStyle = (c: Creature) => ({
  width: '100%',
  height: '100%',
  display: 'block',
  filter: `hue-rotate(${c.hue}deg) ${c.state === 'resting' ? 'brightness(0.6)' : 'brightness(1)'}`,
  transform: `scaleX(${c.flipX ? -1 : 1}) rotate(${
    c.personality === 'drifter'
      ? Math.sin(c.phase) * 8
      : c.personality === 'flutterer'
        ? Math.sin(c.phase * 2) * 12
        : 0
  }deg)`,
  transition: 'filter 0.5s',
  color: 'var(--color-accent, #a78bfa)',
})

// ─── Steering ─────────────────────────────────────────────────────────────────

const steerToward = (c: Creature, tx: number, ty: number): number => {
  const dx = tx - c.x,
    dy = ty - c.y
  return (Math.atan2(dy, dx) * 180) / Math.PI
}

const nearestOfPersonality = (c: Creature, p: Personality): Creature | null => {
  let best: Creature | null = null
  let bestDist = Infinity
  for (const o of creatures.value) {
    if (o.id === c.id || o.personality !== p) continue
    const dx = o.x - c.x,
      dy = o.y - c.y
    const d = dx * dx + dy * dy
    if (d < bestDist) {
      bestDist = d
      best = o
    }
  }
  return best
}

// ─── Update ───────────────────────────────────────────────────────────────────

const update = () => {
  W = window.innerWidth
  H = window.innerHeight
  const MARGIN = 60

  for (const c of creatures.value) {
    c.phase += 0.04
    c.stateTimer--
    c.opacity = lerp(c.opacity, c.targetOpacity, 0.02)

    // ── State transitions ─────────────────────────────────────────────────

    if (c.stateTimer <= 0) {
      if (c.personality === 'plodder') {
        c.state = c.state === 'resting' ? 'wander' : 'resting'
        c.stateTimer =
          c.state === 'resting' ? randInt(180, 400) : randInt(200, 600)
      } else if (c.personality === 'zigzagger') {
        c.targetAngle = rand(0, 360)
        c.stateTimer = randInt(20, 60)
      } else if (c.personality === 'edger') {
        c.state = c.state === 'edge' ? 'wander' : 'edge'
        c.stateTimer = randInt(150, 350)
      } else if (c.personality === 'schooler') {
        c.state = Math.random() > 0.3 ? 'follow' : 'wander'
        c.stateTimer = randInt(100, 280)
      } else {
        c.targetAngle += rand(-60, 60)
        c.stateTimer = randInt(80, 250)
      }
    }

    if (c.state === 'resting') continue

    // ── Personality steering ─────────────────────────────────────────────

    let turnRate = 3

    switch (c.personality) {
      case 'flutterer': {
        // Gentle wander with sinusoidal side-drift
        c.targetAngle += Math.sin(c.phase * 0.7) * 2.5
        turnRate = 2
        c.speed = BASE_SPEEDS.flutterer + Math.sin(c.phase) * 0.3
        break
      }
      case 'zigzagger': {
        turnRate = 14
        c.speed = BASE_SPEEDS.zigzagger + rand(-0.5, 0.5)
        break
      }
      case 'plodder': {
        turnRate = 0.5
        c.speed = BASE_SPEEDS.plodder
        break
      }
      case 'edger': {
        if (c.state === 'edge') {
          // Hug the nearest wall
          const distLeft = c.x
          const distRight = W - c.x
          const distTop = c.y
          const distBot = H - c.y
          const minDist = Math.min(distLeft, distRight, distTop, distBot)
          let wallTarget = c.targetAngle
          if (minDist === distLeft) wallTarget = rand(-30, 30) // move along left wall downward
          if (minDist === distRight) wallTarget = 180 + rand(-30, 30) // along right wall
          if (minDist === distTop) wallTarget = 90 + rand(-30, 30) // along top
          if (minDist === distBot) wallTarget = 270 + rand(-30, 30) // along bottom
          c.targetAngle = wallTarget
          turnRate = 5
        }
        c.speed = BASE_SPEEDS.edger + (Math.random() > 0.98 ? rand(1.5, 3) : 0) // occasional burst
        break
      }
      case 'drifter': {
        // Float with sinusoidal vertical wobble
        c.vx = BASE_SPEEDS.drifter * Math.cos((c.angle * Math.PI) / 180)
        c.vy =
          BASE_SPEEDS.drifter * Math.sin((c.angle * Math.PI) / 180) +
          Math.sin(c.phase * 0.6) * 0.4
        c.targetAngle += Math.sin(c.phase * 0.4) * 1.5
        turnRate = 1
        break
      }
      case 'schooler': {
        if (c.state === 'follow') {
          const nearest = nearestOfPersonality(c, 'schooler')
          if (nearest) {
            c.targetAngle = steerToward(c, nearest.x, nearest.y)
            // Don't crowd — if very close, veer away
            const dx = nearest.x - c.x,
              dy = nearest.y - c.y
            if (dx * dx + dy * dy < 60 * 60) c.targetAngle += 180
          }
        }
        c.speed = BASE_SPEEDS.schooler
        turnRate = 4
        break
      }
      case 'pacer': {
        // Walk back and forth horizontally in a lane
        const targetX = c.flipX ? MARGIN : W - MARGIN
        c.targetAngle = steerToward(c, targetX, c.laneY)
        if (Math.abs(c.x - targetX) < 20) c.flipX = !c.flipX
        turnRate = 3
        c.speed = BASE_SPEEDS.pacer
        break
      }
      case 'bouncer': {
        // Constant speed, bounce off walls with perfect reflection
        // (handled in boundary section below, no steering needed)
        turnRate = 0
        c.speed = BASE_SPEEDS.bouncer
        break
      }
    }

    // ── Smooth turn ───────────────────────────────────────────────────────

    if (turnRate > 0) {
      const diff = angleDiff(c.angle, c.targetAngle)
      c.angle += Math.sign(diff) * Math.min(Math.abs(diff), turnRate)
    }

    // ── Apply velocity ────────────────────────────────────────────────────

    const rad = (c.angle * Math.PI) / 180
    if (c.personality !== 'drifter') {
      c.vx = lerp(c.vx, Math.cos(rad) * c.speed, 0.12)
      c.vy = lerp(c.vy, Math.sin(rad) * c.speed, 0.12)
    }

    c.x += c.vx
    c.y += c.vy

    // ── Flip icon to match movement direction ─────────────────────────────

    if (
      Math.abs(c.vx) > 0.1 &&
      c.personality !== 'drifter' &&
      c.personality !== 'bouncer'
    ) {
      c.flipX = c.vx < 0
    }

    // ── Boundary handling ─────────────────────────────────────────────────

    if (c.personality === 'bouncer') {
      if (c.x < MARGIN) {
        c.x = MARGIN
        c.vx = Math.abs(c.vx)
      }
      if (c.x > W - MARGIN) {
        c.x = W - MARGIN
        c.vx = -Math.abs(c.vx)
      }
      if (c.y < MARGIN) {
        c.y = MARGIN
        c.vy = Math.abs(c.vy)
      }
      if (c.y > H - MARGIN) {
        c.y = H - MARGIN
        c.vy = -Math.abs(c.vy)
      }
      c.angle = (Math.atan2(c.vy, c.vx) * 180) / Math.PI
    } else {
      // Wrap-around for most personalities
      if (c.x < -c.size) c.x = W + c.size
      if (c.x > W + c.size) c.x = -c.size
      if (c.y < -c.size) c.y = H + c.size
      if (c.y > H + c.size) c.y = -c.size
    }
  }
}

// ─── RAF loop ─────────────────────────────────────────────────────────────────

onMounted(() => {
  W = window.innerWidth
  H = window.innerHeight
  buildCreatures()

  const tick = () => {
    update()
    rafId = requestAnimationFrame(tick)
  }
  rafId = requestAnimationFrame(tick)

  window.addEventListener('resize', () => {
    W = window.innerWidth
    H = window.innerHeight
  })
})

onBeforeUnmount(() => {
  if (rafId) cancelAnimationFrame(rafId)
})
</script>

<style scoped>
.creature-stage {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  pointer-events: none;
  overflow: hidden;
  z-index: 52;
}

.creature {
  position: absolute;
  top: 0;
  left: 0;
  will-change: transform, opacity;
  transition: opacity 1.2s ease;
}

.zzz {
  position: absolute;
  top: -12px;
  right: -4px;
  font-size: 11px;
  color: rgba(200, 200, 255, 0.7);
  animation: zzz-float 1.8s ease-in-out infinite;
  pointer-events: none;
  font-family: serif;
  font-style: italic;
}

@keyframes zzz-float {
  0% {
    transform: translate(0, 0) scale(0.8);
    opacity: 0.3;
  }
  50% {
    transform: translate(4px, -8px) scale(1.1);
    opacity: 0.8;
  }
  100% {
    transform: translate(8px, -16px) scale(0.6);
    opacity: 0;
  }
}
</style>
