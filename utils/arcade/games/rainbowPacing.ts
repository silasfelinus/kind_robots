// /utils/arcade/games/rainbowPacing.ts
//
// Silas's first playtest (2026-10-17: "too easy and too long ... monotonous") recut Act I by hand; conductor
// rainbow t-023 recuts Acts II-VIII the same way through this helper. An Act keeps its teaching sections, its
// guardian, every scripted moment (forks, rescues, Lilt's reveals) and a few escalations; the sections it
// drops are cut out of the Act's clock, so every later wave, event and the boss move up by the time they took.

import type { RainbowWave } from './rainbowFormations'

export type PacedSection = { name: string; from: number; to: number }

/**
 * Cut `drop` (section names) out of an Act's timeline. `at` maps an authored frame to the recut clock (a frame
 * inside a dropped section lands where that section was cut); `kept` says whether a frame survives.
 */
export function recutTimeline<Section extends PacedSection>(
  sections: readonly Section[],
  drop: readonly string[],
) {
  for (const name of drop)
    if (!sections.some((section) => section.name === name))
      throw new Error(`recut: no section named ${name}`)
  const dropped = sections.filter((section) => drop.includes(section.name))
  const at = (frame: number) =>
    frame -
    dropped.reduce(
      (cut, section) =>
        cut + Math.max(0, Math.min(frame, section.to) - section.from),
      0,
    )
  const kept = (frame: number) =>
    !dropped.some((section) => frame >= section.from && frame < section.to)
  return {
    at,
    kept,
    /** Frames cut from the Act. */
    removed: dropped.reduce(
      (sum, section) => sum + section.to - section.from,
      0,
    ),
    sections: sections
      .filter((section) => !drop.includes(section.name))
      .map((section) => ({
        ...section,
        from: at(section.from),
        to: at(section.to),
      })),
    /** Waves (or anything with an `at`) that survive, moved onto the recut clock. */
    waves: <Wave extends { at: number }>(waves: readonly Wave[]) =>
      waves
        .filter((wave) => kept(wave.at))
        .map((wave) => ({ ...wave, at: at(wave.at) })),
  }
}

/** The reinforcement schools, in turn: formation, size, lane and stair direction. */
const REINFORCEMENT_PATTERN: ReadonlyArray<
  Pick<RainbowWave<string>, 'formation' | 'count' | 'lane' | 'step'>
> = [
  { formation: 'vee', count: 5, lane: 0.3 },
  { formation: 'line', count: 4, lane: 0.72 },
  { formation: 'pair', count: 4, lane: 0.18 },
  { formation: 'stair', count: 4, lane: 0.2, step: 1 },
  { formation: 'vee', count: 5, lane: 0.7 },
  { formation: 'stair', count: 4, lane: 0.8, step: -1 },
  { formation: 'line', count: 4, lane: 0.45 },
]

/**
 * Silas's playtest also asked for more craft ("Bullets and enemies should be more plentiful"): the recut Acts
 * kept their sparse teaching waves, so each adds schools of its cheaper craft through the sections named,
 * one every so many frames (per section) from a second and a half in until five seconds before it ends.
 */
export function reinforcements<Kind extends string>(
  sections: readonly PacedSection[],
  plan: { kinds: readonly Kind[]; every: Readonly<Record<string, number>> },
): RainbowWave<Kind>[] {
  const waves: RainbowWave<Kind>[] = []
  let n = 0
  for (const [name, every] of Object.entries(plan.every)) {
    const section = sections.find((s) => s.name === name)
    if (!section) throw new Error(`reinforcements: no section named ${name}`)
    for (let at = section.from + 90; at <= section.to - 300; at += every) {
      const school = REINFORCEMENT_PATTERN[n % REINFORCEMENT_PATTERN.length]!
      waves.push({ at, kind: plan.kinds[n % plan.kinds.length]!, ...school })
      n++
    }
  }
  return waves
}

/** An Act's authored waves with its reinforcements, in the order they enter. */
export const withReinforcements = <Wave extends { at: number }>(
  waves: readonly Wave[],
  extra: readonly Wave[],
): readonly Wave[] => [...waves, ...extra].sort((a, b) => a.at - b.at)
