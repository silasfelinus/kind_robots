// /utils/zuzuShowdown/fighters/placeholders.ts
//
// Stand-in fighters with real boxes, the default normals and chain table from
// conductor projects/zuzu-showdown/fighters.yaml (`defaults`), and a generic
// kit of specials and supers that exercises every combat system: a
// projectile, an invincible uppercut, a parry, a command grab, a multi-hit
// rush, an armored strike, a poison bite, an air dive, a Level 1 super and a
// Level 3 Showdown super. They let the sim, the renderer and the tests run
// before any sprite art exists; the real fighters (t-014 onward) start from
// the same templates and replace the kit with their own.

import type { EasyTable } from '../motion'
import {
  SUB,
  type FighterData,
  type MoveData,
  type NormalId,
  type SpecialMove,
} from '../types'

/** The shared frame-data template, scaled to a fighter's height (pixels). */
export function defaultNormals(height: number): Record<NormalId, MoveData> {
  const h = (fraction: number) => Math.round(height * fraction)
  return {
    stand_lp: {
      startup: 4,
      active: 2,
      recovery: 6,
      hitbox: { x: 8, y: h(0.6), w: 22, h: 10 },
      damage: 30,
      hitstun: 12,
      blockstun: 9,
      hitstop: 8,
      pushback: 6,
      guard: 'mid',
      cancel: 'special',
    },
    stand_lk: {
      startup: 5,
      active: 3,
      recovery: 8,
      hitbox: { x: 6, y: h(0.25), w: 26, h: 12 },
      damage: 35,
      hitstun: 13,
      blockstun: 10,
      hitstop: 8,
      pushback: 8,
      guard: 'mid',
      cancel: 'special',
    },
    stand_hp: {
      startup: 8,
      active: 3,
      recovery: 16,
      hitbox: { x: 8, y: h(0.55), w: 34, h: 14 },
      damage: 70,
      hitstun: 18,
      blockstun: 14,
      hitstop: 12,
      pushback: 10,
      guard: 'mid',
      cancel: 'special',
    },
    stand_hk: {
      startup: 10,
      active: 4,
      recovery: 18,
      hitbox: { x: 6, y: h(0.4), w: 40, h: 14 },
      damage: 80,
      hitstun: 19,
      blockstun: 15,
      hitstop: 12,
      pushback: 12,
      guard: 'mid',
      cancel: 'special',
    },
    crouch_lp: {
      startup: 4,
      active: 2,
      recovery: 6,
      hitbox: { x: 8, y: h(0.35), w: 22, h: 10 },
      damage: 25,
      hitstun: 11,
      blockstun: 8,
      hitstop: 8,
      pushback: 5,
      guard: 'mid',
      cancel: 'special',
    },
    crouch_lk: {
      startup: 5,
      active: 3,
      recovery: 8,
      hitbox: { x: 6, y: 0, w: 28, h: 10 },
      damage: 30,
      hitstun: 12,
      blockstun: 9,
      hitstop: 8,
      pushback: 6,
      guard: 'low',
      cancel: 'special',
    },
    crouch_hp: {
      // The anti-air: tall and reaching up.
      startup: 7,
      active: 4,
      recovery: 16,
      hitbox: { x: 2, y: h(0.45), w: 24, h: h(0.6) },
      damage: 70,
      hitstun: 18,
      blockstun: 14,
      hitstop: 12,
      pushback: 8,
      guard: 'mid',
      cancel: 'special',
    },
    crouch_hk: {
      // The launcher: low, and it pops the opponent up for an air combo.
      startup: 9,
      active: 4,
      recovery: 20,
      hitbox: { x: 6, y: 0, w: 42, h: 10 },
      damage: 80,
      hitstun: 20,
      blockstun: 14,
      hitstop: 12,
      pushback: 10,
      guard: 'low',
      launcher: true,
    },
    jump_lp: {
      startup: 4,
      active: 6,
      recovery: 4,
      hitbox: { x: 4, y: h(0.2), w: 22, h: 14 },
      damage: 35,
      hitstun: 12,
      blockstun: 9,
      hitstop: 8,
      pushback: 4,
      guard: 'high',
    },
    jump_hp: {
      startup: 7,
      active: 5,
      recovery: 6,
      hitbox: { x: 4, y: h(0.05), w: 30, h: 20 },
      damage: 75,
      hitstun: 18,
      blockstun: 14,
      hitstop: 12,
      pushback: 6,
      guard: 'high',
    },
    jump_lk: {
      startup: 4,
      active: 8,
      recovery: 4,
      hitbox: { x: -6, y: 0, w: 30, h: 14 },
      damage: 35,
      hitstun: 12,
      blockstun: 9,
      hitstop: 8,
      pushback: 4,
      guard: 'high',
    },
    jump_hk: {
      startup: 7,
      active: 5,
      recovery: 6,
      hitbox: { x: 2, y: 0, w: 36, h: 16 },
      damage: 80,
      hitstun: 18,
      blockstun: 14,
      hitstop: 12,
      pushback: 6,
      guard: 'high',
    },
  }
}

/**
 * fighters.yaml's default chain: light into heavy, punch into kick, standing
 * or crouching; in the air LP > LK > HK > HP, the HP finishing.
 */
export function defaultChains(): Partial<Record<NormalId, NormalId[]>> {
  const ground = (...buttons: string[]) =>
    buttons.flatMap((button) => [
      `stand_${button}`,
      `crouch_${button}`,
    ]) as NormalId[]
  const lp = ground('lk', 'hp', 'hk')
  const lk = ground('hp', 'hk')
  const hp = ground('hk')
  return {
    stand_lp: lp,
    crouch_lp: lp,
    stand_lk: lk,
    crouch_lk: lk,
    stand_hp: hp,
    crouch_hp: hp,
    jump_lp: ['jump_lk', 'jump_hk', 'jump_hp'],
    jump_lk: ['jump_hk', 'jump_hp'],
    jump_hk: ['jump_hp'],
  }
}

const NO_HITBOX = { x: 0, y: 0, w: 0, h: 0 }

/** A kit that touches every system, for the stand-ins and the tests. */
export function testKit(height: number): {
  specials: SpecialMove[]
  easy: EasyTable
} {
  const mid = Math.round(height * 0.5)
  const specials: SpecialMove[] = [
    {
      id: 'fireball',
      motion: 'qcf',
      button: 'P',
      level: 'special',
      move: {
        startup: 12,
        active: 1,
        recovery: 24,
        hitbox: NO_HITBOX,
        damage: 60,
        chip: 8,
        hitstun: 16,
        blockstun: 14,
        hitstop: 8,
        pushback: 10,
        guard: 'mid',
        cancel: 'super',
        projectile: {
          spawnFrame: 12,
          spawn: { x: 24, y: mid },
          box: { x: -10, y: -8, w: 20, h: 16 },
          speed: 3 * SUB,
          life: 180,
        },
      },
      heavy: {
        projectile: {
          spawnFrame: 12,
          spawn: { x: 24, y: mid },
          box: { x: -10, y: -8, w: 20, h: 16 },
          speed: 5 * SUB,
          life: 120,
        },
      },
    },
    {
      id: 'rising',
      motion: 'dp',
      button: 'P',
      level: 'special',
      move: {
        startup: 4,
        active: 8,
        recovery: 22,
        hitbox: {
          x: 0,
          y: Math.round(height * 0.4),
          w: 26,
          h: Math.round(height * 0.9),
        },
        damage: 110,
        chip: 10,
        hitstun: 20,
        blockstun: 16,
        hitstop: 12,
        pushback: 8,
        guard: 'mid',
        knockdown: true,
        cancel: 'super',
        invuln: { from: 1, to: 7, strike: true, throw: true },
      },
    },
    {
      id: 'parry',
      motion: 'qcb',
      button: 'K',
      level: 'special',
      move: {
        startup: 30,
        active: 1,
        recovery: 10,
        hitbox: NO_HITBOX,
        damage: 0,
        hitstun: 0,
        blockstun: 0,
        hitstop: 0,
        pushback: 0,
        guard: 'mid',
        parry: { from: 2, to: 14, damage: 100 },
      },
    },
    {
      id: 'crusher',
      motion: '360',
      button: 'P',
      level: 'special',
      move: {
        startup: 5,
        active: 3,
        recovery: 30,
        hitbox: { x: 0, y: 0, w: 30, h: height },
        damage: 160,
        hitstun: 0,
        blockstun: 0,
        hitstop: 14,
        pushback: 0,
        guard: 'mid',
        grab: true,
        fling: true,
      },
    },
    {
      id: 'rush',
      motion: 'chargeBF',
      button: 'P',
      level: 'special',
      move: {
        startup: 8,
        active: 18,
        recovery: 16,
        hitbox: { x: 4, y: mid - 8, w: 30, h: 20 },
        damage: 35,
        chip: 4,
        hitstun: 14,
        blockstun: 10,
        hitstop: 6,
        pushback: 4,
        guard: 'mid',
        hits: 3,
        rehit: 6,
        velocity: { from: 6, to: 20, x: 3 * SUB },
      },
    },
    {
      id: 'bulwark',
      motion: 'dd',
      button: 'P',
      level: 'special',
      move: {
        startup: 16,
        active: 4,
        recovery: 20,
        hitbox: { x: 6, y: mid - 10, w: 38, h: 24 },
        damage: 90,
        chip: 8,
        hitstun: 20,
        blockstun: 16,
        hitstop: 12,
        pushback: 12,
        guard: 'mid',
        armor: { from: 1, to: 15, hits: 1 },
      },
    },
    {
      id: 'venom',
      motion: 'hcb',
      button: 'K',
      level: 'special',
      move: {
        startup: 10,
        active: 4,
        recovery: 20,
        hitbox: { x: 8, y: mid - 10, w: 30, h: 20 },
        damage: 60,
        chip: 6,
        hitstun: 18,
        blockstun: 14,
        hitstop: 10,
        pushback: 8,
        guard: 'mid',
        poison: { frames: 360, every: 20 },
        fling: true,
      },
    },
    {
      id: 'dive',
      motion: 'qcf',
      button: 'K',
      level: 'special',
      air: true,
      move: {
        startup: 5,
        active: 30,
        recovery: 8,
        hitbox: { x: 0, y: 0, w: 28, h: 16 },
        damage: 80,
        chip: 6,
        hitstun: 18,
        blockstun: 14,
        hitstop: 10,
        pushback: 8,
        guard: 'high',
        velocity: { from: 5, to: 40, x: 5 * SUB, y: -6 * SUB },
      },
    },
    {
      id: 'super',
      motion: 'qcf2',
      button: 'P',
      level: 'super',
      move: {
        startup: 6,
        active: 6,
        recovery: 30,
        hitbox: { x: 0, y: 0, w: 60, h: height },
        damage: 280,
        chip: 30,
        hitstun: 30,
        blockstun: 20,
        hitstop: 16,
        pushback: 16,
        guard: 'mid',
        knockdown: true,
        meterCost: 1000,
        freeze: 30,
        invuln: { from: 1, to: 6, strike: true, projectile: true, throw: true },
        velocity: { from: 1, to: 10, x: 6 * SUB },
      },
    },
    {
      id: 'showdown',
      motion: 'qcb2',
      button: 'HP',
      level: 'super',
      move: {
        startup: 8,
        active: 4,
        recovery: 40,
        hitbox: { x: 0, y: 0, w: 90, h: height },
        damage: 420,
        chip: 50,
        hitstun: 40,
        blockstun: 24,
        hitstop: 20,
        pushback: 20,
        guard: 'mid',
        knockdown: true,
        meterCost: 3000,
        freeze: 60,
        showdown: true,
        invuln: { from: 1, to: 8, strike: true, projectile: true, throw: true },
      },
    },
  ]
  const easy: EasyTable = {
    neutral: 'fireball',
    forward: 'rush',
    back: 'parry',
    down: 'rising',
    up: 'bulwark',
    super: 'super',
  }
  return { specials, easy }
}

function placeholder(
  slug: string,
  name: string,
  height: number,
  width: number,
  options: Partial<FighterData> = {},
): FighterData {
  const crouch = Math.round(height * 0.6)
  return {
    slug,
    name,
    health: 1000,
    walkForward: 2 * SUB,
    walkBack: Math.round(1.5 * SUB),
    jumpVelocity: 9 * SUB,
    jumpForward: 3 * SUB,
    gravity: Math.round(0.5 * SUB),
    pushbox: {
      x: -Math.round(width / 2),
      y: 0,
      w: width,
      h: Math.round(height * 0.55),
    },
    hurtStand: { x: -Math.round(width / 2) - 2, y: 0, w: width + 4, h: height },
    hurtCrouch: {
      x: -Math.round(width / 2) - 2,
      y: 0,
      w: width + 4,
      h: crouch,
    },
    hurtAir: {
      x: -Math.round(width / 2),
      y: Math.round(height * 0.1),
      w: width,
      h: Math.round(height * 0.75),
    },
    throwRange: 10,
    throwDamage: 120,
    moves: defaultNormals(height),
    chains: defaultChains(),
    ...testKit(height),
    ...options,
  }
}

/** A medium all-rounder about Coyote height. */
export const PLACEHOLDER_A: FighterData = placeholder(
  'placeholder-a',
  'Stand-in A',
  96,
  28,
)

/** A heavier, slower stand-in with more health, closer to the grapplers. */
export const PLACEHOLDER_B: FighterData = placeholder(
  'placeholder-b',
  'Stand-in B',
  120,
  40,
  {
    health: 1100,
    walkForward: Math.round(1.5 * SUB),
    walkBack: SUB,
    jumpForward: Math.round(2.5 * SUB),
    throwRange: 14,
    throwDamage: 150,
  },
)
