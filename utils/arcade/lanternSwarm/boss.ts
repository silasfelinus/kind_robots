// /utils/arcade/lanternSwarm/boss.ts
//
// Lantern Swarm (conductor kr-arcade/t-093, t-094): what every Guardian fight shares with the game.
// A Guardian is plain data stepped at 60 Hz on the game's rng; the game hands it a world each tick
// (the lantern, dust, captures, crashes, sounds and moths to let loose) and asks it what a beam hit.

import type { Kind } from './zones'

export type GuardianWorld = {
  rng: () => number
  lanternX: number
  shipY: number
  /** The lantern is out and not blinking: it can be hit or caught. */
  open: boolean
  diveSpeed: number
  dust(x: number, y: number, vx: number): void
  /** A capture glow took hold of the lantern; true when it was carried off (not shielded). */
  caught(x: number): boolean
  /** The Guardian (or part of it) flew into the lantern. */
  crash(x: number): void
  sound(name: 'warn' | 'blip' | 'boom'): void
  /** A moth the Guardian lets loose (a hatched moonlet), diving at the lantern; `brood` groups a trio. */
  spawn(kind: Kind, x: number, y: number, brood: number): void
}

export type GuardianHit = {
  kind:
    | 'panel'
    | 'ring'
    | 'body'
    | 'shrug'
    | 'thread'
    | 'cocoon'
    | 'giant'
    | 'ribbon'
  points: number
  x: number
  y: number
  /** This hit ended a phase. */
  phaseOver?: boolean
  /** This hit calmed it for good. */
  calmed?: boolean
}

/** What the attract pilot should do: where to aim, and which way to lean away from danger. */
export type PilotHint = { aim: number | null; push: number }

export interface BossFight {
  readonly name: string
  /** The banner line when it is calmed and floats home. */
  readonly calmLine: string
  x: number
  y: number
  phase: number
  /** It carries a caught lantern. */
  holding: boolean
  /** Gone home: the stage can end. */
  done: boolean
  update(w: GuardianWorld): void
  /** A beam at (x, y): what it struck, or null when it flies on past. */
  hit(x: number, y: number): GuardianHit | null
  render(g: CanvasRenderingContext2D, tick: number, shipY: number): void
  pilot(lanternX: number, shipY: number): PilotHint
  /** The banner for the phase just begun. */
  phaseBanner(): { text: string; sub: string }
  /** 0..1: how far a capture glow has taken hold of the lantern (its tell). */
  grip(): number
}

/** A pilot's lean away from something low and close (+1 pushes right, -1 left). */
export function lean(
  lanternX: number,
  shipY: number,
  x: number,
  y: number,
  reach: number,
): number {
  if (y > shipY - 60 && y < shipY + 10 && Math.abs(x - lanternX) < reach)
    return x < lanternX ? 1 : -1
  return 0
}
