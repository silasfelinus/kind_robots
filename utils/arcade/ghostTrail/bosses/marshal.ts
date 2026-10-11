// /utils/arcade/ghostTrail/bosses/marshal.ts
//
// Zuzu: Ghost Trail's first headline boss (conductor kr-arcade t-016, CAMPAIGN-BLUEPRINT.md): the
// Grave Marshal, a skeletal lawman in a long duster and a tarnished star, who holds the end of Ghost
// Town from behind a barricade of coffins and a whiskey barrel.
//
// He fights from cover and down two telegraphed lanes:
//   - cover: crouched behind the barricade, shots ring off the coffin (immune, never for long);
//   - aim -> volley: he steps out, levels his long iron, and a glint and a red sight line show the
//     lane for a long beat: LOW (at Zuzu's chest: jump it) or HIGH (at jump height: stay down);
//     then three or four fast shots down that lane, and a slow reload in the open (punish it);
//   - light -> throw: he rises over the barricade and strikes a match on his badge; the lit
//     dynamite arcs at where Zuzu stood and bursts into a short ground flame (step clear);
//   - whistle -> deputies (once, from 60% health): a bony whistle calls two gunslingers in from
//     the arena's edges.
// If Zuzu comes round the barricade he vaults it to keep it between them (exposed mid-vault).
//
// Deterministic: all chance from ctx.rng. The painted art below reads the same state: every mode
// has its own pose, the lane shows on the gun and the sight line, `flash` whitens him and `dying`
// crumbles him to a heap of bones and a falling hat.

import type { Boss, BossCtx, BossDef } from '../bosses'
import { INK, glow, mix, rgba } from '../../snes'

type G = CanvasRenderingContext2D

/** The tell that opens each attack mode (the boss test walks these). */
export const MARSHAL_TELLS: Record<string, string> = {
  volley: 'aim',
  throw: 'light',
  deputies: 'whistle',
}

// Scratch slots in b.n.
const COVER = 0 // the barricade's centre x
const LANE = 1 // 0 low (jump it), 1 high (stay down)
const SHOTS = 2 // shots left in the volley
const CALLED = 3 // 1 once the deputies are called
const SIDE = 4 // which side of the barricade he hides: +1 right of it, -1 left
const FUSE = 5 // ticks until the dynamite lands
const BLAST_X = 6 // where it lands
const BLAST = 7 // ground-flame ticks left (art)
const COUNT = 8 // attacks begun (the pattern)
const LAST = 9 // last lane
const STREAK = 10 // how many times running that lane came up
const FROM = 11 // vault start x
const THROW_X = 12 // dynamite launch x, vx, vy (art traces the arc)
const THROW_VX = 13
const THROW_VY = 14
const STEP_X = 15 // where he steps out to fire from

const AIM_TICKS = 46
const LIGHT_TICKS = 40
const WHISTLE_TICKS = 44
const VOLLEY_GAP = 8
const RELOAD_TICKS = 62
const RECOVER_TICKS = 34
const VAULT_TICKS = 26
const FLIGHT = 46
const DYN_GRAV = 0.2
const BLAST_TICKS = 48
const STEP = 1.6
/** Lane heights above the ground: chest (jump it) and jump height (stay down). */
const LOW_LANE = 12
const HIGH_LANE = 38

const n = (b: Boss, i: number) => b.n[i] ?? 0

/** The art's scale over its drawn units, and the gun arm's geometry at that scale. */
const SCALE = 1.15
const SHOULDER_X = 2 * SCALE
const SHOULDER_Y = -29.8 * SCALE
const ARM = 29 * SCALE

/** The gun arm's angle for a lane and the muzzle's distance ahead of him. */
function laneAim(lane: number): { angle: number; mx: number } {
  const dy = -(lane ? HIGH_LANE : LOW_LANE) - SHOULDER_Y
  const angle = Math.asin(Math.max(-1, Math.min(1, dy / ARM)))
  return { angle, mx: SHOULDER_X + Math.cos(angle) * ARM }
}

function coverX(b: Boss) {
  return n(b, COVER) + n(b, SIDE) * 5
}
function fireX(b: Boss) {
  return n(b, COVER) - n(b, SIDE) * 22
}

function takeCover(b: Boss, ctx: BossCtx, ticks?: number) {
  b.mode = 'cover'
  b.timer = ticks ?? 52 + Math.floor(ctx.rng() * 26)
}

function decide(b: Boss, ctx: BossCtx) {
  b.n[COUNT] = n(b, COUNT) + 1
  b.face = Math.sign(ctx.px - b.x) || -1
  if (!n(b, CALLED) && b.hp <= b.maxHp * 0.6) {
    b.mode = 'whistle'
    b.timer = WHISTLE_TICKS
    ctx.sound('warn')
  } else if (n(b, COUNT) % 3 === 0 || Math.abs(ctx.px - b.x) < 30) {
    // Every third, or Zuzu right on him: dynamite over the top.
    b.mode = 'light'
    b.timer = LIGHT_TICKS
    ctx.sound('warn')
  } else {
    // Step out past the barricade's end to fire, but never into Zuzu's face.
    const side = n(b, SIDE)
    const stop = ctx.px + side * 30
    const to = side > 0 ? Math.max(fireX(b), stop) : Math.min(fireX(b), stop)
    b.n[STEP_X] = side > 0 ? Math.min(to, coverX(b)) : Math.max(to, coverX(b))
    b.mode = 'step'
  }
}

function startAim(b: Boss, ctx: BossCtx) {
  let lane = ctx.rng() < 0.5 ? 0 : 1
  // Never the same lane three times running: the read must stay a read.
  if (n(b, STREAK) >= 2 && lane === n(b, LAST)) lane = 1 - lane
  b.n[STREAK] = lane === n(b, LAST) ? n(b, STREAK) + 1 : 1
  b.n[LAST] = lane
  b.n[LANE] = lane
  b.mode = 'aim'
  b.timer = AIM_TICKS
  b.face = Math.sign(ctx.px - b.x) || -1
  ctx.sound('warn')
}

function update(b: Boss, ctx: BossCtx) {
  const ground = ctx.groundY
  const bx = n(b, COVER)
  const zSide = Math.sign(ctx.px - bx) || -1
  if (n(b, BLAST) > 0) b.n[BLAST] = n(b, BLAST) - 1
  const towardZuzu = Math.sign(ctx.px - b.x) || -1
  const walkTo = (x: number) => {
    const d = x - b.x
    const s = STEP * ctx.speed
    b.x = Math.abs(d) <= s ? x : b.x + Math.sign(d) * s
    return Math.abs(d) <= s
  }

  switch (b.mode) {
    case 'cover': {
      b.face = towardZuzu
      walkTo(coverX(b))
      if (zSide === n(b, SIDE)) {
        // Zuzu came round: vault the barricade to keep it between them.
        b.n[FROM] = b.x
        b.n[SIDE] = -zSide
        b.mode = 'vault'
        b.timer = VAULT_TICKS
        break
      }
      if (--b.timer <= 0) decide(b, ctx)
      break
    }
    case 'vault': {
      const p = 1 - b.timer / VAULT_TICKS
      b.x = n(b, FROM) + (coverX(b) - n(b, FROM)) * p
      b.face = -n(b, SIDE)
      if (--b.timer <= 0) {
        b.x = coverX(b)
        takeCover(b, ctx, 36)
      }
      break
    }
    case 'step':
      b.face = towardZuzu
      if (walkTo(n(b, STEP_X))) startAim(b, ctx)
      break
    case 'aim':
      if (--b.timer <= 0) {
        b.mode = 'volley'
        b.n[SHOTS] = b.hp <= b.maxHp / 2 ? 4 : 3
        b.timer = 1
      }
      break
    case 'volley':
      if (--b.timer <= 0) {
        if (n(b, SHOTS) > 0) {
          b.n[SHOTS] = n(b, SHOTS) - 1
          ctx.bolt({
            kind: 'bullet',
            x: b.x + b.face * laneAim(n(b, LANE)).mx,
            y: ground - (n(b, LANE) ? HIGH_LANE : LOW_LANE),
            vx: b.face * 3.3 * ctx.speed,
            vy: 0,
            grav: 0,
            life: 140,
            arm: 0,
            hw: 4,
            hh: 2,
          })
          ctx.sound('shoot')
          b.timer = VOLLEY_GAP
        } else {
          b.mode = 'reload'
          b.timer = b.hp <= b.maxHp / 2 ? RELOAD_TICKS - 14 : RELOAD_TICKS
        }
      }
      break
    case 'reload':
      if (--b.timer <= 0) b.mode = 'back'
      break
    case 'back':
      b.face = towardZuzu
      if (walkTo(coverX(b))) takeCover(b, ctx)
      break
    case 'light':
      b.face = towardZuzu
      if (--b.timer <= 0) {
        const target = Math.max(
          ctx.arenaL + 12,
          Math.min(ctx.arenaR - 12, ctx.px),
        )
        const x0 = b.x + b.face * 4
        const y0 = ground - 40
        const vx = (target - x0) / FLIGHT
        const vy =
          (ground - y0 - (DYN_GRAV * FLIGHT * (FLIGHT + 1)) / 2) / FLIGHT
        ctx.bolt({
          kind: 'ember',
          x: x0,
          y: y0,
          vx,
          vy,
          grav: DYN_GRAV,
          life: FLIGHT + 20,
          arm: 0,
          hw: 3,
          hh: 3,
        })
        ctx.sound('shoot')
        b.n[FUSE] = FLIGHT
        b.n[BLAST_X] = target
        b.n[THROW_X] = x0
        b.n[THROW_VX] = vx
        b.n[THROW_VY] = vy
        b.mode = 'throw'
      }
      break
    case 'throw':
      b.n[FUSE] = n(b, FUSE) - 1
      if (n(b, FUSE) <= 0) {
        ctx.bolt({
          kind: 'pillar',
          x: n(b, BLAST_X),
          y: ground - 7,
          vx: 0,
          vy: 0,
          grav: 0,
          life: BLAST_TICKS,
          arm: 0,
          hw: 6,
          hh: 7,
        })
        ctx.sound('boom')
        b.n[BLAST] = BLAST_TICKS
        b.mode = 'recover'
        b.timer = RECOVER_TICKS
      }
      break
    case 'recover':
      if (--b.timer <= 0) takeCover(b, ctx)
      break
    case 'whistle':
      if (--b.timer <= 0) {
        b.n[CALLED] = 1
        ctx.summon('gunslinger', ctx.arenaL + 14, ground)
        ctx.summon('gunslinger', ctx.arenaR - 14, ground)
        ctx.sound('shoot')
        b.mode = 'deputies'
        b.timer = 30
      }
      break
    case 'deputies':
      if (--b.timer <= 0) takeCover(b, ctx)
      break
    default:
      takeCover(b, ctx)
  }
}

// --- art --------------------------------------------------------------------------------------

const TAU = Math.PI * 2
const BONE = ['#3b2a26', '#7d6650', '#c4ad88', '#e9dcbc', '#fffaea'] as const
const COAT = ['#120c14', '#251a22', '#3d2c30', '#5c4440', '#836253'] as const
const TROUSER = ['#141018', '#231c2a', '#383042'] as const
const LEATHER = ['#1e0f0a', '#3e2214', '#62381e', '#8a5530'] as const
const VEST = ['#2a0a10', '#5a1420', '#86222c', '#b0403c'] as const
const HAT = ['#0e0a14', '#1d1626', '#30263c', '#4e405c'] as const
const GOLD = ['#5a2a0c', '#a65f12', '#f2b52b', '#fde68a', '#fffbe6'] as const
const STEEL = ['#1c2338', '#3b4763', '#8693ad', '#c9d3e6', '#ffffff'] as const
const WOOD = ['#22140e', '#3e2618', '#5e3a22', '#84583a', '#a87c58'] as const
const SPECTRE = ['#06283a', '#0f5866', '#1fa3a8', '#6ff0e0', '#dcfffa'] as const
const CRIMSON = ['#4a0a14', '#9b1424', '#e0263a', '#ff6a5c', '#ffd2c4'] as const
const DYN = ['#5a0e10', '#a3202a', '#d8443c'] as const

/** While > 0 the whole body paints pale (a hit flash); outlines stay ink. */
let whiteOut = 0
const c = (hex: string) => (whiteOut > 0 ? mix(hex, '#ffffff', 0.72) : hex)

function poly(g: G, pts: readonly number[], close = true) {
  g.beginPath()
  g.moveTo(pts[0] ?? 0, pts[1] ?? 0)
  for (let i = 2; i < pts.length; i += 2) g.lineTo(pts[i] ?? 0, pts[i + 1] ?? 0)
  if (close) g.closePath()
}

function inked(g: G, fill: string, lw = 1) {
  g.lineJoin = 'round'
  g.lineCap = 'round'
  g.lineWidth = lw
  g.strokeStyle = INK
  g.stroke()
  g.fillStyle = c(fill)
  g.fill()
}

/** A round-capped limb with an ink edge. */
function limb(g: G, pts: readonly number[], w: number, fill: string) {
  poly(g, pts, false)
  g.lineJoin = 'round'
  g.lineCap = 'round'
  g.lineWidth = w + 1.4
  g.strokeStyle = INK
  g.stroke()
  g.lineWidth = w
  g.strokeStyle = c(fill)
  g.stroke()
}

function ellipse(g: G, x: number, y: number, rx: number, ry: number, r = 0) {
  g.beginPath()
  g.ellipse(x, y, Math.max(0.1, rx), Math.max(0.1, ry), r, 0, TAU)
}

function hash(i: number) {
  const s = Math.sin(i * 127.1 + 311.7) * 43758.5453
  return s - Math.floor(s)
}

/** A four-point glint star. */
function glint(g: G, x: number, y: number, r: number, colour: string) {
  g.save()
  g.globalCompositeOperation = 'lighter'
  g.fillStyle = colour
  poly(g, [
    x - r,
    y,
    x - r * 0.12,
    y - r * 0.12,
    x,
    y - r,
    x + r * 0.12,
    y - r * 0.12,
    x + r,
    y,
    x + r * 0.12,
    y + r * 0.12,
    x,
    y + r,
    x - r * 0.12,
    y + r * 0.12,
  ])
  g.fill()
  g.restore()
}

/** The barricade: a coffin propped on end behind a banded whiskey barrel. */
function drawBarricade(
  g: G,
  x: number,
  ground: number,
  tick: number,
  side: number,
) {
  // The barricade never flashes with him.
  const white = whiteOut
  whiteOut = 0
  g.save()
  g.translate(Math.round(x), ground)
  // The barrel always stands on Zuzu's side, the coffin behind it.
  g.scale(side || 1, 1)
  // Shadow.
  g.fillStyle = rgba(INK, 0.4)
  ellipse(g, 0, 0, 18, 2.4)
  g.fill()
  // The coffin, leaning a little.
  g.save()
  g.rotate(-0.08)
  poly(g, [-7, 0, -9, -18, -6, -30, 6, -30, 9, -18, 7, 0])
  inked(g, WOOD[2], 1.1)
  g.fillStyle = c(WOOD[3])
  poly(g, [-6, -1, -8, -18, -5.4, -29, -1, -29, -1, -1])
  g.fill()
  g.strokeStyle = c(WOOD[1])
  g.lineWidth = 0.5
  for (const yy of [-6, -12, -19, -25]) {
    g.beginPath()
    g.moveTo(-8, yy)
    g.lineTo(8, yy)
    g.stroke()
  }
  // Lid cross and bullet pocks.
  g.fillStyle = c(WOOD[4])
  g.fillRect(-0.6, -26, 1.2, 9)
  g.fillRect(-3.2, -23, 6.4, 1.2)
  g.fillStyle = INK
  for (let i = 0; i < 5; i++) {
    g.beginPath()
    g.arc(-5 + hash(i) * 10, -4 - hash(i + 7) * 22, 0.6, 0, TAU)
    g.fill()
  }
  // A wanted poster tacked on.
  poly(g, [2, -15, 7.4, -15.6, 7.6, -8.4, 2.2, -8])
  inked(g, '#e8dcb8', 0.6)
  g.fillStyle = c('#7a5a3a')
  g.fillRect(3.4, -14, 2.8, 2.6)
  g.fillRect(3, -10.6, 3.8, 0.6)
  g.restore()
  // The whiskey barrel in front.
  poly(g, [-14, 0, -15.5, -8, -14, -16, -2, -16, -0.5, -8, -2, 0])
  inked(g, WOOD[2], 1.1)
  g.fillStyle = c(WOOD[3])
  poly(g, [-13.4, -1, -14.6, -8, -13.4, -15, -9, -15, -9, -1])
  g.fill()
  g.fillStyle = c(WOOD[1])
  for (const xx of [-11, -7, -4]) g.fillRect(xx, -15, 0.5, 14)
  for (const yy of [-13.5, -3.5]) {
    g.fillStyle = c(STEEL[1])
    g.fillRect(-15, yy, 14, 1.6)
    g.fillStyle = c(STEEL[2])
    g.fillRect(-15, yy, 14, 0.6)
  }
  g.fillStyle = c(WOOD[4])
  ellipse(g, -8, -16, 6, 1.2)
  g.fill()
  // A guttering candle on the barrel: the Ghost Town's haunt-light.
  g.fillStyle = c('#e9dcbc')
  g.fillRect(-9, -20, 2, 4)
  const fl = Math.sin(tick / 5) * 0.4
  g.fillStyle = '#6ff0e0'
  poly(g, [-8.8 + fl, -23.5, -7.2, -20, -8.8, -20])
  g.fill()
  g.restore()
  glow(g, x - 8 * (side || 1), ground - 22, 9, SPECTRE[3], 0.35)
  whiteOut = white
}

type Pose = {
  crouch: number
  walk: number
  /** Gun arm angle (0 = level forward, + down), or null when holstered. */
  gun: number | null
  /** Off hand: 'hip', 'up' (holding dynamite high), 'throw', 'mouth', 'point', 'reload'. */
  off: 'hip' | 'up' | 'throw' | 'mouth' | 'point' | 'reload'
  lean: number
  /** Head tilt (radians, + looks down). */
  look: number
}

function poseOf(b: Boss): Pose {
  const p: Pose = { crouch: 0, walk: 0, gun: 0.9, off: 'hip', lean: 0, look: 0 }
  switch (b.mode) {
    case 'cover':
      p.crouch = 1
      p.gun = -1.35
      p.look = Math.sin(b.t / 23) * 0.12
      break
    case 'vault':
      p.crouch = 0.55
      p.gun = -0.6
      p.lean = 0.25
      break
    case 'step':
    case 'back':
      p.walk = b.t
      p.gun = 0.9
      break
    case 'aim':
    case 'volley': {
      const lane = n(b, LANE)
      p.gun = laneAim(lane).angle
      if (b.mode === 'volley' && b.timer > VOLLEY_GAP - 3) p.gun -= 0.12
      p.lean = -0.05
      p.off = 'hip'
      break
    }
    case 'reload':
      p.gun = -0.9
      p.off = 'reload'
      p.look = 0.35
      break
    case 'light':
      p.gun = null
      p.off = 'up'
      break
    case 'throw':
    case 'recover':
      p.gun = null
      p.off = b.mode === 'throw' && n(b, FUSE) > FLIGHT - 10 ? 'throw' : 'hip'
      break
    case 'whistle':
      p.gun = null
      p.off = 'mouth'
      p.look = -0.2
      break
    case 'deputies':
      p.gun = null
      p.off = 'point'
      break
  }
  return p
}

/** The revolver along +x from the grip at (0, 0). */
function paintRevolver(g: G) {
  // Grip.
  poly(g, [-1.6, -0.6, 1.4, -1, 0.6, 4.2, -1.8, 3.8])
  inked(g, '#e8dcb8', 0.8)
  // Frame, cylinder and long barrel.
  poly(g, [0, -2.4, 4.4, -2.4, 4.4, 1, 0.4, 1])
  inked(g, STEEL[1], 0.8)
  g.fillStyle = c(STEEL[2])
  g.fillRect(1, -2.2, 3, 1.2)
  poly(g, [4.2, -2.2, 15, -2.2, 15, -0.6, 4.2, -0.6])
  inked(g, STEEL[2], 0.8)
  g.fillStyle = c(STEEL[4])
  g.fillRect(4.4, -2.1, 10, 0.5)
  // Hammer and trigger guard.
  g.fillStyle = c(STEEL[1])
  g.fillRect(-0.6, -3.6, 1.2, 1.4)
  g.strokeStyle = INK
  g.lineWidth = 0.5
  g.beginPath()
  g.arc(1.8, 1.4, 1.2, 0, Math.PI)
  g.stroke()
}

/** A bundle of three dynamite sticks, fuse up, centred at (0, 0). */
function paintDynamite(g: G, tick: number) {
  for (let i = -1; i <= 1; i++) {
    poly(g, [
      i * 1.8 - 0.9,
      -3,
      i * 1.8 + 0.9,
      -3,
      i * 1.8 + 0.9,
      3,
      i * 1.8 - 0.9,
      3,
    ])
    inked(g, DYN[1], 0.6)
    g.fillStyle = c(DYN[2])
    g.fillRect(i * 1.8 - 0.8, -2.8, 0.6, 5.6)
  }
  g.fillStyle = c('#c9a274')
  g.fillRect(-2.8, -0.6, 5.6, 1.2)
  g.strokeStyle = c('#c9a274')
  g.lineWidth = 0.5
  g.beginPath()
  g.moveTo(0, -3)
  g.quadraticCurveTo(1.5, -5, 0.8, -6.4)
  g.stroke()
  const s = 1.4 + Math.sin(tick / 2) * 0.6
  glow(g, 0.8, -6.6, 5, '#fb923c', 0.8)
  glint(g, 0.8, -6.6, s + 1.2, '#fef08a')
}

function paintMarshal(g: G, b: Boss, pose: Pose, tick: number) {
  const cr = pose.crouch
  const hipY = -16 + 8 * cr
  const shY = -31 + 14 * cr
  const headY = -37.5 + 14 * cr
  const sway = Math.sin(tick / 14) * 0.8
  const step = pose.walk ? Math.sin(pose.walk / 5) : 0

  g.save()
  g.rotate(pose.lean)

  // Coat's back panel, flaring behind, tattered at the hem.
  const hem = -2 + cr * 1
  const back = -13 - sway - cr * 2 - Math.abs(step) * 2
  poly(g, [
    -5,
    shY - 1,
    -7,
    hipY,
    back,
    hem - 1,
    back + 3,
    hem + 0.5,
    back + 5.5,
    hem - 1.5,
    back + 8,
    hem + 0.6,
    back + 11,
    hem - 1.2,
    2,
    hem - 1,
    4,
    hipY,
    5,
    shY,
  ])
  inked(g, COAT[1], 1.1)
  g.fillStyle = c(COAT[0])
  poly(g, [-5, shY + 2, -6.6, hipY + 2, back + 2, hem - 1.5, -1, hem - 2])
  g.fill()

  // Legs: bony shins in dark trousers and tall boots with spurs.
  const knee = (sgn: number) => {
    const s = sgn * step
    const kx = 2 + cr * 5 + s * 3
    const ky = hipY + (8 - cr * 5) * (1 - cr * 0.1)
    const fx = s * 4 + (cr ? 1 : 0)
    return [kx, ky, fx]
  }
  for (const sgn of [-1, 1]) {
    const [kx = 0, ky = 0, fx = 0] = knee(sgn)
    const tone = sgn < 0 ? TROUSER[0] : TROUSER[1]
    limb(g, [sgn * 1.2, hipY, kx, ky], 3.6, tone)
    limb(g, [kx, ky, fx, -3], 3.2, sgn < 0 ? LEATHER[1] : LEATHER[2])
    // Boot foot.
    poly(g, [
      fx - 2.2,
      -3.6,
      fx + 1.4,
      -3.6,
      fx + 4.6,
      -0.6,
      fx + 4.6,
      0.4,
      fx - 2.4,
      0.4,
    ])
    inked(g, sgn < 0 ? LEATHER[0] : LEATHER[1], 0.9)
    // Spur rowel.
    g.fillStyle = c(STEEL[3])
    g.beginPath()
    g.arc(fx - 3, -1.2, 1, 0, TAU)
    g.fill()
  }

  // Torso: open coat over a crimson vest, ribs showing at the open shirt.
  poly(g, [-5.2, shY, 5.4, shY, 4.6, hipY + 1, -4.6, hipY + 1])
  inked(g, VEST[1], 1.1)
  g.fillStyle = c(VEST[2])
  poly(g, [-1, shY + 1, 4.8, shY + 1, 4, hipY, 0.5, hipY])
  g.fill()
  // Rib gap at the collar.
  g.fillStyle = c(INK)
  poly(g, [-0.6, shY, 3.2, shY, 1.6, shY + 6])
  g.fill()
  g.strokeStyle = c(BONE[3])
  g.lineWidth = 0.6
  for (let i = 0; i < 3; i++) {
    g.beginPath()
    g.moveTo(0, shY + 1 + i * 1.6)
    g.lineTo(2.6 - i * 0.6, shY + 1.4 + i * 1.6)
    g.stroke()
  }
  // Coat lapel on the near side.
  poly(g, [
    3.2,
    shY - 0.5,
    6.4,
    shY,
    6.4,
    hipY + 3,
    4.2,
    hipY + 4,
    3.2,
    shY + 7,
  ])
  inked(g, COAT[3], 0.9)
  g.fillStyle = c(COAT[4])
  g.fillRect(5.2, shY + 1, 0.8, hipY - shY)
  // Gun belt, buckle and cartridge loops.
  g.fillStyle = INK
  g.fillRect(-5.4, hipY - 1.8, 11, 3.2)
  g.fillStyle = c(LEATHER[2])
  g.fillRect(-5, hipY - 1.4, 10.2, 2.4)
  g.fillStyle = c(GOLD[2])
  for (let i = 0; i < 4; i++) g.fillRect(-4.4 + i * 1.6, hipY - 1, 0.8, 1.4)
  g.fillStyle = c(GOLD[3])
  g.fillRect(1.4, hipY - 1.6, 2.2, 2.2)
  // Holster on the hip, empty while the iron is out.
  poly(g, [-3, hipY + 0.5, 0.4, hipY + 0.5, -0.4, hipY + 7, -2.6, hipY + 7])
  inked(g, LEATHER[1], 0.8)

  // The star: tarnished gold, a glint that flares with every tell.
  const sx = 3
  const sy = shY + 4.5
  g.beginPath()
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * TAU - Math.PI / 2
    const r = i % 2 ? 1.1 : 2.4
    g.lineTo(sx + Math.cos(a) * r, sy + Math.sin(a) * r)
  }
  g.closePath()
  inked(g, GOLD[2], 0.7)
  g.fillStyle = c(GOLD[4])
  g.fillRect(sx - 0.8, sy - 1.2, 0.8, 0.8)

  // Off arm (behind the gun arm when that is out, in front otherwise).
  const shoulder: [number, number] = [0.5, shY + 1.2]
  const offArm = () => {
    const [ax, ay] = shoulder
    switch (pose.off) {
      case 'up': {
        limb(g, [ax - 1, ay, ax - 4, ay - 6, ax - 2, ay - 13], 3, COAT[2])
        g.save()
        g.translate(ax - 2, ay - 15)
        paintDynamite(g, tick)
        g.restore()
        // The match struck on the badge: a flare at the chest.
        if (b.timer > LIGHT_TICKS - 12) {
          glow(g, sx + 1, sy, 6, '#fb923c', 0.7)
          glint(g, sx + 1, sy, 2.6, '#fef08a')
        }
        break
      }
      case 'throw':
        limb(g, [ax, ay, ax + 6, ay - 3, ax + 12, ay - 1], 3, COAT[2])
        hand(g, ax + 12.5, ay - 1)
        break
      case 'mouth':
        limb(g, [ax, ay, ax + 6, ay + 2, ax + 5, ay - 4], 3, COAT[2])
        hand(g, ax + 5, ay - 4.6)
        break
      case 'point':
        limb(g, [ax, ay, ax + 8, ay - 3, ax + 15, ay - 5], 3, COAT[2])
        hand(g, ax + 15.5, ay - 5.2)
        break
      case 'reload':
        limb(g, [ax, ay, ax + 3, ay + 6, ax + 7, ay + 3], 3, COAT[2])
        hand(g, ax + 7.4, ay + 2.6)
        break
      default:
        limb(g, [ax - 1, ay, ax - 3, ay + 7, ax - 1, hipY + 1], 3, COAT[2])
        hand(g, ax - 1, hipY + 1.6)
    }
  }
  if (pose.gun !== null) offArm()

  // Head: a grinning skull with spectral eyes under a broad black hat.
  g.save()
  g.translate(1.5, headY)
  g.rotate(pose.look)
  const tell =
    b.mode === 'aim' ||
    b.mode === 'light' ||
    b.mode === 'whistle' ||
    b.mode === 'volley'
  // Jaw and cranium.
  poly(g, [-3.2, 1, -2.6, 4.2, 2.4, 4.6, 4.4, 2.6, 4.2, 0.6])
  inked(g, BONE[2], 0.9)
  ellipse(g, 0.4, -0.6, 4.6, 4.3)
  inked(g, BONE[3], 0.9)
  g.fillStyle = c(BONE[4])
  ellipse(g, -0.6, -2, 2, 1.4)
  g.fill()
  // Sockets and the haunt-light in them.
  g.fillStyle = INK
  ellipse(g, 2.3, -0.3, 1.5, 1.4)
  g.fill()
  ellipse(g, -1.2, -0.3, 1.2, 1.3)
  g.fill()
  poly(g, [3.6, 1.6, 4.4, 2.6, 3.2, 2.6])
  g.fill()
  // Teeth.
  g.fillStyle = c(BONE[4])
  for (let i = 0; i < 4; i++) g.fillRect(-1.2 + i * 1.3, 3, 0.8, 1.2)
  g.fillStyle = INK
  g.fillRect(-1.5, 2.8, 5.6, 0.4)
  const eye = tell ? CRIMSON[3] : SPECTRE[3]
  g.fillStyle = eye
  g.fillRect(1.9, -0.8, 1, 1)
  g.fillRect(-1.5, -0.8, 0.8, 1)
  // Hat: crown and a wide, curled brim.
  poly(g, [-5.2, -3.4, -4.2, -9.6, -1, -10.6, 2.4, -9.8, 4.6, -10.4, 5.4, -3.4])
  inked(g, HAT[2], 1)
  g.fillStyle = c(HAT[3])
  poly(g, [-4.4, -4, -3.6, -9, -1, -9.8, -0.6, -4])
  g.fill()
  g.fillStyle = c(HAT[1])
  poly(g, [-0.2, -9.6, 1, -7.4, 2.2, -9.4])
  g.fill()
  // Band with a rattlesnake-bone hatband.
  g.fillStyle = c(LEATHER[1])
  g.fillRect(-4.8, -5.4, 10, 1.6)
  g.fillStyle = c(BONE[3])
  for (let i = 0; i < 5; i++) g.fillRect(-4.2 + i * 2, -5, 0.8, 0.8)
  poly(g, [-10.5, -2.4, -8, -4.2, 9, -4.2, 11.6, -2.8, 10.4, -1.6, -9.4, -1.4])
  inked(g, HAT[1], 1)
  g.fillStyle = c(HAT[3])
  g.fillRect(-8, -4, 17, 0.6)
  g.restore()
  if (tell && !whiteOut) {
    glow(g, 3.4, headY - 0.4, 5, CRIMSON[2], 0.5)
  } else if (!whiteOut) {
    glow(g, 3.4, headY - 0.4, 3.5, SPECTRE[3], 0.35)
  }

  // Gun arm, extended at its lane, or the off arm in front when the iron is holstered.
  if (pose.gun !== null) {
    const [ax, ay] = shoulder
    g.save()
    g.translate(ax + 1.5, ay)
    g.rotate(pose.gun)
    limb(g, [0, 0, 7, 0.6, 13, 0], 3.2, COAT[3])
    g.fillStyle = c(COAT[1])
    g.fillRect(11.4, -1.8, 1.4, 3.6)
    hand(g, 13.6, 0.2)
    g.translate(14, 0)
    paintRevolver(g)
    g.restore()
  } else {
    offArm()
  }
  g.restore()
}

/** A bony hand at (x, y). */
function hand(g: G, x: number, y: number) {
  ellipse(g, x, y, 1.7, 1.5)
  inked(g, BONE[3], 0.7)
  g.fillStyle = c(BONE[1])
  g.fillRect(x - 0.6, y + 0.4, 1.4, 0.4)
}

function draw(g: G, b: Boss, tick: number, face: number) {
  const ground = b.y
  const bx = n(b, COVER)
  const dying = b.dying > 0
  const fall = dying ? 1 - b.dying / 70 : 0
  whiteOut = b.flash > 0 || (dying && Math.floor(b.dying / 3) % 2 === 1) ? 1 : 0
  const f = b.mode === 'aim' || b.mode === 'volley' ? b.face : face
  const pose = poseOf(b)
  if (dying) {
    pose.crouch = Math.min(1, fall * 1.6)
    pose.gun = null
    pose.off = 'hip'
    pose.lean = -fall * 0.9
  }
  const hop =
    b.mode === 'vault' && !dying
      ? Math.sin(Math.PI * (1 - b.timer / VAULT_TICKS)) * 26
      : 0

  // The ground flame where the dynamite burst.
  const blast = n(b, BLAST)
  if (blast > 0) {
    const x = n(b, BLAST_X)
    const k = blast / BLAST_TICKS
    glow(g, x, ground - 6, 18 * k + 6, '#fb923c', 0.5)
    for (let i = 0; i < 7; i++) {
      const fx = x - 8 + (i / 6) * 16 + Math.sin(tick / 3 + i) * 0.8
      const h = (6 + hash(i + Math.floor(tick / 4)) * 9) * (0.5 + 0.5 * k)
      g.fillStyle = i % 2 ? '#f97316' : '#fde68a'
      poly(g, [fx - 2.2, ground, fx, ground - h, fx + 2.2, ground])
      g.fill()
    }
  }

  // The barricade between them: he paints behind it when he is on its far side.
  const behind = Math.abs(b.x - bx) < 24 && Math.sign(bx - b.x) === face && !hop
  if (!behind) drawBarricade(g, bx, ground, tick, n(b, SIDE))

  const x = Math.round(b.x + (dying ? Math.sin(b.dying * 1.7) * 0.6 : 0))
  // Shadow.
  g.fillStyle = rgba(INK, 0.35)
  ellipse(g, x, ground, 11, 2)
  g.fill()

  // The aim: a sight line down the lane, a glint growing at the muzzle.
  if (b.mode === 'aim' && !dying) {
    const k = 1 - b.timer / AIM_TICKS
    const laneY = ground - (n(b, LANE) ? HIGH_LANE : LOW_LANE)
    const mx = x + f * laneAim(n(b, LANE)).mx
    g.save()
    g.globalAlpha = 0.25 + 0.55 * k
    g.fillStyle = CRIMSON[2]
    for (let d = 6; d < 220; d += 6) {
      if (Math.floor((d - tick * 0.8) / 6) % 2 === 0) continue
      g.fillRect(mx + f * d - 1.5, laneY - 0.5, 3, 1)
    }
    // Lane brackets at Zuzu's side of the arena: chevrons that say jump or stay.
    g.fillStyle = CRIMSON[3]
    const cx = mx + f * 60
    if (n(b, LANE)) {
      poly(g, [cx - 4, laneY - 6, cx, laneY - 2, cx + 4, laneY - 6])
      g.fill()
    } else {
      poly(g, [cx - 4, laneY + 6, cx, laneY + 2, cx + 4, laneY + 6])
      g.fill()
    }
    g.restore()
    glow(g, mx, laneY, 4 + k * 8, CRIMSON[2], 0.4 + 0.4 * k)
    glint(g, mx, laneY, 2 + k * 5 + Math.sin(tick / 2) * k, CRIMSON[4])
  }

  g.save()
  g.translate(x, ground - hop)
  if (b.mode === 'vault' && !dying)
    g.rotate(Math.sin(Math.PI * (1 - b.timer / VAULT_TICKS)) * -0.4 * f)
  g.scale(f, 1)
  const fade = dying ? Math.min(1, b.dying / 24) : 1
  g.globalAlpha *= fade
  if (dying) {
    // He crumbles: bones spill from the coat as the haunt goes out of him.
    for (let i = 0; i < 6; i++) {
      const bxx = -8 + hash(i) * 16 + fall * (hash(i + 3) - 0.5) * 18
      const byy = -2 - hash(i + 5) * 3
      g.save()
      g.translate(bxx, byy)
      g.rotate(hash(i + 9) * 3)
      poly(g, [-2.6, -0.5, 2.6, -0.5, 2.6, 0.5, -2.6, 0.5])
      inked(g, BONE[3], 0.6)
      g.restore()
    }
  }
  g.scale(SCALE, SCALE)
  paintMarshal(g, b, pose, tick)
  g.restore()
  if (dying) {
    // The hat tumbles off and away.
    g.save()
    g.translate(
      x - f * fall * 22,
      ground - 40 - Math.sin(fall * Math.PI) * 16 + fall * 34,
    )
    g.rotate(fall * 4 * -f)
    g.globalAlpha *= fade
    poly(g, [-10, 1, -7, -1, 8, -1, 10, 0.6, 8, 1.6, -8, 1.8])
    inked(g, HAT[1], 1)
    poly(g, [-4.6, -0.6, -3.8, -6.6, 4, -7, 4.6, -0.6])
    inked(g, HAT[2], 1)
    g.restore()
  }

  // Muzzle flash on each shot.
  if (b.mode === 'volley' && b.timer > VOLLEY_GAP - 3 && !dying) {
    const laneY = ground - (n(b, LANE) ? HIGH_LANE : LOW_LANE)
    const mx = x + f * laneAim(n(b, LANE)).mx
    glow(g, mx, laneY, 10, '#fde68a', 0.8)
    glint(g, mx, laneY, 6, '#fffbe6')
  }
  // Spent shells tumbling during the reload.
  if (b.mode === 'reload' && !dying) {
    for (let i = 0; i < 4; i++) {
      const age = RELOAD_TICKS - b.timer - i * 5
      if (age < 0 || age > 26) continue
      const sx = x + f * (4 + i) - f * age * 0.2
      const sy = ground - 26 + age * age * 0.04 + age * 0.3
      g.fillStyle = GOLD[3]
      g.fillRect(sx, Math.min(ground - 1, sy), 1.4, 0.8)
    }
  }
  // The whistle: haunted notes ringing out.
  if (b.mode === 'whistle' && !dying) {
    const k = 1 - b.timer / WHISTLE_TICKS
    for (let i = 0; i < 3; i++) {
      const r = ((k * 3 + i / 3) % 1) * 22
      g.strokeStyle = rgba(SPECTRE[3], 0.7 * (1 - r / 22))
      g.lineWidth = 1
      g.beginPath()
      g.arc(x + f * 8, ground - 37, r, -0.9, 0.9)
      if (f < 0) {
        g.beginPath()
        g.arc(x + f * 8, ground - 37, r, Math.PI - 0.9, Math.PI + 0.9)
      }
      g.stroke()
    }
  }
  // The dynamite in flight, traced from its throw.
  if (b.mode === 'throw' && !dying) {
    const k = FLIGHT - n(b, FUSE)
    const dx = n(b, THROW_X) + n(b, THROW_VX) * k
    const dy = ground - 40 + n(b, THROW_VY) * k + (DYN_GRAV * k * (k + 1)) / 2
    g.save()
    g.translate(dx, dy)
    g.rotate(k / 3)
    paintDynamite(g, tick)
    g.restore()
    // Its landing spot smoulders as it comes down.
    const bx2 = n(b, BLAST_X)
    g.fillStyle = rgba(CRIMSON[2], 0.2 + 0.25 * (k / FLIGHT))
    ellipse(g, bx2, ground, 9, 2)
    g.fill()
  }

  if (behind) drawBarricade(g, bx, ground, tick, n(b, SIDE))
  whiteOut = 0
}

export const MARSHAL: BossDef = {
  name: 'THE GRAVE MARSHAL',
  title: 'LAW OF THE DEAD',
  hp: 26,
  hw: 10,
  height: 44,
  create: (b, ctx) => {
    b.n = [ctx.arenaR - 84, 0, 0, 0, 1, 0, 0, 0, 0, -1, 0, 0, 0, 0, 0, 0]
    b.x = coverX(b)
    b.face = -1
    takeCover(b, ctx, 70)
  },
  update,
  immune: (b) => b.mode === 'cover',
  contact: (b) => (b.mode === 'cover' ? null : { hw: 8, height: 36 }),
  draw,
}
