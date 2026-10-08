// /utils/zuzuShowdown/fighters/zuzu.ts
//
// Zuzu, the koala ronin (conductor zuzu-showdown t-014, from fighters.yaml).
// Short and stocky, the shortest adult on the roster: an all-rounder with a
// quick-draw iai, a rising cut, a boomerang kasa, a parry stance behind the
// poncho and a diving cut. Lv1 Thousand-Mile Step dashes through the
// opponent; Lv3 Hat to the Dead is the Showdown super.
//
// Numbers are starting values; the balance pass (t-024) tunes them, and any
// change is mirrored into fighters.yaml in the same conductor PR.

import {
  SUB,
  type Box,
  type FighterData,
  type MoveData,
  type NormalId,
  type SpecialMove,
} from '../types'
import { defaultChains, defaultNormals } from './placeholders'

const HEIGHT = 72
const WIDTH = 30
const NO_HITBOX = { x: 0, y: 0, w: 0, h: 0 }

const normals = defaultNormals(HEIGHT)
// The punches draw the katana, so they reach further than his stubby kicks.
normals.stand_hp = {
  ...normals.stand_hp,
  startup: 9,
  hitbox: { x: 6, y: 34, w: 46, h: 14 },
  damage: 75,
}
normals.crouch_hp = {
  ...normals.crouch_hp,
  hitbox: { x: 2, y: 28, w: 28, h: 50 },
}
normals.jump_hp = {
  ...normals.jump_hp,
  hitbox: { x: 4, y: 4, w: 50, h: 24 },
  damage: 80,
}
normals.stand_hk = {
  ...normals.stand_hk,
  hitbox: { x: 6, y: 20, w: 30, h: 14 },
  damage: 75,
}
// Hitboxes authored against the rig art (conductor zuzu-showdown t-010): each sits where the fist,
// foot or blade is drawn on the move's active frames, and never reaches past it
// (verifyZuzuShowdownSprites checks every one against the shipped frame maps).
// His kicks are stubby: they reach no further than his short legs do.
const ART_HITBOXES: Partial<Record<NormalId, Box>> = {
  stand_lp: { x: 8, y: 34, w: 18, h: 10 },
  stand_lk: { x: 6, y: 18, w: 24, h: 12 },
  crouch_lk: { x: 6, y: 0, w: 24, h: 10 },
  crouch_hk: { x: 6, y: 0, w: 30, h: 10 },
  jump_lp: { x: 4, y: 30, w: 22, h: 14 },
  jump_hk: { x: 2, y: 0, w: 32, h: 16 },
}
for (const [id, hitbox] of Object.entries(ART_HITBOXES) as Array<
  [NormalId, Box]
>)
  normals[id] = { ...normals[id], hitbox }

const iaiFlash: MoveData = {
  startup: 6,
  active: 3,
  recovery: 14,
  hitbox: { x: 4, y: 32, w: 52, h: 12 },
  damage: 90,
  chip: 9,
  hitstun: 18,
  blockstun: 14,
  hitstop: 10,
  pushback: 10,
  guard: 'mid',
  cancel: 'super',
  velocity: { from: 2, to: 7, x: 6 * SUB },
}

const fallingLeaf: MoveData = {
  startup: 4,
  active: 8,
  recovery: 20,
  hitbox: { x: 0, y: 30, w: 24, h: 50 },
  damage: 90,
  chip: 9,
  hitstun: 20,
  blockstun: 16,
  hitstop: 12,
  pushback: 8,
  guard: 'mid',
  knockdown: true,
  cancel: 'super',
  velocity: { from: 3, to: 10, x: 2 * SUB, y: 7 * SUB },
}

const kasaToss: MoveData = {
  startup: 13,
  active: 1,
  recovery: 20,
  hitbox: NO_HITBOX,
  damage: 50,
  chip: 5,
  hitstun: 16,
  blockstun: 12,
  hitstop: 8,
  pushback: 8,
  guard: 'mid',
  projectile: {
    spawnFrame: 13,
    spawn: { x: 18, y: 56 },
    box: { x: -12, y: -4, w: 24, h: 8 },
    speed: 4 * SUB,
    life: 160,
    returnAfter: 40,
  },
}

const ponchoVeil: MoveData = {
  startup: 30,
  active: 1,
  recovery: 12,
  hitbox: NO_HITBOX,
  damage: 0,
  hitstun: 0,
  blockstun: 0,
  hitstop: 0,
  pushback: 0,
  guard: 'mid',
  parry: { from: 2, to: 16, damage: 100 },
}

const descendingCut: MoveData = {
  startup: 6,
  active: 20,
  recovery: 6,
  hitbox: { x: 0, y: 6, w: 42, h: 20 },
  damage: 80,
  chip: 8,
  hitstun: 18,
  blockstun: 14,
  hitstop: 10,
  pushback: 8,
  guard: 'high',
  velocity: { from: 4, to: 30, x: 4 * SUB, y: -7 * SUB },
}

const thousandMileStep: MoveData = {
  startup: 4,
  active: 12,
  recovery: 26,
  hitbox: { x: -10, y: 0, w: 40, h: HEIGHT },
  damage: 280,
  chip: 28,
  hitstun: 34,
  blockstun: 20,
  hitstop: 18,
  pushback: 6,
  guard: 'mid',
  knockdown: true,
  meterCost: 1000,
  freeze: 30,
  invuln: { from: 1, to: 12, strike: true, projectile: true, throw: true },
  velocity: { from: 3, to: 15, x: 11 * SUB },
  passThrough: { from: 3, to: 16 },
}

const hatToTheDead: MoveData = {
  startup: 2,
  active: 3,
  recovery: 50,
  hitbox: { x: 0, y: 0, w: 220, h: 90 },
  damage: 420,
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
  invuln: { from: 1, to: 6, strike: true, projectile: true, throw: true },
}

const specials: SpecialMove[] = [
  {
    id: 'iai-flash',
    motion: 'qcf',
    button: 'P',
    level: 'special',
    move: iaiFlash,
    // HP crosses half the screen, hits harder, and is punishable on block.
    heavy: {
      startup: 9,
      active: 4,
      recovery: 24,
      damage: 120,
      chip: 12,
      blockstun: 12,
      knockdown: true,
      velocity: { from: 3, to: 14, x: 10 * SUB },
    },
  },
  {
    id: 'falling-leaf',
    motion: 'dp',
    button: 'P',
    level: 'special',
    move: fallingLeaf,
    // The HP version is the invincible reversal.
    heavy: {
      damage: 110,
      chip: 11,
      invuln: { from: 1, to: 6, strike: true, throw: true },
      velocity: { from: 3, to: 12, x: 2 * SUB, y: 9 * SUB },
    },
  },
  {
    id: 'kasa-toss',
    motion: 'qcb',
    button: 'P',
    level: 'special',
    move: kasaToss,
    heavy: {
      projectile: {
        ...kasaToss.projectile!,
        speed: 5 * SUB,
        returnAfter: 50,
      },
    },
  },
  {
    id: 'poncho-veil',
    motion: 'qcb',
    button: 'K',
    level: 'special',
    move: ponchoVeil,
  },
  {
    id: 'descending-cut',
    motion: 'qcf',
    button: 'P',
    level: 'special',
    air: true,
    move: descendingCut,
  },
  {
    id: 'thousand-mile-step',
    motion: 'qcf2',
    button: 'P',
    level: 'super',
    move: thousandMileStep,
  },
  {
    id: 'hat-to-the-dead',
    motion: 'qcb2',
    button: 'HP',
    level: 'super',
    move: hatToTheDead,
  },
]

export const ZUZU: FighterData = {
  slug: 'zuzu',
  name: 'Zuzu',
  health: 1000,
  walkForward: 2 * SUB,
  walkBack: Math.round(1.5 * SUB),
  jumpVelocity: 9 * SUB,
  jumpForward: 3 * SUB,
  gravity: Math.round(0.5 * SUB),
  pushbox: { x: -15, y: 0, w: WIDTH, h: 44 },
  hurtStand: { x: -17, y: 0, w: WIDTH + 4, h: HEIGHT },
  hurtCrouch: { x: -17, y: 0, w: WIDTH + 4, h: 46 },
  hurtAir: { x: -15, y: 8, w: WIDTH, h: 56 },
  throwRange: 10,
  throwDamage: 120,
  moves: normals,
  chains: defaultChains(),
  specials,
  easy: {
    neutral: 'kasa-toss',
    forward: 'iai-flash',
    back: 'poncho-veil',
    down: 'falling-leaf',
    up: 'descending-cut',
    super: 'thousand-mile-step',
  },
  look: { body: '#9a3412', light: '#d6d3d1', dark: '#431407', hat: 'kasa' },
}
