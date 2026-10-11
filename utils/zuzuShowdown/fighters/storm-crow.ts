// /utils/zuzuShowdown/fighters/storm-crow.ts
//
// Storm Crow (conductor zuzu-showdown t-016, from fighters.yaml): the captain
// of the Storm Crows, an air rushdown with a flight mode. Talon dives that
// bounce off, a hooked blade cast on a chain that reels the victim in, a
// lightning bolt called down where the opponent stood, and a rifle shot that
// is slow to start and fast to land. Take Wing flies him freely for three
// seconds, attacking at any height, until a hit knocks him out of the sky.
//
// Starting values; the balance pass (t-024) tunes them, mirrored into
// fighters.yaml in the same conductor PR.

import {
  SUB,
  type FighterData,
  type MoveData,
  type SpecialMove,
} from '../types'
import { defaultChains, defaultNormals } from './placeholders'

const HEIGHT = 100
const WIDTH = 30
const NO_HITBOX = { x: 0, y: 0, w: 0, h: 0 }

// LP is a wing buffet; HP a long hooked-blade slash. Each box is fitted to
// his rig's art (conductor tools/rigs/crow.py), so it reaches where the wing,
// hook or talons are drawn on its active frames.
const normals = defaultNormals(HEIGHT)
const fit = (id: keyof typeof normals, hitbox: MoveData['hitbox']) => {
  normals[id] = { ...normals[id], hitbox }
}
fit('stand_lp', { x: 8, y: 60, w: 30, h: 10 })
fit('stand_hp', { x: 8, y: 47, w: 36, h: 16 })
fit('stand_hk', { x: 6, y: 25, w: 34, h: 14 })
fit('crouch_lp', { x: 8, y: 35, w: 28, h: 10 })
fit('crouch_hp', { x: 2, y: 40, w: 24, h: 42 })
fit('crouch_hk', { x: 6, y: 0, w: 32, h: 10 })
fit('jump_lp', { x: 4, y: 21, w: 28, h: 14 })
fit('jump_hp', { x: 4, y: 23, w: 28, h: 24 })
fit('jump_lk', { x: -6, y: 0, w: 36, h: 14 })

// A steep talon dive kick from the air: LK shallow, HK steep. On contact he
// kicks off and springs back up.
const murderDive: MoveData = {
  startup: 6,
  active: 22,
  recovery: 10,
  hitbox: { x: 4, y: -4, w: 26, h: 22 },
  damage: 90,
  chip: 9,
  hitstun: 18,
  blockstun: 12,
  hitstop: 8,
  pushback: 6,
  guard: 'high',
  velocity: { from: 6, to: 27, x: 5 * SUB, y: -4 * SUB },
  bounce: 7 * SUB,
}

// The hooked blade cast on a chain: a ranged grab that ignores guard but loses
// to any strike, reeling the victim in close and leaving them standing.
const hookAndReel: MoveData = {
  startup: 14,
  active: 4,
  recovery: 24,
  hitbox: { x: 20, y: 30, w: 110, h: 30 },
  damage: 80,
  hitstun: 0,
  blockstun: 0,
  hitstop: 8,
  pushback: 0,
  guard: 'mid',
  grab: true,
  grabStun: 26,
}

// Flight mode for three seconds; a hit ends it early.
const takeWing: MoveData = {
  startup: 8,
  active: 1,
  recovery: 0,
  hitbox: NO_HITBOX,
  damage: 0,
  hitstun: 0,
  blockstun: 0,
  hitstop: 0,
  pushback: 0,
  guard: 'mid',
  flight: 180,
}

// He raises the blade and lightning strikes where the opponent stood when he
// called it: slow on the ground. HP is the anti-air: the bolt strikes above him.
const thunderhead: MoveData = {
  startup: 30,
  active: 6,
  recovery: 24,
  hitbox: { x: -14, y: 0, w: 28, h: 180 },
  damage: 100,
  chip: 10,
  hitstun: 24,
  blockstun: 14,
  hitstop: 10,
  pushback: 4,
  guard: 'mid',
  knockdown: true,
  strikeAt: 'opponent',
}

// A long rifle shot straight across the screen: slow to start, fast to land.
const rifleCrack: MoveData = {
  startup: 24,
  active: 1,
  recovery: 26,
  hitbox: NO_HITBOX,
  damage: 70,
  chip: 7,
  hitstun: 18,
  blockstun: 12,
  hitstop: 6,
  pushback: 6,
  guard: 'mid',
  projectile: {
    spawnFrame: 24,
    spawn: { x: 24, y: 62 },
    box: { x: -6, y: -3, w: 12, h: 6 },
    speed: 14 * SUB,
    life: 60,
  },
}

// A spinning aerial drill of talons and blade that carries the opponent up
// into the storm: five hits.
const wheelOfWings: MoveData = {
  startup: 6,
  active: 30,
  recovery: 26,
  hitbox: { x: 0, y: 20, w: 40, h: 70 },
  damage: 52,
  chip: 5,
  hitstun: 20,
  blockstun: 12,
  hitstop: 5,
  pushback: 2,
  guard: 'mid',
  hits: 5,
  rehit: 6,
  velocity: { from: 6, to: 24, x: 2 * SUB, y: 5 * SUB },
  meterCost: 1000,
  freeze: 30,
  invuln: { from: 1, to: 8, strike: true, projectile: true, throw: true },
}

// The flock pours across the screen like black rain: six hits.
const theMurder: MoveData = {
  startup: 2,
  active: 36,
  recovery: 50,
  hitbox: { x: -40, y: 0, w: 440, h: 170 },
  damage: 70,
  chip: 10,
  hitstun: 20,
  blockstun: 14,
  hitstop: 6,
  pushback: 2,
  guard: 'mid',
  hits: 6,
  rehit: 6,
  meterCost: 3000,
  freeze: 60,
  showdown: true,
  invuln: { from: 1, to: 10, strike: true, projectile: true, throw: true },
}

const specials: SpecialMove[] = [
  {
    id: 'murder-dive',
    motion: 'qcf',
    button: 'K',
    level: 'special',
    air: true,
    move: murderDive,
    heavy: { velocity: { from: 6, to: 27, x: 3 * SUB, y: -8 * SUB } },
  },
  {
    id: 'hook-and-reel',
    motion: 'qcb',
    button: 'P',
    level: 'special',
    move: hookAndReel,
  },
  {
    id: 'take-wing',
    motion: 'qcb',
    button: 'K',
    level: 'special',
    move: takeWing,
  },
  {
    id: 'thunderhead',
    motion: 'dp',
    button: 'P',
    level: 'special',
    move: thunderhead,
    heavy: {
      startup: 12,
      hitbox: { x: -10, y: 70, w: 56, h: 90 },
      strikeAt: undefined,
    },
  },
  {
    // In the air the bolt comes fast.
    id: 'thunderhead-air',
    motion: 'dp',
    button: 'P',
    level: 'special',
    air: true,
    move: { ...thunderhead, startup: 10, recovery: 16 },
  },
  {
    id: 'rifle-crack',
    motion: 'dd',
    button: 'P',
    level: 'special',
    move: rifleCrack,
  },
  {
    id: 'wheel-of-wings',
    motion: 'qcf2',
    button: 'K',
    level: 'super',
    move: wheelOfWings,
  },
  {
    id: 'the-murder',
    motion: 'qcb2',
    button: 'HP',
    level: 'super',
    move: theMurder,
  },
]

export const STORM_CROW: FighterData = {
  slug: 'storm-crow',
  name: 'Storm Crow',
  health: 950,
  walkForward: Math.round(2.2 * SUB),
  walkBack: Math.round(1.8 * SUB),
  jumpVelocity: 10 * SUB,
  jumpForward: Math.round(3.2 * SUB),
  gravity: Math.round(0.45 * SUB),
  pushbox: { x: -15, y: 0, w: WIDTH, h: 56 },
  hurtStand: { x: -17, y: 0, w: WIDTH + 4, h: HEIGHT },
  hurtCrouch: { x: -17, y: 0, w: WIDTH + 4, h: 62 },
  hurtAir: { x: -15, y: 10, w: WIDTH, h: 80 },
  throwRange: 10,
  throwDamage: 120,
  moves: normals,
  chains: defaultChains(),
  specials,
  easy: {
    neutral: 'rifle-crack',
    forward: 'hook-and-reel',
    back: 'take-wing',
    up: 'thunderhead',
    super: 'wheel-of-wings',
  },
  look: {
    body: '#1f2937',
    light: '#9ca3af',
    dark: '#030712',
  },
}
