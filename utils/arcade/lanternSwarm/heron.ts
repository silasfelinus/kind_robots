// /utils/arcade/lanternSwarm/heron.ts
//
// Lantern Swarm depth pass, slice 2 (conductor kr-arcade/t-094): the River of Lights' Guardian, the
// Heron Kite, a huge paper kite that has slipped its string in the Glare's light.
//
// - It cruises above the river, trailing three tail ribbons. Its body shrugs beams off.
// - Before each dive its reflection shows on the water where it will skim; then it swoops down to
//   skim that spot. Read the reflection and slide aside.
// - Beam a tail ribbon through and the kite stalls: it sags and wobbles, and only then does its
//   body take beams (a few per stall, then it rights itself). With every ribbon cut it ties on
//   fresh ones.
// - Phase 2 (half calmed): it cruises and dives faster and drops dust as it goes.

import { INK, RAMPS, drawSprite, glow, pixelSprite, rgba } from '../snes'
import {
  lean,
  type BossFight,
  type GuardianHit,
  type GuardianWorld,
  type PilotHint,
} from './boss'
import { W } from './zones'

export const HERON = {
  ribbonHp: 5,
  ribbonPoints: 400,
  bodyHp: 40,
  /** It rights itself after this many beams in one stall. */
  stallHits: 6,
  lapHp: 4,
  calmPoints: 5000,
  cruiseY: 70,
  enterTicks: 90,
  cruiseSpeed: 1.2,
  cruiseTicks: 160,
  fastCruiseTicks: 100,
  tellTicks: 54,
  stallTicks: 120,
  stallY: 126,
  diveSpeed: 3.2,
  skimTicks: 24,
  homeSpeed: 0.8,
} as const

export type HeronAct =
  'enter' | 'cruise' | 'tell' | 'dive' | 'skim' | 'climb' | 'stall' | 'home'
export type Ribbon = { hp: number; flash: number }

export type Heron = BossFight & {
  act: HeronAct
  t: number
  life: number
  hp: number
  maxHp: number
  lap: number
  dir: -1 | 1
  ribbons: Ribbon[]
  /** Where the next dive will skim the river (its reflection shows there first). */
  diveX: number
  flash: number
  /** Beams taken in the current stall. */
  stallHits: number
}

/** Where ribbon i hangs from the kite's tail. */
export function ribbonX(h: Heron, i: number): number {
  return h.x + (i - 1) * 7
}

function setAct(h: Heron, act: HeronAct) {
  h.act = act
  h.t = 0
}

function updateHeron(h: Heron, w: GuardianWorld) {
  h.life++
  h.t++
  if (h.flash > 0) h.flash--
  for (const r of h.ribbons) if (r.flash > 0) r.flash--
  const fast = h.phase === 2
  const crash = () => {
    if (
      w.open &&
      Math.abs(h.x - w.lanternX) < 16 &&
      Math.abs(h.y - w.shipY) < 12
    )
      w.crash(h.x)
  }
  switch (h.act) {
    case 'home':
      h.y -= HERON.homeSpeed
      h.x += (W / 2 - h.x) * 0.03
      if (h.y < -50) h.done = true
      return
    case 'enter':
      h.y += (HERON.cruiseY - h.y) * 0.04
      if (h.t >= HERON.enterTicks) setAct(h, 'cruise')
      return
    case 'cruise': {
      h.x += h.dir * (fast ? 1.7 : HERON.cruiseSpeed)
      if (h.x < 30) h.dir = 1
      if (h.x > W - 30) h.dir = -1
      h.y += (HERON.cruiseY + Math.sin(h.life / 30) * 5 - h.y) * 0.1
      if (fast && h.t % 70 === 35) {
        w.dust(h.x - 6, h.y + 10, -0.4)
        w.dust(h.x + 6, h.y + 10, 0.4)
      }
      const gap = Math.max(
        60,
        (fast ? HERON.fastCruiseTicks : HERON.cruiseTicks) - (h.lap - 1) * 15,
      )
      if (h.t >= gap) {
        h.diveX = Math.max(20, Math.min(W - 20, w.lanternX))
        setAct(h, 'tell')
        w.sound('warn')
      }
      return
    }
    case 'tell':
      h.x += h.dir * 0.4
      if (h.t >= HERON.tellTicks) setAct(h, 'dive')
      return
    case 'dive': {
      const speed = Math.min(3.8, HERON.diveSpeed + (h.lap - 1) * 0.2)
      const dx = h.diveX - h.x
      const dy = w.shipY - 2 - h.y
      const d = Math.hypot(dx, dy)
      if (d < speed) setAct(h, 'skim')
      else {
        h.x += (dx / d) * speed
        h.y += (dy / d) * speed
      }
      crash()
      return
    }
    case 'skim':
      h.x += h.dir * 1.5
      crash()
      if (h.t >= HERON.skimTicks) setAct(h, 'climb')
      return
    case 'climb':
      h.y += (HERON.cruiseY - h.y) * 0.05
      if (Math.abs(h.y - HERON.cruiseY) < 3) setAct(h, 'cruise')
      return
    case 'stall':
      h.y += (HERON.stallY - h.y) * 0.03
      h.x += Math.sin(h.t / 9) * 0.6
      if (h.t >= HERON.stallTicks || h.stallHits >= HERON.stallHits) {
        if (h.ribbons.every((r) => r.hp <= 0))
          for (const r of h.ribbons) r.hp = HERON.ribbonHp + (h.lap - 1)
        setAct(h, 'climb')
      }
      return
  }
}

function hitHeron(h: Heron, x: number, y: number): GuardianHit | null {
  if (h.act === 'enter' || h.act === 'home') return null
  if (h.act !== 'stall')
    for (const [i, r] of h.ribbons.entries()) {
      if (r.hp <= 0 || Math.abs(ribbonX(h, i) - x) >= 4) continue
      if (y < h.y + 12 || y > h.y + 38) continue
      r.flash = 6
      if (--r.hp > 0) return { kind: 'ribbon', points: 0, x, y }
      setAct(h, 'stall')
      h.stallHits = 0
      return { kind: 'ribbon', points: HERON.ribbonPoints, x, y }
    }
  if (Math.abs(h.x - x) >= 14 || Math.abs(h.y - y) >= 10) return null
  if (h.act !== 'stall' || h.stallHits >= HERON.stallHits)
    return { kind: 'shrug', points: 0, x: h.x, y: h.y }
  h.flash = 6
  h.stallHits++
  h.hp--
  if (h.hp <= 0) {
    h.phase = 4
    setAct(h, 'home')
    return {
      kind: 'body',
      points: HERON.calmPoints * Math.min(h.lap, 3),
      x: h.x,
      y: h.y,
      phaseOver: true,
      calmed: true,
    }
  }
  if (h.phase === 1 && h.hp <= h.maxHp / 2) {
    h.phase = 2
    return { kind: 'body', points: 0, x: h.x, y: h.y, phaseOver: true }
  }
  return { kind: 'body', points: 0, x: h.x, y: h.y }
}

function heronPilot(h: Heron, lanternX: number, shipY: number): PilotHint {
  let push = 0
  if (
    (h.act === 'tell' || h.act === 'dive') &&
    Math.abs(lanternX - h.diveX) < 36
  )
    push += h.diveX < lanternX ? 2 : -2
  if (h.act === 'dive' || h.act === 'skim')
    push += lean(lanternX, shipY, h.x, h.y, 26)
  if (h.act === 'enter' || h.act === 'home') return { aim: null, push }
  if (h.act === 'stall') return { aim: h.x, push }
  const xs = h.ribbons
    .map((r, i) => (r.hp > 0 ? ribbonX(h, i) : null))
    .filter((x): x is number => x !== null)
    .sort((a, b) => Math.abs(a - lanternX) - Math.abs(b - lanternX))
  return { aim: xs[0] ?? h.x, push }
}

// --- art -----------------------------------------------------------------------------------------

const KITE_ROWS = [
  '.........B.........',
  '........BWB........',
  '.......BWWWB.......',
  '......BWWkWWB......',
  '.....BWWWWWYYB.....',
  '....BWWWWWWWWWB....',
  '...BPWWWWWWWWWPB...',
  '..BPPPWWWWWWWPPPB..',
  '.BPPPPPWWWWWPPPPPB.',
  'BPPPPPPPWWWPPPPPPPB',
  '.BPPPPPPPWPPPPPPPB.',
  '..BPPPPPPsPPPPPPB..',
  '...BPPPPPsPPPPPB...',
  '....BPPPPsPPPPB....',
  '.....BPPPsPPPB.....',
  '......BPPsPPB......',
  '.......BPsPB.......',
  '........BsB........',
  '.........B.........',
]
const kitePalette = (calm: boolean) => ({
  B: RAMPS.water[1],
  W: RAMPS.cream[4],
  k: INK,
  Y: RAMPS.gold[3],
  P: calm ? RAMPS.gold[3] : RAMPS.water[3],
  s: RAMPS.earth[2],
})
const KITE = pixelSprite(KITE_ROWS, kitePalette(false))
const KITE_CALM = pixelSprite(KITE_ROWS, kitePalette(true))

function renderHeron(
  g: CanvasRenderingContext2D,
  h: Heron,
  tick: number,
  shipY: number,
) {
  const water = shipY + 14
  // Its reflection on the river: under the kite, or at the spot it will skim, flashing, as a tell.
  const telling = h.act === 'tell'
  const rx = telling ? h.diveX : h.x
  const on = !telling || Math.floor(h.t / 5) % 2 === 0
  if (h.act !== 'home' && on) {
    g.save()
    g.globalAlpha *= telling ? 0.7 : 0.25
    drawSprite(g, KITE, rx, water, { flipY: true })
    g.restore()
    if (telling) glow(g, rx, water, 22, RAMPS.water[4], 0.4)
  }
  for (const [i, r] of h.ribbons.entries()) {
    if (r.hp <= 0) continue
    const top = h.y + 12
    for (let k = 0; k < 13; k++) {
      const sway = Math.round(Math.sin(tick / 6 + k * 0.6 + i) * 2)
      g.fillStyle =
        r.flash > 0 ? '#ffffff' : k % 4 < 2 ? RAMPS.pink[3] : RAMPS.gold[3]
      g.fillRect(
        Math.round(ribbonX(h, i)) + sway,
        Math.round(top + k * 2),
        2,
        2,
      )
    }
  }
  const calm = h.phase === 4
  glow(g, h.x, h.y, calm ? 44 : 30, calm ? RAMPS.gold[3] : RAMPS.water[3], 0.35)
  const lit = (h.flash > 0 && Math.floor(h.flash / 2) % 2 === 0) || calm
  const wobble = h.act === 'stall' ? Math.round(Math.sin(h.t / 4) * 2) : 0
  drawSprite(g, lit ? KITE_CALM : KITE, h.x + wobble, h.y)
  if (h.act === 'stall') {
    g.fillStyle = rgba(RAMPS.gold[4], 0.8)
    for (let k = 0; k < 3; k++)
      g.fillRect(
        Math.round(h.x - 10 + k * 10 + Math.sin(tick / 5 + k) * 2),
        Math.round(h.y - 16 - ((tick + k * 9) % 12)),
        1,
        1,
      )
  }
}

/** The Heron Kite as a Guardian fight the game can run. */
export function heronKite(lap: number): Heron {
  const hp = HERON.bodyHp + (lap - 1) * HERON.lapHp
  const h: Heron = {
    name: 'THE HERON KITE',
    calmLine: 'THE HERON KITE DRIFTS HOME',
    x: W / 2,
    y: -40,
    phase: 1,
    holding: false,
    done: false,
    act: 'enter',
    t: 0,
    life: 0,
    hp,
    maxHp: hp,
    lap,
    dir: 1,
    ribbons: [0, 1, 2].map(() => ({
      hp: HERON.ribbonHp + (lap - 1),
      flash: 0,
    })),
    diveX: W / 2,
    flash: 0,
    stallHits: 0,
    update: (w) => updateHeron(h, w),
    hit: (x, y) => hitHeron(h, x, y),
    render: (g, tick, shipY) => renderHeron(g, h, tick, shipY),
    pilot: (lanternX, shipY) => heronPilot(h, lanternX, shipY),
    phaseBanner: () => ({
      text: 'IT FLIES FASTER!',
      sub: 'WATCH ITS REFLECTION',
    }),
    grip: () => 0,
  }
  return h
}
