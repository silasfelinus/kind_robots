// /utils/zuzuShowdown/fighters/abbess.ts
//
// The Abbess of the Mission (conductor zuzu-showdown t-015, from
// fighters.yaml). A sea otter head nun: a zoner and summoner with a thrown
// ritual dagger, a tentacle that bursts from the floor as a slow trap, a
// portal teleport (The Thin Place), a command grab onto an altar slab (Last
// Rites), and a tolling bell that halves the opponent's projectile speed
// (Vespers). Lv1 The Choir sweeps a low tentacle across the screen (jump it);
// Lv3 Open the Door is the Showdown super.
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

const HEIGHT = 96
const WIDTH = 30
const NO_HITBOX = { x: 0, y: 0, w: 0, h: 0 }

const normals = defaultNormals(HEIGHT)
// HP is the dagger slash: a little reach for a zoner.
normals.stand_hp = {
  ...normals.stand_hp,
  hitbox: { x: 8, y: 52, w: 32, h: 12 },
  damage: 66,
}
// Her habit keeps her kicks low (t-011: the art has no thigh to lift): HK is a
// long stamp from under the hem, and the sweep a short one along the floor.
normals.stand_hk = {
  ...normals.stand_hk,
  hitbox: { x: 6, y: 16, w: 36, h: 14 },
}
normals.crouch_hk = {
  ...normals.crouch_hk,
  hitbox: { x: 6, y: 0, w: 34, h: 10 },
}

const benediction: MoveData = {
  startup: 14,
  active: 1,
  recovery: 22,
  hitbox: NO_HITBOX,
  damage: 60,
  chip: 6,
  hitstun: 18,
  blockstun: 12,
  hitstop: 6,
  pushback: 6,
  guard: 'mid',
  projectile: {
    spawnFrame: 14,
    spawn: { x: 22, y: 52 },
    box: { x: -6, y: -3, w: 12, h: 6 },
    speed: 7 * SUB,
    life: 80,
  },
}

// A trap, not a reversal: slow to appear, and it lifts the victim for a juggle.
const reachingTentacle: MoveData = {
  startup: 24,
  active: 10,
  recovery: 26,
  hitbox: { x: 20, y: 0, w: 26, h: 80 },
  damage: 90,
  chip: 9,
  hitstun: 24,
  blockstun: 14,
  hitstop: 8,
  pushback: 3,
  guard: 'mid',
  launcher: true,
  knockdown: true,
}

// She steps into a portal and out behind the opponent (LK), or at the far
// wall beyond them (HK).
const thinPlace: MoveData = {
  startup: 12,
  active: 1,
  recovery: 24,
  hitbox: NO_HITBOX,
  damage: 0,
  hitstun: 0,
  blockstun: 0,
  hitstop: 0,
  pushback: 0,
  guard: 'mid',
  teleport: { frame: 12, to: 'behind' },
}

// A command grab: she folds the victim onto an altar slab and brings the
// prayer book down. Against the Siblings the renderer plays the fling.
const lastRites: MoveData = {
  startup: 6,
  active: 3,
  recovery: 30,
  hitbox: { x: 0, y: 0, w: 28, h: HEIGHT },
  damage: 160,
  hitstun: 0,
  blockstun: 0,
  hitstop: 14,
  pushback: 0,
  guard: 'mid',
  grab: true,
  fling: true,
}

const vespers: MoveData = {
  startup: 18,
  active: 1,
  recovery: 26,
  hitbox: NO_HITBOX,
  damage: 0,
  hitstun: 0,
  blockstun: 0,
  hitstop: 0,
  pushback: 0,
  guard: 'mid',
  slowProjectiles: 180,
}

// A row of chanting nuns flickers in and a giant tentacle sweeps the floor
// of the full screen: low, so it is jumped.
const theChoir: MoveData = {
  startup: 20,
  active: 8,
  recovery: 36,
  hitbox: { x: 0, y: 0, w: 300, h: 16 },
  damage: 250,
  chip: 25,
  hitstun: 30,
  blockstun: 16,
  hitstop: 10,
  pushback: 6,
  guard: 'low',
  knockdown: true,
  meterCost: 1000,
  freeze: 30,
  invuln: { from: 1, to: 19, strike: true, projectile: true, throw: true },
}

// The Thing behind the Door: one vast eye and a mass of tentacles reach
// through and drag the victim halfway in before spitting them out.
const openTheDoor: MoveData = {
  startup: 2,
  active: 2,
  recovery: 54,
  hitbox: { x: 0, y: 0, w: 220, h: 110 },
  damage: 430,
  chip: 60,
  hitstun: 50,
  blockstun: 24,
  hitstop: 30,
  pushback: 20,
  guard: 'mid',
  knockdown: true,
  meterCost: 3000,
  freeze: 60,
  showdown: true,
  invuln: { from: 1, to: 8, strike: true, projectile: true, throw: true },
}

const specials: SpecialMove[] = [
  {
    id: 'benediction',
    motion: 'qcf',
    button: 'P',
    level: 'special',
    move: benediction,
    // HP is thrown higher, at the head.
    heavy: {
      projectile: { ...benediction.projectile!, spawn: { x: 22, y: 84 } },
    },
  },
  {
    id: 'reaching-tentacle',
    motion: 'dp',
    button: 'P',
    level: 'special',
    move: reachingTentacle,
    // LP at short range, HP at far range.
    heavy: { hitbox: { x: 90, y: 0, w: 26, h: 80 } },
  },
  {
    id: 'the-thin-place',
    motion: 'qcb',
    button: 'K',
    level: 'special',
    move: thinPlace,
    heavy: { teleport: { frame: 12, to: 'wall' } },
  },
  {
    id: 'last-rites',
    motion: '360',
    button: 'P',
    level: 'special',
    move: lastRites,
  },
  { id: 'vespers', motion: 'dd', button: 'P', level: 'special', move: vespers },
  {
    id: 'the-choir',
    motion: 'qcf2',
    button: 'P',
    level: 'super',
    move: theChoir,
  },
  {
    id: 'open-the-door',
    motion: 'qcb2',
    button: 'HP',
    level: 'super',
    move: openTheDoor,
  },
]

export const ABBESS: FighterData = {
  slug: 'the-abbess',
  name: 'The Abbess',
  health: 950,
  walkForward: Math.round(1.8 * SUB),
  walkBack: Math.round(1.5 * SUB),
  jumpVelocity: 9 * SUB,
  jumpForward: 3 * SUB,
  gravity: Math.round(0.5 * SUB),
  pushbox: { x: -15, y: 0, w: WIDTH, h: 54 },
  hurtStand: { x: -17, y: 0, w: WIDTH + 4, h: HEIGHT },
  hurtCrouch: { x: -17, y: 0, w: WIDTH + 4, h: 58 },
  hurtAir: { x: -15, y: 10, w: WIDTH, h: 74 },
  throwRange: 10,
  throwDamage: 120,
  moves: normals,
  chains: defaultChains(),
  specials,
  easy: {
    neutral: 'benediction',
    forward: 'reaching-tentacle',
    back: 'the-thin-place',
    down: 'vespers',
    up: 'last-rites',
    super: 'the-choir',
  },
  look: {
    body: '#7c5a3c',
    light: '#e7d3b0',
    dark: '#1c1917',
  },
}
