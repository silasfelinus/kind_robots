// /utils/arcade/lanternSwarm/guardian.ts
//
// Lantern Swarm depth pass, slice 1 (conductor kr-arcade/t-093): the Rooftop Festival's Guardian,
// the Grand Lantern Moth. It is not a villain: the Glare has dazzled it, and every beam calms it a
// little until it floats home to the festival.
//
// - Phase 1: four paper wing panels, each its own target. The body shrugs beams off. A panel
//   flashes before it shakes loose a fan of dust.
// - Phase 2: the wings are down, so it sweeps a wide capture glow across the sky. A guide line
//   shows where the sweep starts; the glow needs a moment to take hold, so slip through it fast.
// - Phase 3: its body dives at the lantern inside a ring of escort lunas that circle it.
//
// The state is plain data stepped at 60 Hz on the game's rng (cosmetics never touch it).

import {
  INK,
  RAMPS,
  drawSprite,
  glow,
  mirrorSprite,
  pixelSprite,
  rgba,
} from '../snes'
import type { PixelSprite } from '../snes'
import { H, W, type Pt } from './zones'

export const GUARDIAN = {
  panelHp: 5,
  /** Body beams to calm it in phase 2 (the sweep) and phase 3 (the dives); more each lap. */
  sweepHp: 24,
  diveHp: 20,
  lapHp: 4,
  panelPoints: 500,
  ringPoints: 160,
  calmPoints: 5000,
  hoverY: 78,
  enterTicks: 90,
  volleyGap: 100,
  tellTicks: 36,
  sweepTell: 56,
  sweepTicks: 180,
  sweepHalf: 16,
  /** Ticks inside the sweeping glow before it takes hold of the lantern. */
  grip: 20,
  restTicks: 80,
  ringSize: 6,
  ringRadius: 24,
  hoverTicks: 100,
  homeSpeed: 0.7,
} as const

export type GuardianPanel = {
  dx: number
  dy: number
  hp: number
  flash: number
  upper: boolean
  left: boolean
}
export type GuardianAct =
  | 'enter'
  | 'idle'
  | 'tell'
  | 'sweep'
  | 'rest'
  | 'hover'
  | 'dive'
  | 'return'
  | 'home'

export type Guardian = {
  x: number
  y: number
  /** 1 wings, 2 sweep, 3 dive; 4 once calmed, floating home. */
  phase: 1 | 2 | 3 | 4
  act: GuardianAct
  /** Ticks in the current act. */
  t: number
  life: number
  hp: number
  panels: GuardianPanel[]
  tellPanel: number
  sweepX: number
  sweepDir: -1 | 1
  /** Ticks the lantern has spent in the sweeping glow. */
  held: number
  ring: number[]
  spin: number
  path: Pt[]
  step: number
  heading: number
  speed: number
  /** The lantern it caught, carried under its body until it is calmed. */
  holding: boolean
  flash: number
  lap: number
  /** Gone home: the stage can end. */
  done: boolean
}

export type GuardianWorld = {
  rng: () => number
  lanternX: number
  shipY: number
  /** The lantern is out and not blinking: it can be hit or caught. */
  open: boolean
  diveSpeed: number
  dust(x: number, y: number, vx: number): void
  /** The glow took hold of the lantern; true when it was carried off (not a twin knocked loose). */
  caught(x: number): boolean
  /** The Guardian or a ring escort flew into the lantern. */
  crash(x: number): void
  sound(name: 'warn' | 'blip' | 'boom'): void
}

export type GuardianHit = {
  kind: 'panel' | 'ring' | 'body' | 'shrug'
  points: number
  x: number
  y: number
  /** This hit ended a phase. */
  phaseOver?: boolean
  /** This hit calmed it for good. */
  calmed?: boolean
}

export function newGuardian(lap: number): Guardian {
  const panels: GuardianPanel[] = [
    { dx: -21, dy: -6, upper: true, left: true },
    { dx: 21, dy: -6, upper: true, left: false },
    { dx: -16, dy: 11, upper: false, left: true },
    { dx: 16, dy: 11, upper: false, left: false },
  ].map((p) => ({ ...p, hp: GUARDIAN.panelHp + (lap - 1), flash: 0 }))
  return {
    x: W / 2,
    y: -40,
    phase: 1,
    act: 'enter',
    t: 0,
    life: 0,
    hp: GUARDIAN.sweepHp + (lap - 1) * GUARDIAN.lapHp,
    panels,
    tellPanel: -1,
    sweepX: 16,
    sweepDir: 1,
    held: 0,
    ring: [],
    spin: 0,
    path: [],
    step: 0,
    heading: Math.PI / 2,
    speed: 2,
    holding: false,
    flash: 0,
    lap,
    done: false,
  }
}

export function panelPos(gd: Guardian, p: GuardianPanel): Pt {
  return { x: gd.x + p.dx, y: gd.y + p.dy }
}

export function ringPos(gd: Guardian, angle: number): Pt {
  const a = angle + gd.spin
  return {
    x: gd.x + Math.cos(a) * GUARDIAN.ringRadius,
    y: gd.y + Math.sin(a) * GUARDIAN.ringRadius * 0.75,
  }
}

const livePanels = (gd: Guardian) => gd.panels.filter((p) => p.hp > 0)

function setAct(gd: Guardian, act: GuardianAct) {
  gd.act = act
  gd.t = 0
}

function sway(gd: Guardian, reach: number, rate: number) {
  const tx = W / 2 + Math.sin(gd.life / rate) * reach
  gd.x += (tx - gd.x) * 0.05
  gd.y += (GUARDIAN.hoverY - gd.y) * 0.05
}

function fan(at: Pt, w: GuardianWorld, spread: readonly number[]) {
  for (const vx of spread) w.dust(at.x, at.y + 6, vx)
}

/** One tick of the fight. */
export function updateGuardian(gd: Guardian, w: GuardianWorld) {
  gd.life++
  gd.t++
  gd.spin += 0.045
  if (gd.flash > 0) gd.flash--
  for (const p of gd.panels) if (p.flash > 0) p.flash--
  if (gd.act === 'home') {
    gd.y -= GUARDIAN.homeSpeed
    gd.x += (W / 2 - gd.x) * 0.03
    if (gd.y < -50) gd.done = true
    return
  }
  if (gd.act === 'enter') {
    gd.y += (GUARDIAN.hoverY - gd.y) * 0.04
    if (gd.t >= GUARDIAN.enterTicks) setAct(gd, 'idle')
    return
  }
  if (gd.phase === 1) updateWings(gd, w)
  else if (gd.phase === 2) updateSweep(gd, w)
  else updateDive(gd, w)
}

function updateWings(gd: Guardian, w: GuardianWorld) {
  sway(gd, 56, 80)
  const gap = Math.max(50, GUARDIAN.volleyGap - (gd.lap - 1) * 15)
  if (gd.act === 'idle' && gd.t >= gap) {
    const live = livePanels(gd)
    if (live.length === 0) return
    gd.tellPanel = gd.panels.indexOf(live[Math.floor(w.rng() * live.length)]!)
    setAct(gd, 'tell')
    w.sound('warn')
  } else if (gd.act === 'tell' && gd.t >= GUARDIAN.tellTicks) {
    const p = gd.panels[gd.tellPanel]
    const spread = gd.lap > 1 ? [-1, -0.5, 0, 0.5, 1] : [-0.7, 0, 0.7]
    if (p && p.hp > 0) fan(panelPos(gd, p), w, spread)
    gd.tellPanel = -1
    setAct(gd, 'idle')
  }
}

function updateSweep(gd: Guardian, w: GuardianWorld) {
  sway(gd, 30, 120)
  if (gd.act === 'idle' || gd.act === 'rest') {
    const wait = gd.act === 'idle' ? 30 : GUARDIAN.restTicks
    if (gd.act === 'rest' && gd.t === 20) fan(gd, w, [-0.8, -0.3, 0.3, 0.8])
    if (gd.t >= wait) {
      gd.sweepX = gd.sweepDir > 0 ? 14 : W - 14
      gd.held = 0
      setAct(gd, 'tell')
      w.sound('warn')
    }
  } else if (gd.act === 'tell') {
    if (gd.t >= GUARDIAN.sweepTell) setAct(gd, 'sweep')
  } else if (gd.act === 'sweep') {
    gd.sweepX += (gd.sweepDir * (W - 28)) / GUARDIAN.sweepTicks
    const inside =
      w.open && Math.abs(w.lanternX - gd.sweepX) < GUARDIAN.sweepHalf - 2
    gd.held = inside ? gd.held + 1 : Math.max(0, gd.held - 2)
    const took = gd.held >= GUARDIAN.grip
    if (took && w.caught(w.lanternX)) gd.holding = true
    if (took || gd.t >= GUARDIAN.sweepTicks) {
      gd.held = 0
      gd.sweepDir = gd.sweepDir > 0 ? -1 : 1
      setAct(gd, 'rest')
    }
  }
}

function updateDive(gd: Guardian, w: GuardianWorld) {
  if (gd.act === 'idle') setAct(gd, 'hover')
  if (gd.act === 'hover') {
    sway(gd, 40, 90)
    if (gd.ring.length === 0 && gd.t === 1)
      for (let i = 0; i < GUARDIAN.ringSize; i++)
        gd.ring.push((i / GUARDIAN.ringSize) * Math.PI * 2)
    if (gd.t >= GUARDIAN.hoverTicks) {
      const side = gd.x < W / 2 ? -1 : 1
      gd.path = [
        { x: gd.x + side * 30, y: gd.y - 8 },
        { x: w.lanternX, y: H * 0.55 },
        { x: w.lanternX, y: w.shipY },
        { x: w.lanternX - side * 40, y: H + 50 },
      ]
      gd.step = 0
      gd.heading = -Math.PI / 2
      gd.speed = Math.min(3, w.diveSpeed + 0.2)
      setAct(gd, 'dive')
      w.sound('warn')
    }
    return
  }
  if (gd.act === 'dive') {
    if (gd.step <= 1 && gd.path[1])
      gd.path[1].x += Math.sign(w.lanternX - gd.path[1].x) * 0.6
    const target = gd.path[gd.step]
    if (!target || gd.y > H + 40) {
      gd.x = W / 2
      gd.y = -40
      setAct(gd, 'return')
      return
    }
    const want = Math.atan2(target.y - gd.y, target.x - gd.x)
    let diff = want - gd.heading
    while (diff > Math.PI) diff -= Math.PI * 2
    while (diff < -Math.PI) diff += Math.PI * 2
    gd.heading += Math.max(-0.09, Math.min(0.09, diff))
    gd.x += Math.cos(gd.heading) * gd.speed
    gd.y += Math.sin(gd.heading) * gd.speed
    if (Math.hypot(target.x - gd.x, target.y - gd.y) < gd.speed * 4 + 8)
      gd.step++
    if (w.rng() < 0.02 && gd.y < w.shipY - 50) w.dust(gd.x, gd.y + 10, 0)
    if (!w.open) return
    if (Math.abs(gd.x - w.lanternX) < 13 && Math.abs(gd.y - w.shipY) < 14) {
      w.crash(gd.x)
      return
    }
    for (const angle of gd.ring) {
      const p = ringPos(gd, angle)
      if (Math.abs(p.x - w.lanternX) < 9 && Math.abs(p.y - w.shipY) < 9) {
        gd.ring = gd.ring.filter((a) => a !== angle)
        w.crash(p.x)
        return
      }
    }
    return
  }
  if (gd.act === 'return') {
    gd.y += (GUARDIAN.hoverY - gd.y) * 0.05
    if (Math.abs(gd.y - GUARDIAN.hoverY) < 2) setAct(gd, 'hover')
  }
}

/** A beam at (x, y): what it struck, or null when it flies on past. */
export function hitGuardian(
  gd: Guardian,
  x: number,
  y: number,
): GuardianHit | null {
  if (gd.phase === 4 || gd.act === 'enter') return null
  for (const angle of gd.ring) {
    const p = ringPos(gd, angle)
    if (Math.abs(p.x - x) < 7 && Math.abs(p.y - y) < 7) {
      gd.ring = gd.ring.filter((a) => a !== angle)
      return { kind: 'ring', points: GUARDIAN.ringPoints, x: p.x, y: p.y }
    }
  }
  if (gd.phase === 1) {
    for (const p of gd.panels) {
      if (p.hp <= 0) continue
      const at = panelPos(gd, p)
      if (Math.abs(at.x - x) >= 10 || Math.abs(at.y - y) >= 8) continue
      p.hp--
      p.flash = 6
      if (p.hp > 0) return { kind: 'panel', points: 0, x: at.x, y: at.y }
      if (gd.tellPanel === gd.panels.indexOf(p)) {
        gd.tellPanel = -1
        setAct(gd, 'idle')
      }
      const over = livePanels(gd).length === 0
      if (over) {
        gd.phase = 2
        setAct(gd, 'idle')
      }
      return {
        kind: 'panel',
        points: GUARDIAN.panelPoints,
        x: at.x,
        y: at.y,
        phaseOver: over,
      }
    }
  }
  if (Math.abs(gd.x - x) >= 9 || Math.abs(gd.y - y) >= 12) return null
  if (gd.phase === 1) return { kind: 'shrug', points: 0, x: gd.x, y: gd.y }
  gd.flash = 6
  if (--gd.hp > 0) return { kind: 'body', points: 0, x: gd.x, y: gd.y }
  if (gd.phase === 2) {
    gd.phase = 3
    gd.hp = GUARDIAN.diveHp + (gd.lap - 1) * GUARDIAN.lapHp
    setAct(gd, 'idle')
    return { kind: 'body', points: 0, x: gd.x, y: gd.y, phaseOver: true }
  }
  gd.phase = 4
  gd.ring = []
  setAct(gd, 'home')
  return {
    kind: 'body',
    points: GUARDIAN.calmPoints * Math.min(gd.lap, 3),
    x: gd.x,
    y: gd.y,
    phaseOver: true,
    calmed: true,
  }
}

/** How far the sweeping glow has taken hold (0..1), for the lantern's tell. */
export function gripShare(gd: Guardian): number {
  return gd.act === 'sweep' ? Math.min(1, gd.held / GUARDIAN.grip) : 0
}

// --- art -----------------------------------------------------------------------------------------

const WING_UPPER = [
  '......HHHL.',
  '....HHLLLMM',
  '..HHLLyLLMM',
  '.HLLLyYyLMS',
  'HLLLyYwYyMS',
  'HLLMLyYyLS.',
  '.LMMSLyLS..',
  '..SSS.SS...',
]
const WING_LOWER = [
  '..HLLLLMS',
  '.HLLyLLMS',
  'HLLyYyLMS',
  'HLyYwYyS.',
  '.LLyYyLS.',
  '..LLyLS..',
  '...SSS...',
]
const BODY = [
  '..a.....a..',
  '...a...a...',
  '....kGk....',
  '...GGGGG...',
  '...GeGeG...',
  '..nnnnnnn..',
  '.RooyyyooqD',
  'RoyYYYYYyoq',
  'RoyYwwwYyoq',
  'RoyYwwwYyoq',
  'RoyYYwYYyoq',
  '.RooyyyooqD',
  '..nnnnnnn..',
  '....RoR....',
  '.....o.....',
]

const wingPalette = (lit: boolean) => ({
  H: lit ? '#ffffff' : RAMPS.rust[4],
  L: lit ? RAMPS.gold[4] : RAMPS.rust[3],
  M: lit ? RAMPS.gold[3] : RAMPS.rust[2],
  S: lit ? RAMPS.gold[2] : RAMPS.rust[1],
  y: RAMPS.gold[3],
  Y: RAMPS.gold[4],
  w: '#ffffff',
})
const bodyPalette = (calm: boolean) => ({
  a: RAMPS.gold[3],
  k: INK,
  G: calm ? RAMPS.gold[3] : RAMPS.purple[3],
  e: RAMPS.gold[4],
  n: RAMPS.steel[2],
  R: calm ? RAMPS.gold[3] : RAMPS.rust[3],
  o: calm ? RAMPS.gold[2] : RAMPS.rust[2],
  q: calm ? RAMPS.gold[1] : RAMPS.rust[1],
  D: RAMPS.rust[0],
  y: RAMPS.gold[2],
  Y: RAMPS.gold[3],
  w: RAMPS.gold[4],
})

type WingSprites = { upper: PixelSprite; lower: PixelSprite }
const wings = (lit: boolean): { left: WingSprites; right: WingSprites } => {
  const upper = pixelSprite(WING_UPPER, wingPalette(lit))
  const lower = pixelSprite(WING_LOWER, wingPalette(lit))
  return {
    left: { upper, lower },
    right: { upper: mirrorSprite(upper), lower: mirrorSprite(lower) },
  }
}
const WINGS = wings(false)
const WINGS_LIT = wings(true)
const BODY_SPRITE = pixelSprite(BODY, bodyPalette(false))
const BODY_CALM = pixelSprite(BODY, bodyPalette(true))

/** The Guardian: its sweeping glow (with the guide line first), wing panels and body. */
export function renderGuardian(
  g: CanvasRenderingContext2D,
  gd: Guardian,
  tick: number,
  shipY: number,
) {
  if (gd.phase === 2 && (gd.act === 'tell' || gd.act === 'sweep')) {
    g.save()
    g.globalCompositeOperation = 'lighter'
    if (gd.act === 'tell') {
      const on = Math.floor(gd.t / 6) % 2 === 0
      g.fillStyle = rgba(RAMPS.purple[4], on ? 0.55 : 0.25)
      g.fillRect(Math.round(gd.sweepX), Math.round(gd.y + 10), 1, shipY - gd.y)
    } else {
      const top = Math.round(gd.y + 10)
      for (let y = top; y < shipY + 12; y += 2) {
        const t = (y - top) / Math.max(1, shipY + 12 - top)
        const half = Math.round(4 + (GUARDIAN.sweepHalf - 4) * t)
        const band = Math.floor((y - top - tick * 1.5) / 6)
        const colour = [RAMPS.purple[2], RAMPS.purple[3], RAMPS.teal[3]][
          ((band % 3) + 3) % 3
        ]!
        const cx = Math.round(gd.x + (gd.sweepX - gd.x) * t)
        g.fillStyle = rgba(colour, 0.26)
        g.fillRect(cx - half, y, half * 2, 2)
        g.fillStyle = rgba(RAMPS.purple[4], 0.45)
        g.fillRect(cx - half, y, 1, 2)
        g.fillRect(cx + half - 1, y, 1, 2)
      }
    }
    g.restore()
  }
  const calm = gd.phase === 4
  glow(g, gd.x, gd.y, calm ? 46 : 34, calm ? RAMPS.gold[3] : RAMPS.rust[3], 0.4)
  const flap = Math.floor(tick / 10) % 2
  for (const [i, p] of gd.panels.entries()) {
    if (p.hp <= 0) continue
    const set = p.flash > 0 || gd.tellPanel === i ? WINGS_LIT : WINGS
    const side = p.left ? set.left : set.right
    const shake = gd.tellPanel === i ? (Math.floor(gd.t / 2) % 2) * 2 - 1 : 0
    const at = panelPos(gd, p)
    drawSprite(
      g,
      p.upper ? side.upper : side.lower,
      at.x + shake,
      at.y + (flap && p.upper ? -1 : 0),
    )
  }
  const lit = gd.flash > 0 && Math.floor(gd.flash / 2) % 2 === 0
  drawSprite(g, calm || lit ? BODY_CALM : BODY_SPRITE, gd.x, gd.y)
}
