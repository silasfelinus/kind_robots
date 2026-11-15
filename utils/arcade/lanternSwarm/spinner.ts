// /utils/arcade/lanternSwarm/spinner.ts
//
// Lantern Swarm depth pass, slice 2 (conductor kr-arcade/t-094): the Orchard Canopy's Guardian, the
// Silk Spinner. Dazzled by the Glare, it has strung itself up high in the orchard.
//
// - Phase 1: it hangs on three silk threads, out of reach (beams fly past it). Beam the
//   threads; each one cut lowers it. It drops cocoons that hatch into trios of moonlets unless a
//   beam pops them first.
// - Phase 2: lowered into range. Its body takes beams; it keeps dropping cocoons and, after a
//   shiver, spits a fan of silk.
// - Phase 3: it bursts into a giant moonlet trio that circles the orchard and dives one at a time.
//   Calm all three and the Spinner floats home.

import { INK, RAMPS, drawSprite, glow, pixelSprite, rgba } from '../snes'
import { MOONLETS, WRAP, drawMoth } from './art'
import {
  lean,
  type BossFight,
  type GuardianHit,
  type GuardianWorld,
  type PilotHint,
} from './boss'
import { W } from './zones'

const HUD_TOP = 22

export const SPINNER = {
  threadHp: 4,
  threadPoints: 300,
  cocoonPoints: 100,
  bodyHp: 18,
  giantHp: 6,
  giantPoints: 600,
  lapHp: 4,
  calmPoints: 5000,
  hangY: 52,
  dropPerThread: 18,
  lowY: 112,
  enterTicks: 90,
  cocoonGap: 130,
  hatchTicks: 80,
  cocoonFall: 0.55,
  spitGap: 150,
  spitTell: 30,
  giantGap: 110,
  orbitY: 96,
  orbitR: 44,
  homeSpeed: 0.7,
} as const

export type SpinnerThread = { dx: number; hp: number; flash: number }
export type SpinnerCocoon = { x: number; y: number; t: number }
export type GiantMoonlet = {
  angle: number
  hp: number
  x: number
  y: number
  /** 'orbit', then 'dive' at the lantern, then 'back' up to its place. */
  act: 'orbit' | 'dive' | 'back'
  tx: number
  flash: number
}

export type Spinner = BossFight & {
  act: 'enter' | 'fight' | 'home'
  t: number
  life: number
  hp: number
  lap: number
  threads: SpinnerThread[]
  cocoons: SpinnerCocoon[]
  giants: GiantMoonlet[]
  brood: number
  flash: number
  spin: number
  /** Ticks into the silk-spit shiver (0: none). */
  shiver: number
}

const cut = (s: Spinner) => s.threads.filter((t) => t.hp <= 0).length

function orbitPos(s: Spinner, m: GiantMoonlet) {
  const a = m.angle + s.spin
  return {
    x: W / 2 + Math.cos(a) * SPINNER.orbitR,
    y: SPINNER.orbitY + Math.sin(a) * SPINNER.orbitR * 0.55,
  }
}

function updateSpinner(s: Spinner, w: GuardianWorld) {
  s.life++
  s.t++
  s.spin += 0.02
  if (s.flash > 0) s.flash--
  for (const th of s.threads) if (th.flash > 0) th.flash--
  if (s.act === 'home') {
    s.y -= SPINNER.homeSpeed
    s.x += (W / 2 - s.x) * 0.03
    if (s.y < -50) s.done = true
    return
  }
  // The cocoons it has dropped drift down and hatch.
  for (const c of s.cocoons) {
    c.y += SPINNER.cocoonFall
    c.t++
    if (c.t >= SPINNER.hatchTicks) {
      for (const k of [-1, 0, 1]) w.spawn('moonlet', c.x + k * 8, c.y, s.brood)
      s.brood++
      w.sound('warn')
    }
  }
  s.cocoons = s.cocoons.filter((c) => c.t < SPINNER.hatchTicks)
  if (s.act === 'enter') {
    s.y += (SPINNER.hangY - s.y) * 0.04
    if (s.t >= SPINNER.enterTicks) {
      s.act = 'fight'
      s.t = 0
    }
    return
  }
  if (s.phase === 3) {
    updateTrio(s, w)
    return
  }
  const targetY =
    s.phase === 2
      ? SPINNER.lowY
      : SPINNER.hangY + cut(s) * SPINNER.dropPerThread
  s.y += (targetY - s.y) * 0.05
  s.x +=
    (W / 2 + Math.sin(s.life / 90) * (s.phase === 2 ? 56 : 40) - s.x) * 0.05
  const gap = Math.max(
    60,
    (s.phase === 2 ? 95 : SPINNER.cocoonGap) - (s.lap - 1) * 15,
  )
  if (s.t % gap === 0) s.cocoons.push({ x: s.x, y: s.y + 12, t: 0 })
  if (s.phase === 2) {
    if (s.shiver > 0 && ++s.shiver > SPINNER.spitTell) {
      for (const vx of [-0.8, -0.3, 0.3, 0.8]) w.dust(s.x, s.y + 10, vx)
      s.shiver = 0
    } else if (s.shiver === 0 && s.t % SPINNER.spitGap === 0) {
      s.shiver = 1
      w.sound('warn')
    }
  }
}

function updateTrio(s: Spinner, w: GuardianWorld) {
  const diving = s.giants.some((m) => m.act !== 'orbit')
  if (!diving && s.t % SPINNER.giantGap === 0 && s.giants.length > 0) {
    const m = s.giants[Math.floor(w.rng() * s.giants.length)]!
    m.act = 'dive'
    m.tx = w.lanternX
    w.sound('warn')
  }
  const speed = Math.min(3, w.diveSpeed + 0.4)
  for (const m of s.giants) {
    if (m.flash > 0) m.flash--
    if (m.act === 'orbit') {
      const p = orbitPos(s, m)
      m.x += (p.x - m.x) * 0.1
      m.y += (p.y - m.y) * 0.1
      continue
    }
    if (m.act === 'dive') {
      m.tx += Math.sign(w.lanternX - m.tx) * 0.4
      const dx = m.tx - m.x
      const dy = w.shipY + 40 - m.y
      const d = Math.max(1, Math.hypot(dx, dy))
      m.x += (dx / d) * speed
      m.y += (dy / d) * speed
      if (
        w.open &&
        Math.abs(m.x - w.lanternX) < 11 &&
        Math.abs(m.y - w.shipY) < 10
      ) {
        w.crash(m.x)
        m.act = 'back'
      }
      if (m.y >= w.shipY + 36) m.act = 'back'
      continue
    }
    const p = orbitPos(s, m)
    const dx = p.x - m.x
    const dy = p.y - m.y
    const d = Math.hypot(dx, dy)
    if (d < 3) m.act = 'orbit'
    else {
      m.x += (dx / d) * 2.5
      m.y += (dy / d) * 2.5
    }
  }
}

function hitSpinner(s: Spinner, x: number, y: number): GuardianHit | null {
  if (s.act !== 'fight') return null
  for (const c of s.cocoons)
    if (Math.abs(c.x - x) < 5 && Math.abs(c.y - y) < 6) {
      s.cocoons = s.cocoons.filter((o) => o !== c)
      return { kind: 'cocoon', points: SPINNER.cocoonPoints, x: c.x, y: c.y }
    }
  if (s.phase === 3) {
    for (const m of s.giants) {
      if (Math.abs(m.x - x) >= 9 || Math.abs(m.y - y) >= 8) continue
      m.flash = 6
      if (--m.hp > 0) return { kind: 'giant', points: 0, x: m.x, y: m.y }
      s.giants = s.giants.filter((o) => o !== m)
      if (s.giants.length > 0)
        return { kind: 'giant', points: SPINNER.giantPoints, x: m.x, y: m.y }
      s.phase = 4
      s.act = 'home'
      s.x = m.x
      s.y = m.y
      return {
        kind: 'giant',
        points: SPINNER.calmPoints * Math.min(s.lap, 3),
        x: m.x,
        y: m.y,
        phaseOver: true,
        calmed: true,
      }
    }
    return null
  }
  if (s.phase === 1)
    for (const th of s.threads) {
      if (th.hp <= 0 || Math.abs(s.x + th.dx - x) >= 4) continue
      if (y < HUD_TOP || y > s.y - 8) continue
      th.flash = 6
      if (--th.hp > 0) return { kind: 'thread', points: 0, x, y }
      const over = cut(s) === s.threads.length
      if (over) {
        s.phase = 2
        s.t = 0
      }
      return {
        kind: 'thread',
        points: SPINNER.threadPoints,
        x,
        y,
        phaseOver: over,
      }
    }
  // Hung up high, out of reach: beams pass it by on the way to its threads.
  if (s.phase === 1) return null
  if (Math.abs(s.x - x) >= 10 || Math.abs(s.y - y) >= 10) return null
  s.flash = 6
  if (--s.hp > 0) return { kind: 'body', points: 0, x: s.x, y: s.y }
  s.phase = 3
  s.t = 0
  s.shiver = 0
  const hp = SPINNER.giantHp + (s.lap - 1) * 2
  s.giants = [0, 1, 2].map((i) => ({
    angle: (i / 3) * Math.PI * 2,
    hp,
    x: s.x,
    y: s.y,
    act: 'back' as const,
    tx: s.x,
    flash: 0,
  }))
  return { kind: 'body', points: 0, x: s.x, y: s.y, phaseOver: true }
}

function spinnerPilot(s: Spinner, lanternX: number, shipY: number): PilotHint {
  let push = 0
  for (const m of s.giants)
    if (m.act === 'dive') push += lean(lanternX, shipY, m.x, m.y, 22)
  if (s.act !== 'fight') return { aim: null, push }
  const near = (xs: number[]) =>
    xs.sort((a, b) => Math.abs(a - lanternX) - Math.abs(b - lanternX))[0] ??
    null
  const low = s.cocoons.filter((c) => c.y > 120).map((c) => c.x)
  if (low.length > 0) return { aim: near(low), push }
  if (s.phase === 1)
    return {
      aim: near(s.threads.filter((t) => t.hp > 0).map((t) => s.x + t.dx)),
      push,
    }
  if (s.phase === 3) {
    const diver = s.giants.find((m) => m.act === 'dive')
    return { aim: diver ? diver.x : near(s.giants.map((m) => m.x)), push }
  }
  return { aim: s.x, push }
}

// --- art -----------------------------------------------------------------------------------------

const SPINNER_ROWS = [
  '...a.....a...',
  '....a...a....',
  '..SS.kGk.SS..',
  '.SWWSGGGSWWS.',
  'SWWWSGeGSWWWS',
  'SWWSSGGGSSWWS',
  '.SS.SgGgS.SS.',
  '....sgggs....',
  '...s.ggg.s...',
  '..s...g...s..',
]
const spinnerPalette = (calm: boolean) => ({
  a: RAMPS.steel[3],
  k: INK,
  S: RAMPS.steel[3],
  W: '#ffffff',
  G: calm ? RAMPS.gold[3] : RAMPS.teal[2],
  g: calm ? RAMPS.gold[2] : RAMPS.teal[1],
  e: RAMPS.gold[4],
  s: RAMPS.steel[2],
})
const BODY = pixelSprite(SPINNER_ROWS, spinnerPalette(false))
const BODY_CALM = pixelSprite(SPINNER_ROWS, spinnerPalette(true))

function renderSpinner(g: CanvasRenderingContext2D, s: Spinner, tick: number) {
  const beat = Math.floor(tick / 8) % 2
  for (const c of s.cocoons) {
    const shimmer = c.t > SPINNER.hatchTicks - 24 && Math.floor(c.t / 3) % 2
    glow(g, c.x, c.y, 8, shimmer ? RAMPS.purple[3] : RAMPS.steel[3], 0.35)
    drawSprite(g, WRAP, c.x + (shimmer ? 1 : 0), c.y)
  }
  if (s.phase === 1 || s.phase === 2 || s.act === 'enter') {
    for (const th of s.threads) {
      if (th.hp <= 0) continue
      g.fillStyle =
        th.flash > 0 ? '#ffffff' : rgba(RAMPS.steel[4], 0.55 + th.hp * 0.08)
      g.fillRect(
        Math.round(s.x + th.dx),
        HUD_TOP,
        1,
        Math.round(s.y - 6 - HUD_TOP),
      )
    }
  }
  if (s.phase !== 3) {
    const calm = s.phase === 4
    glow(
      g,
      s.x,
      s.y,
      calm ? 40 : 26,
      calm ? RAMPS.gold[3] : RAMPS.teal[3],
      0.35,
    )
    const lit = (s.flash > 0 && Math.floor(s.flash / 2) % 2 === 0) || calm
    const quiver = s.shiver > 0 ? (Math.floor(s.shiver / 2) % 2) * 2 - 1 : 0
    drawSprite(g, lit ? BODY_CALM : BODY, s.x + quiver, s.y)
  }
  for (const m of s.giants) {
    glow(g, m.x, m.y, 16, RAMPS.purple[3], m.act === 'dive' ? 0.5 : 0.3)
    const heading = m.act === 'dive' ? Math.PI / 2 : -Math.PI / 2
    if (m.flash > 0 && Math.floor(m.flash / 2) % 2 === 0) {
      glow(g, m.x, m.y, 10, '#ffffff', 0.6)
    }
    drawMoth(g, MOONLETS, m.x, m.y, heading, beat, 2)
  }
}

/** The Silk Spinner as a Guardian fight the game can run. */
export function silkSpinner(lap: number): Spinner {
  const s: Spinner = {
    name: 'THE SILK SPINNER',
    calmLine: 'THE SILK SPINNER FLOATS HOME',
    x: W / 2,
    y: -30,
    phase: 1,
    holding: false,
    done: false,
    act: 'enter',
    t: 0,
    life: 0,
    hp: SPINNER.bodyHp + (lap - 1) * SPINNER.lapHp,
    lap,
    threads: [-14, 0, 14].map((dx) => ({
      dx,
      hp: SPINNER.threadHp + (lap - 1),
      flash: 0,
    })),
    cocoons: [],
    giants: [],
    brood: 1,
    flash: 0,
    spin: 0,
    shiver: 0,
    update: (w) => updateSpinner(s, w),
    hit: (x, y) => hitSpinner(s, x, y),
    render: (g, tick) => renderSpinner(g, s, tick),
    pilot: (lanternX, shipY) => spinnerPilot(s, lanternX, shipY),
    phaseBanner: () =>
      s.phase === 2
        ? { text: 'IN RANGE!', sub: 'BEAM IT AND POP ITS COCOONS' }
        : { text: 'A GIANT TRIO!', sub: 'CALM ALL THREE MOONLETS' },
    grip: () => 0,
  }
  return s
}
