// /utils/arcade/cableCrawler/modes.ts
//
// Cable Crawler's extra modes (conductor kr-arcade/t-068): Marathon, the classic homage -- all 33
// mazes in a fixed cycle on a steep speed ramp, a per-wave clock and a nine-digit score counter --
// and Maze Trials, time attack on one cleared maze. The Odyssey is the campaign in components.ts.
// Everything here is data and pure arithmetic; the game reads it.

import { BIOS, BIOS_INDEX, COMPONENTS } from './components'

export type Mode = 'odyssey' | 'marathon' | 'trials'

export const MODES: readonly Mode[] = ['odyssey', 'marathon', 'trials']

export const MODE_NAMES: Record<Mode, string> = {
  odyssey: 'ODYSSEY',
  marathon: 'MARATHON',
  trials: 'MAZE TRIALS',
}

export const MODE_BLURBS: Record<Mode, string> = {
  odyssey: 'THE CAMPAIGN',
  marathon: 'ALL 33 MAZES, FASTER AND FASTER',
  trials: 'BEAT YOUR BEST TIME',
}

/** One maze of the Mainframe: its component's campaign index and its place in that component. */
export type Leg = { comp: number; maze: number }

/** Every maze in the order Marathon plays them: the six components in turn, then the BIOS. */
export const CYCLE: readonly Leg[] = [
  ...COMPONENTS.flatMap((c, comp) =>
    c.mazes.map((_, maze): Leg => ({ comp, maze })),
  ),
  ...BIOS.mazes.map((_, maze): Leg => ({ comp: BIOS_INDEX, maze })),
]

/** The maze id of a leg. */
export function legId(leg: Leg): string {
  const c = leg.comp === BIOS_INDEX ? BIOS : COMPONENTS[leg.comp]!
  return c.mazes[leg.maze]!.id
}

/** Marathon's wave n (from 0): which maze, and how many full cycles came before it. */
export function marathonLeg(wave: number): { leg: Leg; cycle: number } {
  return {
    leg: CYCLE[wave % CYCLE.length]!,
    cycle: Math.floor(wave / CYCLE.length),
  }
}

export const MARATHON_PACE_FLOOR = 2.5

/** Ticks per cell on wave n: 7.5 down to a floor of 2.5; from there it only stays fast. */
export function marathonPace(wave: number): number {
  return Math.max(MARATHON_PACE_FLOOR, 7.5 - wave * 0.16)
}

/** Seconds on wave n's clock: 80 down to a floor of 35. */
export function marathonClock(wave: number): number {
  return Math.max(35, 80 - wave * 1.4)
}

/** Waves that lengthen the cable's start (then it stays at the cap). */
export const MARATHON_LEN_CAP = 12

/** Marathon's counter is nine digits wide. */
export const MARATHON_DIGITS = 9

export function marathonScore(score: number): string {
  return String(Math.min(score, 999_999_999)).padStart(MARATHON_DIGITS, '0')
}

/** Trials: a maze is open once it has been cleared in any mode. */
export function trialOpen(cleared: ReadonlySet<string>, leg: Leg): boolean {
  return cleared.has(legId(leg))
}

/** Ticks (60 Hz) as M:SS.hh. */
export function formatTime(ticks: number): string {
  const t = Math.max(0, Math.floor(ticks))
  const m = Math.floor(t / 3600)
  const s = Math.floor((t % 3600) / 60)
  const h = Math.floor(((t % 60) * 100) / 60)
  return `${m}:${String(s).padStart(2, '0')}.${String(h).padStart(2, '0')}`
}

/** Whether a finishing time beats the kept best for that maze. */
export function betterTime(
  best: Readonly<Record<string, number>>,
  id: string,
  ticks: number,
): boolean {
  const old = best[id]
  return old === undefined || ticks < old
}
