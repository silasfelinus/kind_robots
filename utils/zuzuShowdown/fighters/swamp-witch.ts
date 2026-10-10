// /utils/zuzuShowdown/fighters/swamp-witch.ts
//
// The Swamp Witch (conductor zuzu-showdown t-028, from fighters.yaml): the
// Thing Behind the Door's avatar, the only figure shaped like a person in a
// world of animals. A zoner and trapper on a coil of tentacles: Bog Grasp
// bursts out of the mud close (LP) or under the opponent wherever they stand
// (HP); Leech Hex is a slow glob whose leech drains them for five seconds;
// she Sinks into the mud, invulnerable, and surfaces under the opponent, open
// as she rises; Coil Snare is the command grab; Bargain catches one strike in
// a bottle, staggers the striker and pays her half a bar, but a grab beats
// it. Slow on her feet and weak up close.
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

const HEIGHT = 120
const WIDTH = 36
const NO_HITBOX = { x: 0, y: 0, w: 0, h: 0 }

// LP is a gnarled-hand slap, HP a tentacle lash.
const normals = defaultNormals(HEIGHT)

// The leech: 60 health over five seconds, all of it red.
const LEECH = { frames: 300, every: 5 }

// A tentacle bursts from the mud just ahead (LP); the HP version rises under
// the opponent wherever they stood. Either way a jumper is over it.
const bogGrasp: MoveData = {
  startup: 16,
  active: 6,
  recovery: 24,
  hitbox: { x: 30, y: 0, w: 34, h: 70 },
  damage: 80,
  chip: 8,
  hitstun: 24,
  blockstun: 14,
  hitstop: 8,
  pushback: 6,
  guard: 'mid',
  launcher: true,
}

// A slow glob of swamp water; the leech it carries drains them after.
const leechHex: MoveData = {
  startup: 18,
  active: 1,
  recovery: 26,
  hitbox: NO_HITBOX,
  damage: 40,
  chip: 4,
  hitstun: 18,
  blockstun: 12,
  hitstop: 6,
  pushback: 6,
  guard: 'mid',
  poison: LEECH,
  projectile: {
    spawnFrame: 18,
    spawn: { x: 24, y: 70 },
    box: { x: -7, y: -7, w: 14, h: 14 },
    speed: 4 * SUB,
    life: 110,
  },
}

// She melts into the mud, untouchable, and surfaces under the opponent; she is
// open as she rises.
const sink: MoveData = {
  startup: 12,
  active: 1,
  recovery: 46,
  hitbox: NO_HITBOX,
  damage: 0,
  hitstun: 0,
  blockstun: 0,
  hitstop: 0,
  pushback: 0,
  guard: 'mid',
  hurtbox: { x: -20, y: 0, w: 40, h: 6 },
  invuln: { from: 8, to: 40, strike: true, projectile: true, throw: true },
  teleport: { frame: 32, to: 'under' },
}

// The command grab: the coil wraps them, squeezes, and flings them away.
const coilSnare: MoveData = {
  startup: 6,
  active: 2,
  recovery: 32,
  hitbox: { x: 14, y: 0, w: 34, h: 100 },
  damage: 140,
  hitstun: 0,
  blockstun: 0,
  hitstop: 10,
  pushback: 0,
  guard: 'mid',
  grab: true,
  fling: true,
}

// She holds out a little bottle: a strike that lands on it is caught, the
// striker staggers and she banks half a bar. A command grab goes straight
// through it; a projectile fizzles against it and staggers no one.
const bargain: MoveData = {
  startup: 4,
  active: 26,
  recovery: 20,
  hitbox: NO_HITBOX,
  damage: 0,
  hitstun: 0,
  blockstun: 0,
  hitstop: 0,
  pushback: 0,
  guard: 'mid',
  parry: { from: 4, to: 29, damage: 0, meter: 500 },
}

// Three tentacles rise one after another in a line toward the opponent.
const drowningPool: MoveData = {
  startup: 8,
  active: 30,
  recovery: 30,
  hitbox: { x: 20, y: 0, w: 170, h: 80 },
  damage: 87,
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

// The mud under them opens onto the Thin Place; a vast tentacle drags them
// under to the chin and spits them back onto the bank, soaked.
const theDoorBelow: MoveData = {
  startup: 6,
  active: 4,
  recovery: 50,
  hitbox: { x: -40, y: 0, w: 80, h: 140 },
  damage: 430,
  hitstun: 0,
  blockstun: 0,
  hitstop: 12,
  pushback: 0,
  guard: 'mid',
  grab: true,
  strikeAt: 'opponent',
  fling: true,
  meterCost: 3000,
  freeze: 60,
  showdown: true,
  invuln: { from: 1, to: 10, strike: true, projectile: true, throw: true },
}

const specials: SpecialMove[] = [
  {
    id: 'bog-grasp',
    motion: 'qcf',
    button: 'P',
    level: 'special',
    move: bogGrasp,
    heavy: {
      startup: 22,
      strikeAt: 'opponent',
      hitbox: { x: -17, y: 0, w: 34, h: 70 },
    },
  },
  {
    id: 'leech-hex',
    motion: 'qcb',
    button: 'P',
    level: 'special',
    move: leechHex,
  },
  {
    id: 'sink',
    motion: 'dd',
    button: 'K',
    level: 'special',
    move: sink,
  },
  {
    id: 'coil-snare',
    motion: 'hcb',
    button: 'P',
    level: 'special',
    move: coilSnare,
  },
  {
    id: 'bargain',
    motion: 'dd',
    button: 'P',
    level: 'special',
    move: bargain,
  },
  {
    id: 'drowning-pool',
    motion: 'qcf2',
    button: 'P',
    level: 'super',
    move: drowningPool,
  },
  {
    id: 'the-door-below',
    motion: 'qcb2',
    button: 'HP',
    level: 'super',
    move: theDoorBelow,
  },
]

export const SWAMP_WITCH: FighterData = {
  slug: 'swamp-witch',
  name: 'The Swamp Witch',
  health: 950,
  walkForward: Math.round(1.5 * SUB),
  walkBack: Math.round(1.3 * SUB),
  jumpVelocity: 8 * SUB,
  jumpForward: 2 * SUB,
  gravity: Math.round(0.45 * SUB),
  pushbox: { x: -18, y: 0, w: WIDTH, h: 64 },
  hurtStand: { x: -20, y: 0, w: WIDTH + 4, h: HEIGHT },
  hurtCrouch: { x: -20, y: 0, w: WIDTH + 4, h: 76 },
  hurtAir: { x: -18, y: 10, w: WIDTH, h: 90 },
  throwRange: 10,
  throwDamage: 110,
  moves: normals,
  chains: defaultChains(),
  specials,
  easy: {
    neutral: 'bog-grasp',
    forward: 'leech-hex',
    back: 'bargain',
    down: 'sink',
    super: 'drowning-pool',
  },
  look: {
    body: '#3f5a3a',
    light: '#8a7aa8',
    dark: '#1f1830',
  },
}
