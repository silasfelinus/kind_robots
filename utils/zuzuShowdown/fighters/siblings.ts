// /utils/zuzuShowdown/fighters/siblings.ts
//
// The Siblings (conductor zuzu-showdown t-015, from fighters.yaml): a gaunt
// fennec fox sister and her toddler brother. Small, fast rushdown plus
// the toddler's apples. The toddler is a puppet driven by the sim, never a
// hurtbox: the hurtboxes below are the sister's alone, and a KO is her
// scooping him up and fleeing, never a death. `childGuard` makes the
// opposing `fling` moves play the thrown-clear variant.
//
// Apples are the toddler's ammo: he carries three, and the Lone Apple Tree
// regrows one every few seconds (`ammoRegen`).
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

const HEIGHT = 84
const WIDTH = 28
const NO_HITBOX = { x: 0, y: 0, w: 0, h: 0 }

// Kicks are fast and scrappy; punches are claw swipes and shoves.
const normals = defaultNormals(HEIGHT)
// She is small and her reach is short (t-011: the boxes follow her art, as
// t-010 did for Zuzu and the Coyote).
const reach: Partial<Record<keyof typeof normals, MoveData['hitbox']>> = {
  stand_hk: { x: 6, y: 26, w: 30, h: 10 },
  crouch_hp: { x: 2, y: 40, w: 18, h: 36 },
  crouch_hk: { x: 6, y: 0, w: 34, h: 10 },
  jump_lp: { x: 2, y: 18, w: 16, h: 14 },
  jump_hp: { x: 4, y: 14, w: 22, h: 18 },
  jump_hk: { x: 2, y: 8, w: 34, h: 16 },
}
for (const [id, hitbox] of Object.entries(reach)) {
  const key = id as keyof typeof normals
  normals[key] = { ...normals[key], hitbox: hitbox! }
}

const appleToss: MoveData = {
  startup: 16,
  active: 1,
  recovery: 20,
  hitbox: NO_HITBOX,
  damage: 45,
  chip: 4,
  hitstun: 16,
  blockstun: 10,
  hitstop: 5,
  pushback: 4,
  guard: 'mid',
  ammoCost: 1,
  projectile: {
    spawnFrame: 16,
    spawn: { x: 12, y: 70 },
    box: { x: -5, y: -5, w: 10, h: 10 },
    speed: 5 * SUB,
    life: 50,
  },
}

// A leaping snap upward: the anti-air. HK is invulnerable on startup.
const baredTeeth: MoveData = {
  startup: 5,
  active: 8,
  recovery: 24,
  hitbox: { x: 2, y: 56, w: 28, h: 44 },
  damage: 90,
  chip: 9,
  hitstun: 22,
  blockstun: 12,
  hitstop: 8,
  pushback: 3,
  guard: 'mid',
  knockdown: true,
}

// She hears it coming, slips under any strike and answers with a low
// scratch. A grab catches her.
const bigEars: MoveData = {
  startup: 30,
  active: 1,
  recovery: 12,
  hitbox: NO_HITBOX,
  damage: 0,
  hitstun: 0,
  blockstun: 0,
  hitstop: 0,
  pushback: 0,
  guard: 'low',
  parry: { from: 3, to: 24, damage: 70 },
}

// She turns her back and wraps around her brother: absorbs one hit at half
// damage and builds meter from it.
const shieldHim: MoveData = {
  startup: 6,
  active: 1,
  recovery: 30,
  hitbox: NO_HITBOX,
  damage: 0,
  hitstun: 0,
  blockstun: 0,
  hitstop: 0,
  pushback: 0,
  guard: 'mid',
  armor: { from: 2, to: 34, hits: 1, damagePercent: 50, meter: 200 },
}

// A low skidding slide ending in a scrappy two-hit claw; under projectiles.
const scramble: MoveData = {
  startup: 8,
  active: 12,
  recovery: 18,
  hitbox: { x: 4, y: 0, w: 36, h: 22 },
  damage: 30,
  chip: 3,
  hitstun: 16,
  blockstun: 10,
  hitstop: 5,
  pushback: 3,
  guard: 'low',
  hits: 2,
  rehit: 6,
  velocity: { from: 5, to: 18, x: 5 * SUB },
  invuln: { from: 1, to: 12, projectile: true },
}

// The toddler climbs on her shoulders and hurls apples in a rapid arc across
// half the screen, giggling: five hits.
const rainOfApples: MoveData = {
  startup: 12,
  active: 24,
  recovery: 30,
  hitbox: { x: 10, y: 30, w: 160, h: 70 },
  damage: 48,
  chip: 5,
  hitstun: 24,
  blockstun: 14,
  hitstop: 6,
  pushback: 4,
  guard: 'mid',
  hits: 5,
  rehit: 4,
  meterCost: 1000,
  freeze: 30,
  invuln: { from: 1, to: 11, strike: true, projectile: true, throw: true },
}

// Eye-strip cutaway, then a blur of a lunge; the hit lands off-screen.
const loneSurvivor: MoveData = {
  startup: 2,
  active: 2,
  recovery: 54,
  hitbox: { x: 0, y: 0, w: 200, h: 110 },
  damage: 400,
  chip: 55,
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
    id: 'apple-toss',
    motion: 'qcf',
    button: 'P',
    level: 'special',
    move: appleToss,
    // LP is a short lob, HP a long one.
    heavy: {
      projectile: { ...appleToss.projectile!, speed: 8 * SUB, life: 70 },
    },
  },
  {
    id: 'bared-teeth',
    motion: 'dp',
    button: 'K',
    level: 'special',
    move: baredTeeth,
    heavy: { invuln: { from: 1, to: 5, strike: true, projectile: true } },
  },
  {
    id: 'big-ears',
    motion: 'qcb',
    button: 'K',
    level: 'special',
    move: bigEars,
  },
  {
    id: 'shield-him',
    motion: 'chargeDU',
    button: 'P',
    level: 'special',
    move: shieldHim,
  },
  {
    id: 'scramble',
    motion: 'qcf',
    button: 'K',
    level: 'special',
    move: scramble,
  },
  {
    id: 'rain-of-apples',
    motion: 'qcf2',
    button: 'P',
    level: 'super',
    move: rainOfApples,
  },
  {
    id: 'lone-survivor',
    motion: 'qcb2',
    button: 'HP',
    level: 'super',
    move: loneSurvivor,
  },
]

export const SIBLINGS: FighterData = {
  slug: 'the-siblings',
  name: 'The Siblings',
  health: 900,
  walkForward: Math.round(2.6 * SUB),
  walkBack: Math.round(2.1 * SUB),
  jumpVelocity: 9 * SUB,
  jumpForward: 3 * SUB,
  gravity: Math.round(0.5 * SUB),
  pushbox: { x: -14, y: 0, w: WIDTH, h: 52 },
  hurtStand: { x: -16, y: 0, w: WIDTH + 4, h: HEIGHT },
  hurtCrouch: { x: -16, y: 0, w: WIDTH + 4, h: 52 },
  hurtAir: { x: -14, y: 10, w: WIDTH, h: 66 },
  throwRange: 10,
  throwDamage: 110,
  moves: normals,
  chains: defaultChains(),
  specials,
  childGuard: true,
  ammo: 3,
  ammoRegen: 180,
  easy: {
    neutral: 'apple-toss',
    forward: 'scramble',
    back: 'big-ears',
    down: 'shield-him',
    up: 'bared-teeth',
    super: 'rain-of-apples',
  },
  look: {
    body: '#d6b98c',
    light: '#f3e6cc',
    dark: '#3b2f2a',
  },
}
