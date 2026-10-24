// /utils/arcade/games/rainbowShotLooks.ts
//
// Rainbow Bullet Hell Space Princess, conductor rainbow t-032: every hostile shot family has its own animated,
// code-drawn shape instead of one shared circle. A shot's look comes from the craft, guardian or boss that
// fired it and passes to the pellets it bursts into. Looks only change how a pellet is drawn: its hitbox,
// speed and every fairness rule stay the engine's. Each body stays inside the 8 px dark halo the engine draws
// under solid pellets, with a dark outline and a light rim, so it reads against any scenery.

export type RainbowShotLook =
  | 'pearl'
  | 'swirl'
  | 'bead'
  | 'spine'
  | 'bell'
  | 'volt'
  | 'coral'
  | 'bubble'
  | 'ember'
  | 'sonar'
  | 'dart'
  | 'fin'
  | 'torpedo'
  | 'ink'
  | 'petal'
  | 'shell'
  | 'shard'
  | 'bolt'
  | 'star'
  | 'eclipse'

/** The look each craft's fire takes (WORLD-BIBLE enemy fleet). Craft not listed fire pearls. */
export const RAINBOW_CRAFT_LOOKS: Readonly<Record<string, RainbowShotLook>> = {
  picket: 'pearl',
  spiral: 'swirl',
  anchor: 'bead',
  urchin: 'spine',
  diver: 'dart',
  lantern: 'bell',
  relay: 'volt',
  skimmer: 'volt',
  coral: 'coral',
  clawstrike: 'bolt',
  pistol: 'bubble',
  angler: 'ember',
  skate: 'shard',
  dolphin: 'sonar',
  courier: 'bubble',
  cutter: 'fin',
  hammerhead: 'torpedo',
  salvager: 'ink',
  drone: 'dart',
  turret: 'petal',
  bulwark: 'shell',
  mirror: 'shard',
  squid: 'shard',
  harbinger: 'eclipse',
  prism: 'shard',
}

/** The look each boss's fire takes, by the Act it guards (9 is the Eclipse Crown). */
export const RAINBOW_BOSS_LOOKS = {
  1: 'pearl',
  2: 'bell',
  3: 'bolt',
  4: 'sonar',
  5: 'fin',
  6: 'ember',
  7: 'shard',
  8: 'bubble',
  9: 'eclipse',
} as const satisfies Record<number, RainbowShotLook>

/** Every Act guardian fires rainbow stars. */
export const RAINBOW_GUARDIAN_LOOK: RainbowShotLook = 'star'

/** What a bursting shot's pellets look like: a bubble's ring stays bubbles, a lure scatters embers. */
export function rainbowBurstLook(
  burst: 'ring' | 'cross' | 'split' | 'cluster' | undefined,
  parent: RainbowShotLook | undefined,
): RainbowShotLook {
  if (burst === 'ring') return 'bubble'
  if (burst === 'split') return parent ?? 'shard'
  return 'ember'
}

const OUTLINE = '#1b163e'
/** Shapes are authored at a 5 px radius and drawn this much larger, so they fill the 8 px halo. */
const SHOT_SCALE = 1.3
const RAINBOW = [
  '#ff9fd8',
  '#ffd38a',
  '#fff2a8',
  '#a6fff0',
  '#9ee7ff',
  '#c9a9ff',
]

/**
 * Draw one hostile pellet at (x, y) heading (vx, vy). `t` is its animation clock in frames (slowed by the
 * caller under calm motion); `seed` staggers pellets fired together so a fan does not pulse in lockstep.
 */
export function drawRainbowShot(
  g: CanvasRenderingContext2D,
  look: RainbowShotLook,
  x: number,
  y: number,
  vx: number,
  vy: number,
  t: number,
  seed = 0,
) {
  const heading = Math.atan2(vy, vx)
  const phase = t + seed * 7
  g.save()
  g.translate(x, y)
  g.scale(SHOT_SCALE, SHOT_SCALE)
  g.lineJoin = 'round'
  switch (look) {
    case 'pearl': {
      // A rose pearl under a turning four-point twinkle that swells and fades.
      const twinkle = 0.6 + 0.4 * Math.sin(phase / 3)
      g.save()
      g.rotate(phase / 10)
      g.fillStyle = '#ffffff'
      g.globalAlpha = 0.5 + 0.5 * twinkle
      starPath(g, 4, 3.4 + 2.6 * twinkle, 1)
      g.fill()
      g.restore()
      g.fillStyle = '#ff9fd8'
      g.strokeStyle = OUTLINE
      g.lineWidth = 1.4
      g.beginPath()
      g.arc(0, 0, 3.4, 0, Math.PI * 2)
      g.fill()
      g.stroke()
      g.fillStyle = '#ffffff'
      g.beginPath()
      g.arc(-1, -1, 1.1, 0, Math.PI * 2)
      g.fill()
      break
    }
    case 'swirl': {
      // Two curled fins spinning about a bright eye.
      g.rotate(phase / 5)
      g.strokeStyle = OUTLINE
      g.lineWidth = 3.5
      for (const side of [0, Math.PI]) {
        g.beginPath()
        g.arc(0, 0, 4, side, side + 2.2)
        g.stroke()
      }
      g.strokeStyle = '#ffb8f0'
      g.lineWidth = 1.8
      for (const side of [0, Math.PI]) {
        g.beginPath()
        g.arc(0, 0, 4, side, side + 2.2)
        g.stroke()
      }
      g.fillStyle = '#ffffff'
      g.beginPath()
      g.arc(0, 0, 1.6, 0, Math.PI * 2)
      g.fill()
      break
    }
    case 'bead': {
      // A mine bead: a gold pearl whose four nubs turn and blink.
      const blink = Math.floor(phase / 10) % 2 === 0
      g.fillStyle = '#ffe99f'
      g.strokeStyle = OUTLINE
      g.lineWidth = 1.5
      g.beginPath()
      g.arc(0, 0, 4, 0, Math.PI * 2)
      g.fill()
      g.stroke()
      g.fillStyle = blink ? '#ff6f9f' : '#fff5cf'
      for (let k = 0; k < 4; k++) {
        const a = (k * Math.PI) / 2 + Math.PI / 4 + phase / 14
        g.beginPath()
        g.arc(Math.cos(a) * 5, Math.sin(a) * 5, 1.4, 0, Math.PI * 2)
        g.fill()
      }
      break
    }
    case 'spine': {
      // A spinning urchin spine-star.
      g.rotate(phase / 4)
      starPath(g, 8, 5.5, 2.4)
      g.fillStyle = '#ffc1e6'
      g.fill()
      g.strokeStyle = OUTLINE
      g.lineWidth = 1.2
      g.stroke()
      break
    }
    case 'bell': {
      // A little jelly bell that pulses as it swims, trailing two tentacles.
      g.rotate(heading + Math.PI / 2)
      const squeeze = 1 + Math.sin(phase / 4) * 0.18
      g.fillStyle = '#c9f2ff'
      g.strokeStyle = OUTLINE
      g.lineWidth = 1.4
      g.beginPath()
      g.ellipse(0, -1, 4.6 / squeeze, 4 * squeeze, 0, Math.PI, 0)
      g.closePath()
      g.fill()
      g.stroke()
      g.strokeStyle = '#e8fbff'
      g.lineWidth = 1
      for (const dx of [-2, 2]) {
        g.beginPath()
        g.moveTo(dx, 0)
        g.quadraticCurveTo(dx + Math.sin(phase / 3 + dx) * 2, 3, dx, 6)
        g.stroke()
      }
      break
    }
    case 'volt': {
      // A crackling electric bead: a cyan core and a jagged arc that flickers round it.
      g.fillStyle = '#a6fff0'
      g.strokeStyle = OUTLINE
      g.lineWidth = 1.5
      g.beginPath()
      g.arc(0, 0, 3.6, 0, Math.PI * 2)
      g.fill()
      g.stroke()
      g.strokeStyle = '#ffffff'
      g.lineWidth = 1.2
      g.beginPath()
      const turn = Math.floor(phase / 3)
      for (let k = 0; k <= 6; k++) {
        const a = turn * 1.3 + (k / 6) * Math.PI * 1.4
        const r = k % 2 ? 5.8 : 4.4
        if (k) g.lineTo(Math.cos(a) * r, Math.sin(a) * r)
        else g.moveTo(Math.cos(a) * r, Math.sin(a) * r)
      }
      g.stroke()
      break
    }
    case 'coral': {
      // A tumbling coral polyp: three branches round a warm core.
      g.rotate(phase / 9)
      g.strokeStyle = OUTLINE
      g.lineWidth = 3.4
      branches(g)
      g.strokeStyle = '#ff9f8a'
      g.lineWidth = 1.8
      branches(g)
      g.fillStyle = '#fff2a8'
      g.beginPath()
      g.arc(0, 0, 1.8, 0, Math.PI * 2)
      g.fill()
      break
    }
    case 'bubble': {
      // A wobbling bubble with a moving highlight.
      const wobble = Math.sin(phase / 5) * 0.6
      g.fillStyle = '#9ee7ff55'
      g.strokeStyle = '#d8f6ff'
      g.lineWidth = 1.6
      g.beginPath()
      g.ellipse(0, 0, 4.6 + wobble, 4.6 - wobble, 0, 0, Math.PI * 2)
      g.fill()
      g.stroke()
      g.strokeStyle = OUTLINE
      g.lineWidth = 0.8
      g.stroke()
      g.fillStyle = '#ffffff'
      g.beginPath()
      g.arc(-1.6, -1.6 + wobble, 1.2, 0, Math.PI * 2)
      g.fill()
      break
    }
    case 'ember': {
      // A flickering lure ember: a warm teardrop pointing the way it flies.
      g.rotate(heading)
      const flick = 1 + Math.sin(phase / 2) * 0.15
      g.fillStyle = '#ffb36b'
      g.strokeStyle = OUTLINE
      g.lineWidth = 1.4
      g.beginPath()
      g.moveTo(5 * flick, 0)
      g.quadraticCurveTo(0, -4.4, -4, 0)
      g.quadraticCurveTo(0, 4.4, 5 * flick, 0)
      g.fill()
      g.stroke()
      g.fillStyle = '#fff2a8'
      g.beginPath()
      g.arc(1, 0, 1.6, 0, Math.PI * 2)
      g.fill()
      break
    }
    case 'sonar': {
      // A dolphin's sonar ping: a bright crescent that breathes, leading two faint echoes.
      g.rotate(heading)
      const breathe = Math.sin(phase / 4) * 0.8
      for (const [dx, alpha] of [
        [-4, 0.25],
        [-2, 0.5],
      ] as const) {
        g.globalAlpha = alpha
        g.strokeStyle = '#9ee7ff'
        g.lineWidth = 1.2
        g.beginPath()
        g.arc(dx, 0, 4.5, -1.1, 1.1)
        g.stroke()
      }
      g.globalAlpha = 1
      g.strokeStyle = OUTLINE
      g.lineWidth = 4
      g.beginPath()
      g.arc(0, 0, 4.5 + breathe, -1.1, 1.1)
      g.stroke()
      g.strokeStyle = '#e8fbff'
      g.lineWidth = 2.2
      g.stroke()
      break
    }
    case 'dart': {
      // A slim interceptor dart with a blinking tip.
      g.rotate(heading)
      g.fillStyle = '#ffd38a'
      g.strokeStyle = OUTLINE
      g.lineWidth = 1.3
      g.beginPath()
      g.moveTo(6, 0)
      g.lineTo(-4, -2.6)
      g.lineTo(-2, 0)
      g.lineTo(-4, 2.6)
      g.closePath()
      g.fill()
      g.stroke()
      if (Math.floor(phase / 4) % 2 === 0) {
        g.fillStyle = '#ffffff'
        g.beginPath()
        g.arc(4, 0, 1.2, 0, Math.PI * 2)
        g.fill()
      }
      break
    }
    case 'fin': {
      // A shark-tooth fin blade spinning edge over edge.
      g.rotate(phase / 3)
      g.fillStyle = '#e8ddff'
      g.strokeStyle = OUTLINE
      g.lineWidth = 1.4
      g.beginPath()
      g.moveTo(0, -5.5)
      g.quadraticCurveTo(2, 0, 5, 4)
      g.lineTo(-5, 4)
      g.quadraticCurveTo(-1, 0, 0, -5.5)
      g.fill()
      g.stroke()
      break
    }
    case 'torpedo': {
      // A fin-pod missile with a flickering exhaust.
      g.rotate(heading)
      g.fillStyle = Math.floor(phase / 2) % 2 ? '#ff9f6a' : '#fff2a8'
      g.beginPath()
      g.moveTo(-3, 0)
      g.lineTo(-7 - (Math.floor(phase / 2) % 2) * 2, -1.6)
      g.lineTo(-7 - (Math.floor(phase / 2) % 2) * 2, 1.6)
      g.closePath()
      g.fill()
      g.fillStyle = '#ffc1e6'
      g.strokeStyle = OUTLINE
      g.lineWidth = 1.3
      g.beginPath()
      g.ellipse(0.5, 0, 4.5, 2.4, 0, 0, Math.PI * 2)
      g.fill()
      g.stroke()
      break
    }
    case 'ink': {
      // An ink blob that wobbles as it flies.
      g.fillStyle = '#7b4bd6'
      g.strokeStyle = '#e8ddff'
      g.lineWidth = 1.4
      g.beginPath()
      for (let k = 0; k <= 10; k++) {
        const a = (k / 10) * Math.PI * 2
        const r = 4.4 + Math.sin(a * 3 + phase / 4) * 0.9
        if (k) g.lineTo(Math.cos(a) * r, Math.sin(a) * r)
        else g.moveTo(Math.cos(a) * r, Math.sin(a) * r)
      }
      g.closePath()
      g.fill()
      g.stroke()
      g.fillStyle = '#ffffff'
      g.beginPath()
      g.arc(-1.4, -1.4, 1, 0, Math.PI * 2)
      g.fill()
      break
    }
    case 'petal': {
      // A reef-turret petal, turning as it drifts.
      g.rotate(heading + Math.sin(phase / 6) * 0.6)
      g.fillStyle = '#ffb8f0'
      g.strokeStyle = OUTLINE
      g.lineWidth = 1.3
      g.beginPath()
      g.ellipse(0, 0, 5.4, 2.8, 0, 0, Math.PI * 2)
      g.fill()
      g.stroke()
      g.strokeStyle = '#ffffff'
      g.lineWidth = 0.8
      g.beginPath()
      g.moveTo(-3.6, 0)
      g.lineTo(3.6, 0)
      g.stroke()
      break
    }
    case 'shell': {
      // A nautilus shell rolling along the barrier.
      g.rotate(phase / 7)
      g.fillStyle = '#fff2a8'
      g.strokeStyle = OUTLINE
      g.lineWidth = 1.4
      g.beginPath()
      g.arc(0, 0, 4.6, 0, Math.PI * 2)
      g.fill()
      g.stroke()
      g.strokeStyle = '#c97a4a'
      g.lineWidth = 1
      g.beginPath()
      for (let k = 0; k <= 16; k++) {
        const a = (k / 16) * Math.PI * 3
        const r = 0.6 + (k / 16) * 3.4
        if (k) g.lineTo(Math.cos(a) * r, Math.sin(a) * r)
        else g.moveTo(Math.cos(a) * r, Math.sin(a) * r)
      }
      g.stroke()
      break
    }
    case 'shard': {
      // A spinning prism shard whose facets cycle through the rainbow.
      g.rotate(phase / 6)
      const lit = RAINBOW[Math.floor(phase / 6 + seed) % RAINBOW.length]!
      g.fillStyle = lit
      g.strokeStyle = OUTLINE
      g.lineWidth = 1.4
      g.beginPath()
      g.moveTo(0, -5.5)
      g.lineTo(3.6, 0)
      g.lineTo(0, 5.5)
      g.lineTo(-3.6, 0)
      g.closePath()
      g.fill()
      g.stroke()
      g.strokeStyle = '#ffffff'
      g.lineWidth = 0.8
      g.beginPath()
      g.moveTo(0, -5.5)
      g.lineTo(0, 5.5)
      g.stroke()
      break
    }
    case 'bolt': {
      // A kinetic claw bolt: a long white-hot streak with a shimmering wake.
      g.rotate(heading)
      g.globalAlpha = 0.45 + 0.25 * Math.sin(phase / 2)
      g.fillStyle = '#ff9f6a'
      g.fillRect(-14, -1.5, 12, 3)
      g.globalAlpha = 1
      g.fillStyle = '#fff5cf'
      g.strokeStyle = OUTLINE
      g.lineWidth = 1.3
      g.beginPath()
      g.moveTo(6, 0)
      g.lineTo(-3, -3)
      g.lineTo(-5, 0)
      g.lineTo(-3, 3)
      g.closePath()
      g.fill()
      g.stroke()
      break
    }
    case 'star': {
      // A guardian's rainbow star: five points, turning, its colour walking the spectrum.
      g.rotate(phase / 8)
      starPath(g, 5, 5.6, 2.6)
      g.fillStyle = RAINBOW[Math.floor(phase / 5 + seed) % RAINBOW.length]!
      g.fill()
      g.strokeStyle = OUTLINE
      g.lineWidth = 1.4
      g.stroke()
      break
    }
    case 'eclipse': {
      // An eclipse spark: a dark disc with a burning corona that rotates.
      g.rotate(phase / 5)
      g.strokeStyle = '#ffd38a'
      g.lineWidth = 1.4
      for (let k = 0; k < 6; k++) {
        const a = (k / 6) * Math.PI * 2
        g.beginPath()
        g.moveTo(Math.cos(a) * 4, Math.sin(a) * 4)
        g.lineTo(Math.cos(a) * 6.4, Math.sin(a) * 6.4)
        g.stroke()
      }
      g.fillStyle = '#2a0f30'
      g.strokeStyle = '#fff2a8'
      g.lineWidth = 1.8
      g.beginPath()
      g.arc(0, 0, 4, 0, Math.PI * 2)
      g.fill()
      g.stroke()
      break
    }
  }
  g.restore()
}

function starPath(
  g: CanvasRenderingContext2D,
  points: number,
  outer: number,
  inner: number,
) {
  g.beginPath()
  for (let k = 0; k < points * 2; k++) {
    const a = (k / (points * 2)) * Math.PI * 2 - Math.PI / 2
    const r = k % 2 ? inner : outer
    if (k) g.lineTo(Math.cos(a) * r, Math.sin(a) * r)
    else g.moveTo(Math.cos(a) * r, Math.sin(a) * r)
  }
  g.closePath()
}

function branches(g: CanvasRenderingContext2D) {
  g.beginPath()
  for (let k = 0; k < 3; k++) {
    const a = (k / 3) * Math.PI * 2
    g.moveTo(0, 0)
    g.lineTo(Math.cos(a) * 5, Math.sin(a) * 5)
    g.moveTo(Math.cos(a) * 3, Math.sin(a) * 3)
    g.lineTo(Math.cos(a + 0.7) * 5, Math.sin(a + 0.7) * 5)
  }
  g.stroke()
}
