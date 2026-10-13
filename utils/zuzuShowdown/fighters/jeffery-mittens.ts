// /utils/zuzuShowdown/fighters/jeffery-mittens.ts
//
// Jeffery Mittens (conductor zuzu-showdown t-032, from fighters.yaml): the young raccoon who
// stripped boots from the dead of Hollow Bell for the barefoot kids hiding with him (the gamebook's
// Act II "Boots"), and who, spared, scouts for the jackals of the dry well. Small, quick and
// nervy: he throws the boots strung round his neck (four to a string, and he has to scavenge more),
// slides under you and out the other side, drops on you off a ledge, ties your laces together,
// and holds his little knife the way nobody who has used one holds it, until he has to. Lv1 Every
// Last Boot swings the whole string; Lv3 The Dry Well Pack is the Showdown super: one low whistle
// and the jackals come through.
//
// Starting values; the balance pass tunes them, mirrored into fighters.yaml in the same
// conductor PR. His rig: conductor projects/zuzu-showdown/tools/rigs/mittens.py.

import {
  SUB,
  type Box,
  type FighterData,
  type MoveData,
  type NormalId,
  type SpecialMove,
} from '../types'
import { defaultChains, defaultNormals } from './placeholders'

const HEIGHT = 88
const WIDTH = 26
const NO_HITBOX = { x: 0, y: 0, w: 0, h: 0 }

// Short reach and light hits: LP is the knife held wrong, HK a scrappy boot to the shin.
const normals = defaultNormals(HEIGHT)
normals.stand_lp = { ...normals.stand_lp, damage: 28 }
normals.stand_hp = { ...normals.stand_hp, damage: 64 }
normals.stand_hk = { ...normals.stand_hk, damage: 74 }
// Hitboxes fitted to his rig's art (conductor tools/rigs/mittens.py): each sits where the knife, the
// shoving paw or the boot is drawn on the move's active frames and never reaches past it
// (verifyZuzuShowdownSprites holds every one to the shipped frame maps). His reach is short: HP is a
// two-pawed shove, and the crouching kicks are drawn skidding along the floor.
const ART_HITBOXES: Record<NormalId, Box> = {
  stand_lp: { x: 12, y: 56, w: 23, h: 24 },
  stand_lk: { x: 3, y: 23, w: 38, h: 24 },
  stand_hp: { x: 10, y: 53, w: 18, h: 22 },
  stand_hk: { x: 9, y: 36, w: 37, h: 24 },
  crouch_lp: { x: 12, y: 40, w: 23, h: 24 },
  crouch_lk: { x: 3, y: 4, w: 38, h: 14 },
  crouch_hp: { x: 0, y: 53, w: 15, h: 24 },
  crouch_hk: { x: 10, y: 1, w: 37, h: 14 },
  jump_lp: { x: 11, y: 49, w: 26, h: 22 },
  jump_hp: { x: 9, y: 49, w: 17, h: 22 },
  jump_lk: { x: 0, y: 12, w: 38, h: 24 },
  jump_hk: { x: 7, y: 11, w: 38, h: 24 },
}
for (const [id, hitbox] of Object.entries(ART_HITBOXES) as Array<
  [NormalId, Box]
>)
  normals[id] = { ...normals[id], hitbox }

// A boot thrown overarm. LP flies high; HP skids along the ground and must be blocked low.
const bootToss: MoveData = {
  startup: 12,
  active: 1,
  recovery: 18,
  hitbox: NO_HITBOX,
  damage: 55,
  chip: 5,
  hitstun: 16,
  blockstun: 11,
  hitstop: 6,
  pushback: 6,
  guard: 'mid',
  ammoCost: 1,
  cancel: 'super',
  projectile: {
    spawnFrame: 12,
    spawn: { x: 16, y: 62 },
    box: { x: -6, y: -6, w: 12, h: 12 },
    speed: 6 * SUB,
    life: 60,
  },
}

// Pulls boots off the ground (and whoever they belonged to) to restring the four.
const scavenge: MoveData = {
  startup: 16,
  active: 1,
  recovery: 8,
  hitbox: NO_HITBOX,
  damage: 0,
  hitstun: 0,
  blockstun: 0,
  hitstop: 0,
  pushback: 0,
  guard: 'mid',
  reload: true,
}

// A low slide between their legs and out the other side: projectiles pass over him, and his
// body passes through theirs.
const underfoot: MoveData = {
  startup: 6,
  active: 14,
  recovery: 14,
  hitbox: { x: 2, y: 0, w: 30, h: 14 },
  damage: 60,
  chip: 6,
  hitstun: 18,
  blockstun: 12,
  hitstop: 6,
  pushback: 4,
  guard: 'low',
  knockdown: true,
  velocity: { from: 4, to: 19, x: 7 * SUB },
  passThrough: { from: 4, to: 22 },
  invuln: { from: 3, to: 18, projectile: true },
  hurtbox: { x: -16, y: 0, w: 32, h: 22 },
}

// From the air he drops on them off a ledge, as he did to Zuzu at the dry well. An overhead; on
// contact he springs back up.
const ledgeDrop: MoveData = {
  startup: 5,
  active: 22,
  recovery: 10,
  hitbox: { x: 2, y: -4, w: 24, h: 22 },
  damage: 80,
  chip: 8,
  hitstun: 18,
  blockstun: 12,
  hitstop: 8,
  pushback: 6,
  guard: 'high',
  velocity: { from: 5, to: 26, x: 4 * SUB, y: -7 * SUB },
  bounce: 6 * SUB,
}

// He ties their laces together: a command grab that leaves them standing, hobbled, in reach.
const tiedLaces: MoveData = {
  startup: 6,
  active: 3,
  recovery: 22,
  hitbox: { x: 0, y: 0, w: 26, h: HEIGHT },
  damage: 50,
  hitstun: 0,
  blockstun: 0,
  hitstop: 10,
  pushback: 0,
  guard: 'mid',
  grab: true,
  grabStun: 30,
}

// The little knife comes up in a rising slash: the anti-air, untouchable by strikes on startup.
const littleKnife: MoveData = {
  startup: 4,
  active: 8,
  recovery: 26,
  hitbox: { x: 2, y: 44, w: 26, h: 50 },
  damage: 90,
  chip: 9,
  hitstun: 22,
  blockstun: 12,
  hitstop: 8,
  pushback: 3,
  guard: 'mid',
  knockdown: true,
  invuln: { from: 1, to: 6, strike: true },
  velocity: { from: 4, to: 10, x: SUB, y: 4 * SUB },
}

// "Weren't me." He flinches from a swing standing or jumping and the knife answers by itself; a
// low (or a grab) just catches him.
const werentMe: MoveData = {
  startup: 2,
  active: 1,
  recovery: 18,
  hitbox: NO_HITBOX,
  damage: 0,
  hitstun: 0,
  blockstun: 0,
  hitstop: 0,
  pushback: 0,
  guard: 'mid',
  parry: { from: 1, to: 14, damage: 80, guards: ['mid', 'high'] },
}

// Lv1: the whole string swung on its laces, boot after boot after boot.
const everyLastBoot: MoveData = {
  startup: 5,
  active: 24,
  recovery: 28,
  hitbox: { x: 2, y: 20, w: 44, h: 50 },
  damage: 52,
  chip: 5,
  hitstun: 18,
  blockstun: 12,
  hitstop: 6,
  pushback: 3,
  guard: 'mid',
  hits: 5,
  rehit: 5,
  meterCost: 1000,
  freeze: 30,
  invuln: { from: 1, to: 5, strike: true, projectile: true, throw: true },
  velocity: { from: 3, to: 20, x: 4 * SUB },
}

// Lv3: one low whistle and the jackals of the dry well sweep through, wherever the opponent stands.
const theDryWellPack: MoveData = {
  startup: 2,
  active: 2,
  recovery: 48,
  hitbox: { x: -40, y: 0, w: 120, h: 110 },
  damage: 380,
  chip: 55,
  hitstun: 50,
  blockstun: 24,
  hitstop: 30,
  pushback: 20,
  guard: 'mid',
  knockdown: true,
  strikeAt: 'opponent',
  meterCost: 3000,
  freeze: 60,
  showdown: true,
  invuln: { from: 1, to: 8, strike: true, projectile: true, throw: true },
}

const specials: SpecialMove[] = [
  {
    id: 'boot-toss',
    motion: 'qcf',
    button: 'P',
    level: 'special',
    move: bootToss,
    heavy: {
      guard: 'low',
      projectile: { ...bootToss.projectile!, spawn: { x: 16, y: 8 } },
    },
  },
  {
    id: 'underfoot',
    motion: 'qcb',
    button: 'K',
    level: 'special',
    move: underfoot,
  },
  {
    id: 'ledge-drop',
    motion: 'qcb',
    button: 'K',
    level: 'special',
    air: true,
    move: ledgeDrop,
  },
  {
    id: 'tied-laces',
    motion: 'hcb',
    button: 'P',
    level: 'special',
    move: tiedLaces,
  },
  {
    id: 'little-knife',
    motion: 'dp',
    button: 'P',
    level: 'special',
    move: littleKnife,
  },
  {
    id: 'werent-me',
    motion: 'dd',
    button: 'K',
    level: 'special',
    move: werentMe,
  },
  {
    id: 'scavenge',
    motion: 'dd',
    button: 'P',
    level: 'special',
    move: scavenge,
  },
  {
    id: 'every-last-boot',
    motion: 'qcf2',
    button: 'P',
    level: 'super',
    move: everyLastBoot,
  },
  {
    id: 'the-dry-well-pack',
    motion: 'qcb2',
    button: 'HP',
    level: 'super',
    move: theDryWellPack,
  },
]

export const JEFFERY_MITTENS: FighterData = {
  slug: 'jeffery-mittens',
  name: 'Jeffery Mittens',
  health: 900,
  walkForward: 3 * SUB,
  walkBack: Math.round(2.4 * SUB),
  jumpVelocity: 10 * SUB,
  jumpForward: Math.round(3.4 * SUB),
  gravity: Math.round(0.55 * SUB),
  pushbox: { x: -13, y: 0, w: WIDTH, h: 50 },
  hurtStand: { x: -15, y: 0, w: WIDTH + 4, h: HEIGHT },
  hurtCrouch: { x: -15, y: 0, w: WIDTH + 4, h: 54 },
  hurtAir: { x: -13, y: 10, w: WIDTH, h: 70 },
  throwRange: 10,
  throwDamage: 110,
  moves: normals,
  chains: defaultChains(),
  specials,
  ammo: 4,
  easy: {
    neutral: 'boot-toss',
    forward: 'underfoot',
    back: 'werent-me',
    down: 'scavenge',
    up: 'little-knife',
    super: 'every-last-boot',
  },
  look: {
    body: '#78716c',
    light: '#d6d3d1',
    dark: '#1c1917',
  },
}
