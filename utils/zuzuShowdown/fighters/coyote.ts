// /utils/zuzuShowdown/fighters/coyote.ts
//
// The Coyote Vagrant (conductor zuzu-showdown t-014, from fighters.yaml).
// One-eyed, destitute, fighting after the croc took his right hand: a knife
// lashed to the stump, and a revolver he fires left-handed and badly. A
// scrappy trickster: an unreliable six-shooter that has to be reloaded,
// pocket sand that stops you blocking, a three-stab rush, a pickpocket grab
// that steals meter, and a Play Dead counter that loses to lows and grabs.
// Lv1 Last Meal is a desperate rush; Lv3 Six Bad Shots is the Showdown super.
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
const WIDTH = 30
const NO_HITBOX = { x: 0, y: 0, w: 0, h: 0 }

const normals = defaultNormals(HEIGHT)
// HP is the knife lashed to his stump: a reaching stab.
normals.stand_hp = {
  ...normals.stand_hp,
  hitbox: { x: 8, y: 58, w: 36, h: 12 },
  damage: 70,
}

const wildShot: MoveData = {
  startup: 10,
  active: 1,
  recovery: 18,
  hitbox: NO_HITBOX,
  damage: 70,
  chip: 7,
  hitstun: 16,
  blockstun: 12,
  hitstop: 6,
  pushback: 6,
  guard: 'mid',
  ammoCost: 1,
  cancel: 'super',
  projectile: {
    spawnFrame: 10,
    spawn: { x: 22, y: 70 },
    box: { x: -4, y: -2, w: 8, h: 4 },
    speed: 9 * SUB,
    life: 60,
    spread: 10,
  },
}

const pocketSand: MoveData = {
  startup: 4,
  active: 3,
  recovery: 14,
  hitbox: { x: 4, y: 60, w: 24, h: 24 },
  damage: 20,
  hitstun: 18,
  blockstun: 8,
  hitstop: 6,
  pushback: 4,
  guard: 'mid',
  blind: 20,
}

const stumpShiv: MoveData = {
  startup: 7,
  active: 15,
  recovery: 16,
  hitbox: { x: 4, y: 50, w: 30, h: 16 },
  damage: 35,
  chip: 4,
  hitstun: 14,
  blockstun: 10,
  hitstop: 6,
  pushback: 4,
  guard: 'mid',
  hits: 3,
  rehit: 5,
  velocity: { from: 4, to: 16, x: 4 * SUB },
}

const pickPocket: MoveData = {
  startup: 6,
  active: 3,
  recovery: 26,
  hitbox: { x: 0, y: 0, w: 28, h: HEIGHT },
  damage: 60,
  hitstun: 0,
  blockstun: 0,
  hitstop: 12,
  pushback: 0,
  guard: 'mid',
  grab: true,
  stealMeter: 500,
}

const playDead: MoveData = {
  startup: 40,
  active: 1,
  recovery: 14,
  hitbox: NO_HITBOX,
  damage: 0,
  hitstun: 0,
  blockstun: 0,
  hitstop: 0,
  pushback: 0,
  guard: 'mid',
  // A kick-up counter against anything that swings at him standing; a low
  // sweep (or a grab) just hits the "corpse".
  parry: { from: 3, to: 30, damage: 90, guards: ['mid', 'high'] },
}

const reload: MoveData = {
  startup: 20,
  active: 1,
  recovery: 10,
  hitbox: NO_HITBOX,
  damage: 0,
  hitstun: 0,
  blockstun: 0,
  hitstop: 0,
  pushback: 0,
  guard: 'mid',
  reload: true,
}

const lastMeal: MoveData = {
  startup: 5,
  active: 20,
  recovery: 30,
  hitbox: { x: 2, y: 30, w: 36, h: 50 },
  damage: 65,
  chip: 6,
  hitstun: 20,
  blockstun: 12,
  hitstop: 8,
  pushback: 3,
  guard: 'mid',
  hits: 4,
  rehit: 5,
  meterCost: 1000,
  freeze: 30,
  invuln: { from: 1, to: 5, strike: true, projectile: true, throw: true },
  velocity: { from: 3, to: 18, x: 5 * SUB },
}

const sixBadShots: MoveData = {
  startup: 2,
  active: 2,
  recovery: 50,
  // Five misses and one ricochet that finds them anywhere on screen.
  hitbox: { x: 0, y: 0, w: 260, h: 110 },
  damage: 400,
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
    id: 'wild-shot',
    motion: 'qcf',
    button: 'P',
    level: 'special',
    move: wildShot,
    // HP aims low.
    heavy: { projectile: { ...wildShot.projectile!, spawn: { x: 22, y: 40 } } },
  },
  {
    id: 'pocket-sand',
    motion: 'qcb',
    button: 'K',
    level: 'special',
    move: pocketSand,
  },
  {
    id: 'stump-shiv',
    motion: 'chargeBF',
    button: 'P',
    level: 'special',
    move: stumpShiv,
  },
  {
    id: 'pick-pocket',
    motion: 'hcb',
    button: 'K',
    level: 'special',
    move: pickPocket,
  },
  {
    id: 'play-dead',
    motion: 'dd',
    button: 'D',
    level: 'special',
    move: playDead,
  },
  { id: 'reload', motion: 'dd', button: 'P', level: 'special', move: reload },
  {
    id: 'last-meal',
    motion: 'qcf2',
    button: 'K',
    level: 'super',
    move: lastMeal,
  },
  {
    id: 'six-bad-shots',
    motion: 'qcb2',
    button: 'HP',
    level: 'super',
    move: sixBadShots,
  },
]

export const COYOTE: FighterData = {
  slug: 'coyote-vagrant',
  name: 'Coyote Vagrant',
  health: 950,
  walkForward: Math.round(2.5 * SUB),
  walkBack: 2 * SUB,
  jumpVelocity: 9 * SUB,
  jumpForward: 3 * SUB,
  gravity: Math.round(0.5 * SUB),
  pushbox: { x: -15, y: 0, w: WIDTH, h: 57 },
  hurtStand: { x: -17, y: 0, w: WIDTH + 4, h: HEIGHT },
  hurtCrouch: { x: -17, y: 0, w: WIDTH + 4, h: 62 },
  hurtAir: { x: -15, y: 10, w: WIDTH, h: 78 },
  throwRange: 10,
  throwDamage: 120,
  moves: normals,
  chains: defaultChains(),
  specials,
  ammo: 6,
  easy: {
    neutral: 'wild-shot',
    forward: 'stump-shiv',
    back: 'play-dead',
    down: 'pocket-sand',
    up: 'reload',
    super: 'last-meal',
  },
  look: {
    body: '#57534e',
    light: '#c4a484',
    dark: '#1c1917',
    hat: 'crushed',
    eyepatch: true,
  },
}
