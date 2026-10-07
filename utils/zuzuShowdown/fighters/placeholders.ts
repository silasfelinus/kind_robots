// /utils/zuzuShowdown/fighters/placeholders.ts
//
// Two stand-in fighters with real boxes and the default normals from conductor
// projects/zuzu-showdown/fighters.yaml (`defaults.normals`). They let the sim,
// the renderer and the tests run before any sprite art exists. The real
// fighters (t-014 onward) start from the same template and tune it.

import { SUB, type FighterData, type MoveData, type NormalId } from '../types'

/** The shared frame-data template, scaled to a fighter's height (pixels). */
function defaultNormals(height: number): Record<NormalId, MoveData> {
  const h = (fraction: number) => Math.round(height * fraction)
  const moves: Record<NormalId, MoveData> = {
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
    },
    crouch_hk: {
      // The sweep: low, and it knocks down.
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
      knockdown: true,
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
  return moves
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
