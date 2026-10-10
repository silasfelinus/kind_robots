// /utils/zuzuShowdown/fighters/river-croc.ts
//
// River Croc (conductor zuzu-showdown t-016, from fighters.yaml): the thing
// in the water, a giant grappler. He fights low and long on all fours, his
// heavy normals soak a light hit (super armor), and nobody throws him out of
// a jump (the engine has no air throws, and command grabs only take a fighter
// on the ground). Death Roll is the 360 command grab; Submerge sinks him into
// shadow-water that only a low can touch, and any punch from there Erupts;
// Bellow pushes the opponent back and freezes their red health. His grabs and
// supers are `fling` moves: against the Siblings they play the thrown-clear
// variant (fighters.yaml fling_vs_siblings).
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

const HEIGHT = 84
const WIDTH = 70
const NO_HITBOX = { x: 0, y: 0, w: 0, h: 0 }

// LP is a snap, HP the big jaw lunge; kicks are tail and claw swipes. Every
// heavy is slower and soaks one light hit.
const normals = defaultNormals(HEIGHT)
// He is long: everything reaches out past his snout. Each box is fitted to his
// rig's art (conductor tools/rigs/croc.py), so it reaches where the jaws or
// claws are drawn on its active frames.
const fit = (id: NormalId, hitbox: MoveData['hitbox']) => {
  normals[id] = { ...normals[id], hitbox }
}
fit('stand_lp', { x: 24, y: 38, w: 29, h: 14 })
fit('stand_hp', { x: 26, y: 38, w: 34, h: 18 })
fit('stand_lk', { x: 22, y: 16, w: 25, h: 12 })
fit('stand_hk', { x: 22, y: 24, w: 28, h: 10 })
fit('crouch_lp', { x: 22, y: 33, w: 29, h: 10 })
fit('crouch_lk', { x: 22, y: 0, w: 27, h: 10 })
fit('crouch_hp', { x: 8, y: 43, w: 27, h: 42 })
fit('crouch_hk', { x: 24, y: 0, w: 29, h: 10 })
fit('jump_lp', { x: 22, y: 35, w: 31, h: 14 })
fit('jump_hp', { x: 18, y: 26, w: 33, h: 20 })
fit('jump_lk', { x: 16, y: 6, w: 29, h: 14 })
fit('jump_hk', { x: 20, y: 8, w: 29, h: 16 })
const HEAVIES: NormalId[] = ['stand_hp', 'stand_hk', 'crouch_hp', 'crouch_hk']
for (const id of HEAVIES) {
  const move = normals[id]
  const startup = move.startup + 2
  normals[id] = {
    ...move,
    startup,
    armor: { from: 1, to: startup + move.active - 1, hits: 1, lightOnly: true },
  }
}

// The command grab: jaws clamp, he rolls three times and hurls them away.
const deathRoll: MoveData = {
  startup: 4,
  active: 2,
  recovery: 30,
  hitbox: { x: 20, y: 0, w: 36, h: 80 },
  damage: 200,
  hitstun: 0,
  blockstun: 0,
  hitstop: 10,
  pushback: 0,
  guard: 'mid',
  grab: true,
  fling: true,
}

// He sinks into a puddle of shadow-water that slides along the floor (LK slow,
// HK fast). Only his eyes and ridge show: strikes, shots and throws pass over,
// but a low hits him. Any punch from there Erupts.
const submerge: MoveData = {
  startup: 10,
  active: 1,
  recovery: 50,
  hitbox: NO_HITBOX,
  damage: 0,
  hitstun: 0,
  blockstun: 0,
  hitstop: 0,
  pushback: 0,
  guard: 'mid',
  hurtbox: { x: -30, y: 0, w: 60, h: 12 },
  invuln: {
    from: 10,
    to: 60,
    strike: true,
    projectile: true,
    throw: true,
    exceptLow: true,
  },
  velocity: { from: 10, to: 58, x: Math.round(1.5 * SUB) },
  followUp: { buttons: ['lp', 'hp'], move: 'erupt' },
}

// He bursts straight up out of the water, jaws first: a launcher.
const erupt: MoveData = {
  startup: 3,
  active: 6,
  recovery: 26,
  hitbox: { x: 0, y: 10, w: 48, h: 90 },
  damage: 140,
  chip: 14,
  hitstun: 30,
  blockstun: 16,
  hitstop: 10,
  pushback: 4,
  guard: 'mid',
  launcher: true,
  invuln: { from: 1, to: 4, strike: true, projectile: true },
}

// A full-length tail sweep that hits low; HK is slower and knocks down.
const tailSweep: MoveData = {
  startup: 9,
  active: 5,
  recovery: 18,
  hitbox: { x: -30, y: 0, w: 104, h: 16 },
  damage: 100,
  chip: 8,
  hitstun: 18,
  blockstun: 12,
  hitstop: 8,
  pushback: 8,
  guard: 'low',
}

// A roar: no damage, but it pushes them back half a screen and their red
// health stops regenerating for five seconds.
const bellow: MoveData = {
  startup: 18,
  active: 6,
  recovery: 24,
  hitbox: { x: 10, y: 0, w: 200, h: 120 },
  damage: 0,
  hitstun: 10,
  blockstun: 10,
  hitstop: 4,
  pushback: 120,
  guard: 'mid',
  freezeRed: 300,
}

// A huge lunging bite; he gulps, makes a face, and spits them back out.
const swallow: MoveData = {
  startup: 5,
  active: 4,
  recovery: 40,
  hitbox: { x: 16, y: 0, w: 70, h: 90 },
  damage: 300,
  hitstun: 0,
  blockstun: 0,
  hitstop: 12,
  pushback: 0,
  guard: 'mid',
  grab: true,
  fling: true,
  meterCost: 1000,
  freeze: 30,
  invuln: { from: 1, to: 5, strike: true, projectile: true },
}

// The stage floods; he vanishes, erupts beneath the opponent where they
// stood, and Death Rolls them in a tower of spray.
const wateringHole: MoveData = {
  startup: 30,
  active: 6,
  recovery: 40,
  hitbox: { x: -24, y: 0, w: 48, h: 100 },
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
    id: 'death-roll',
    motion: '360',
    button: 'P',
    level: 'special',
    move: deathRoll,
  },
  {
    id: 'submerge',
    motion: 'dd',
    button: 'K',
    level: 'special',
    move: submerge,
    heavy: { velocity: { from: 10, to: 58, x: Math.round(3.5 * SUB) } },
  },
  {
    id: 'erupt',
    motion: 'dd',
    button: 'P',
    level: 'special',
    move: erupt,
    followUp: true,
  },
  {
    id: 'tail-sweep',
    motion: 'qcb',
    button: 'K',
    level: 'special',
    move: tailSweep,
    heavy: { startup: 13, knockdown: true },
  },
  {
    id: 'bellow',
    motion: 'chargeBF',
    button: 'P',
    level: 'special',
    move: bellow,
  },
  {
    id: 'swallow',
    motion: '720',
    button: 'P',
    level: 'super',
    move: swallow,
  },
  {
    id: 'the-watering-hole',
    motion: 'qcb2',
    button: 'HP',
    level: 'super',
    move: wateringHole,
  },
]

export const RIVER_CROC: FighterData = {
  slug: 'river-croc',
  name: 'River Croc',
  health: 1100,
  walkForward: Math.round(1.1 * SUB),
  walkBack: SUB,
  jumpVelocity: 7 * SUB,
  jumpForward: 2 * SUB,
  gravity: Math.round(0.55 * SUB),
  pushbox: { x: -35, y: 0, w: WIDTH, h: 50 },
  hurtStand: { x: -38, y: 0, w: WIDTH + 6, h: HEIGHT },
  hurtCrouch: { x: -38, y: 0, w: WIDTH + 6, h: 56 },
  hurtAir: { x: -35, y: 10, w: WIDTH, h: 60 },
  throwRange: 14,
  throwDamage: 140,
  moves: normals,
  chains: defaultChains(),
  specials,
  // Easy Specials: the 720 Swallow is QCF QCF+P (fighters.yaml).
  easy: {
    neutral: 'bellow',
    forward: 'tail-sweep',
    back: 'submerge',
    down: 'death-roll',
    super: 'swallow',
  },
  look: {
    body: '#3f4a2c',
    light: '#8a9a5b',
    dark: '#1a1f12',
  },
}
