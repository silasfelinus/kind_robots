// /utils/zuzuShowdown/fighters/hyena-matriarch.ts
//
// The Hyena Matriarch (conductor zuzu-showdown t-017, from fighters.yaml):
// queen of the Bone Yard, mid-range footsies with a chain and hook. Hook Lash
// reaches far, and on a hit QCF+P again Drags the hooked opponent to her feet
// for more; her cackles build a third of a bar while she stands wide open;
// Scavenger's Rush lopes in under high strikes; Bone Crusher is the command
// grab.
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

const HEIGHT = 104
const WIDTH = 34
const NO_HITBOX = { x: 0, y: 0, w: 0, h: 0 }

// LP is a backhand; HP a chain-wrapped fist with a little more reach.
const normals = defaultNormals(HEIGHT)
normals.stand_hp = {
  ...normals.stand_hp,
  hitbox: { x: 8, y: 56, w: 40, h: 16 },
}

// The chain and hook lash out straight (LP) or rising at an angle (HP). On a
// hit, QCF+P again Drags them in.
const hookLash: MoveData = {
  startup: 12,
  active: 4,
  recovery: 22,
  hitbox: { x: 20, y: 50, w: 96, h: 14 },
  damage: 80,
  chip: 8,
  hitstun: 24,
  blockstun: 12,
  hitstop: 8,
  pushback: 4,
  guard: 'mid',
  followUp: { buttons: ['lp', 'hp'], move: 'drag', onHit: true, motion: true },
}

// She yanks the hooked opponent to her feet for a follow-up.
const drag: MoveData = {
  startup: 3,
  active: 3,
  recovery: 18,
  hitbox: { x: 0, y: 0, w: 140, h: 110 },
  damage: 70,
  hitstun: 30,
  blockstun: 0,
  hitstop: 10,
  pushback: 0,
  guard: 'mid',
  pull: 4,
}

// She throws her head back and laughs: a third of a bar, wide open throughout.
const cackle: MoveData = {
  startup: 20,
  active: 30,
  recovery: 20,
  hitbox: NO_HITBOX,
  damage: 0,
  hitstun: 0,
  blockstun: 0,
  hitstop: 0,
  pushback: 0,
  guard: 'mid',
  meterGain: 333,
}

// A low, loping charge that ends in a snapping bite: under high strikes.
const scavengersRush: MoveData = {
  startup: 6,
  active: 18,
  recovery: 16,
  hitbox: { x: 10, y: 0, w: 36, h: 40 },
  damage: 45,
  chip: 4,
  hitstun: 16,
  blockstun: 10,
  hitstop: 6,
  pushback: 6,
  guard: 'mid',
  hits: 2,
  rehit: 10,
  velocity: { from: 1, to: 20, x: 5 * SUB },
  hurtbox: { x: -18, y: 0, w: WIDTH + 2, h: 50 },
}

// The command grab: she bites the shoulder and shakes.
const boneCrusher: MoveData = {
  startup: 5,
  active: 2,
  recovery: 30,
  hitbox: { x: 16, y: 0, w: 30, h: 90 },
  damage: 150,
  hitstun: 0,
  blockstun: 0,
  hitstop: 10,
  pushback: 0,
  guard: 'mid',
  grab: true,
}

// The chain whirls overhead in a wide circle that hits on both sides, then
// smashes down: three hits.
const chainGang: MoveData = {
  startup: 8,
  active: 30,
  recovery: 30,
  hitbox: { x: -70, y: 0, w: 140, h: 110 },
  damage: 90,
  chip: 9,
  hitstun: 22,
  blockstun: 14,
  hitstop: 8,
  pushback: 4,
  guard: 'mid',
  hits: 3,
  rehit: 10,
  meterCost: 1000,
  freeze: 30,
  invuln: { from: 1, to: 8, strike: true, projectile: true, throw: true },
}

// The pack's cackling swells from every side and chains snap tight: six hits.
const lastLaugh: MoveData = {
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
    id: 'hook-lash',
    motion: 'qcf',
    button: 'P',
    level: 'special',
    move: hookLash,
    heavy: { hitbox: { x: 16, y: 70, w: 80, h: 40 } },
  },
  {
    id: 'drag',
    motion: 'qcf',
    button: 'P',
    level: 'special',
    move: drag,
    followUp: true,
  },
  {
    id: 'cackle',
    motion: 'dd',
    button: 'K',
    level: 'special',
    move: cackle,
  },
  {
    id: 'scavengers-rush',
    motion: 'qcb',
    button: 'K',
    level: 'special',
    move: scavengersRush,
  },
  {
    id: 'bone-crusher',
    motion: 'hcb',
    button: 'P',
    level: 'special',
    move: boneCrusher,
  },
  {
    id: 'chain-gang',
    motion: 'qcf2',
    button: 'P',
    level: 'super',
    move: chainGang,
  },
  {
    id: 'last-laugh',
    motion: 'qcb2',
    button: 'HP',
    level: 'super',
    move: lastLaugh,
  },
]

export const HYENA_MATRIARCH: FighterData = {
  slug: 'hyena-matriarch',
  name: 'The Hyena Matriarch',
  health: 1000,
  walkForward: 2 * SUB,
  walkBack: Math.round(1.6 * SUB),
  jumpVelocity: 9 * SUB,
  jumpForward: 3 * SUB,
  gravity: Math.round(0.5 * SUB),
  pushbox: { x: -17, y: 0, w: WIDTH, h: 58 },
  hurtStand: { x: -19, y: 0, w: WIDTH + 4, h: HEIGHT },
  hurtCrouch: { x: -19, y: 0, w: WIDTH + 4, h: 64 },
  hurtAir: { x: -17, y: 10, w: WIDTH, h: 80 },
  throwRange: 10,
  throwDamage: 120,
  moves: normals,
  chains: defaultChains(),
  specials,
  easy: {
    neutral: 'hook-lash',
    forward: 'scavengers-rush',
    back: 'cackle',
    down: 'bone-crusher',
    super: 'chain-gang',
  },
  look: {
    body: '#a07a4c',
    light: '#d9b98a',
    dark: '#3d2b1a',
  },
}
