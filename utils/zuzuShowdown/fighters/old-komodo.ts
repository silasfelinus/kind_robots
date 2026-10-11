// /utils/zuzuShowdown/fighters/old-komodo.ts
//
// Old Komodo (conductor zuzu-showdown t-017, from fighters.yaml): the thing
// under the sand, a slow armored tank with a staff. Every heavy attack soaks a
// hit (super armor); his bites poison (3 health a second for 6 seconds, all of
// it red, recoverable health); Sand Burrow sinks him, strike-invulnerable,
// resurfacing where he went down (LK) or under the opponent (HK), and any punch
// from the sand Rises from the Dune; Tongue Taste grabs at range. Venom Bite
// and Feeding Time fling the Siblings (fighters.yaml fling_vs_siblings).
//
// Starting values; the balance pass (t-024) tunes them, mirrored into
// fighters.yaml in the same conductor PR.

import {
  SUB,
  type FighterData,
  type MoveData,
  type NormalId,
  type SpecialMove,
} from '../types'
import { defaultChains, defaultNormals } from './placeholders'

const HEIGHT = 120
const WIDTH = 46
const NO_HITBOX = { x: 0, y: 0, w: 0, h: 0 }

/** 3 health a second for 6 seconds, as red health (sim tickLife). */
const VENOM = { frames: 360, every: 20 }

// LP is a staff jab, HP an overhead staff smash. Every heavy is slower and
// soaks one hit, light or heavy.
const normals = defaultNormals(HEIGHT)
// Each box is fitted to his rig's art (conductor tools/rigs/komodo.py), so it
// reaches where the staff or claws are drawn on its active frames.
const fit = (id: NormalId, hitbox: MoveData['hitbox']) => {
  normals[id] = { ...normals[id], hitbox }
}
fit('stand_lp', { x: 8, y: 72, w: 34, h: 10 })
fit('stand_hp', { x: 10, y: 50, w: 35, h: 32 })
fit('stand_lk', { x: 6, y: 30, w: 44, h: 12 })
fit('crouch_lp', { x: 8, y: 42, w: 33, h: 10 })
fit('crouch_lk', { x: 6, y: 0, w: 47, h: 10 })
fit('crouch_hp', { x: 2, y: 40, w: 24, h: 56 })
fit('jump_lp', { x: 4, y: 40, w: 38, h: 14 })
fit('jump_hp', { x: 4, y: 24, w: 22, h: 20 })
fit('jump_lk', { x: -6, y: 23, w: 55, h: 14 })
fit('jump_hk', { x: 2, y: 19, w: 49, h: 16 })
const HEAVIES: NormalId[] = [
  'stand_hp',
  'stand_hk',
  'crouch_hp',
  'crouch_hk',
  'jump_hp',
  'jump_hk',
]
for (const id of HEAVIES) {
  const move = normals[id]
  const startup = move.startup + 3
  normals[id] = {
    ...move,
    startup,
    armor: { from: 1, to: startup + move.active - 1, hits: 1 },
  }
}

// A lunging bite that poisons.
const venomBite: MoveData = {
  startup: 12,
  active: 4,
  recovery: 24,
  hitbox: { x: 16, y: 60, w: 44, h: 24 },
  damage: 60,
  chip: 6,
  hitstun: 18,
  blockstun: 12,
  hitstop: 8,
  pushback: 6,
  guard: 'mid',
  poison: VENOM,
  fling: true,
  velocity: { from: 4, to: 14, x: 3 * SUB },
}

// He sinks into the sand, strike-invulnerable: LK resurfaces where he went
// down, HK under the opponent. Any punch from the sand Rises from the Dune.
const sandBurrow: MoveData = {
  startup: 16,
  active: 1,
  recovery: 50,
  hitbox: NO_HITBOX,
  damage: 0,
  hitstun: 0,
  blockstun: 0,
  hitstop: 0,
  pushback: 0,
  guard: 'mid',
  hurtbox: { x: -20, y: 0, w: 40, h: 4 },
  invuln: { from: 10, to: 66, strike: true, projectile: true, throw: true },
  followUp: { buttons: ['lp', 'hp'], move: 'rise-from-the-dune' },
}

// He erupts from below, mouth open, and launches.
const riseFromTheDune: MoveData = {
  startup: 4,
  active: 6,
  recovery: 28,
  hitbox: { x: -10, y: 0, w: 50, h: 110 },
  damage: 130,
  chip: 13,
  hitstun: 30,
  blockstun: 16,
  hitstop: 10,
  pushback: 4,
  guard: 'mid',
  launcher: true,
  invuln: { from: 1, to: 4, strike: true, projectile: true },
}

// A long forked-tongue lash that grabs at range and pulls them into a smash.
const tongueTaste: MoveData = {
  startup: 12,
  active: 4,
  recovery: 24,
  hitbox: { x: 20, y: 50, w: 120, h: 20 },
  damage: 40,
  hitstun: 0,
  blockstun: 0,
  hitstop: 8,
  pushback: 0,
  guard: 'mid',
  grab: true,
  grabStun: 28,
}

// A rising staff swing: slow, but armored, the anti-air.
const oldStaff: MoveData = {
  startup: 9,
  active: 8,
  recovery: 26,
  hitbox: { x: 0, y: 50, w: 50, h: 90 },
  damage: 110,
  chip: 11,
  hitstun: 24,
  blockstun: 14,
  hitstop: 10,
  pushback: 6,
  guard: 'mid',
  knockdown: true,
  armor: { from: 1, to: 16, hits: 1 },
}

// A walking chain of three armored bites that each poison; a light hit can't
// stop him.
const slowHunger: MoveData = {
  startup: 8,
  active: 48,
  recovery: 30,
  hitbox: { x: 16, y: 40, w: 44, h: 40 },
  damage: 87,
  chip: 8,
  hitstun: 20,
  blockstun: 12,
  hitstop: 8,
  pushback: 2,
  guard: 'mid',
  hits: 3,
  rehit: 16,
  poison: VENOM,
  armor: { from: 1, to: 56, hits: 3, lightOnly: true },
  velocity: { from: 8, to: 55, x: Math.round(1.5 * SUB) },
  meterCost: 1000,
  freeze: 30,
}

// The dune swallows them; he rises beneath them where they stood, gulps them
// down, chews, and spits them out covered in sand.
const feedingTime: MoveData = {
  startup: 30,
  active: 6,
  recovery: 40,
  hitbox: { x: -24, y: 0, w: 48, h: 110 },
  damage: 450,
  hitstun: 0,
  blockstun: 0,
  hitstop: 14,
  pushback: 0,
  guard: 'mid',
  grab: true,
  fling: true,
  strikeAt: 'opponent',
  meterCost: 3000,
  freeze: 60,
  showdown: true,
  invuln: { from: 1, to: 36, strike: true, projectile: true, throw: true },
}

const specials: SpecialMove[] = [
  {
    id: 'venom-bite',
    motion: 'qcf',
    button: 'P',
    level: 'special',
    move: venomBite,
  },
  {
    id: 'sand-burrow',
    motion: 'dd',
    button: 'K',
    level: 'special',
    move: sandBurrow,
    heavy: { teleport: { frame: 30, to: 'under' } },
  },
  {
    id: 'rise-from-the-dune',
    motion: 'dd',
    button: 'P',
    level: 'special',
    move: riseFromTheDune,
    followUp: true,
  },
  {
    id: 'tongue-taste',
    motion: 'qcb',
    button: 'P',
    level: 'special',
    move: tongueTaste,
  },
  {
    id: 'old-staff',
    motion: 'dp',
    button: 'P',
    level: 'special',
    move: oldStaff,
  },
  {
    id: 'slow-hunger',
    motion: 'qcf2',
    button: 'P',
    level: 'super',
    move: slowHunger,
  },
  {
    id: 'feeding-time',
    motion: 'qcb2',
    button: 'HP',
    level: 'super',
    move: feedingTime,
  },
]

export const OLD_KOMODO: FighterData = {
  slug: 'old-komodo',
  name: 'Old Komodo',
  health: 1150,
  walkForward: Math.round(1.1 * SUB),
  walkBack: SUB,
  jumpVelocity: 8 * SUB,
  jumpForward: 2 * SUB,
  gravity: Math.round(0.55 * SUB),
  pushbox: { x: -23, y: 0, w: WIDTH, h: 64 },
  hurtStand: { x: -25, y: 0, w: WIDTH + 4, h: HEIGHT },
  hurtCrouch: { x: -25, y: 0, w: WIDTH + 4, h: 74 },
  hurtAir: { x: -23, y: 10, w: WIDTH, h: 90 },
  throwRange: 12,
  throwDamage: 140,
  moves: normals,
  chains: defaultChains(),
  specials,
  easy: {
    neutral: 'venom-bite',
    forward: 'tongue-taste',
    back: 'sand-burrow',
    up: 'old-staff',
    super: 'slow-hunger',
  },
  look: {
    body: '#6b6253',
    light: '#a89f8a',
    dark: '#2a251d',
  },
}
