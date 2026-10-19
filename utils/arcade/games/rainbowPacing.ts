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
 *
 * `stretch` lengthens sections by name (Silas's second playtest, 2026-10-19: "The miniboss died too quick"):
 * a tougher guardian gets a longer section to fight in, and everything after it moves back by the frames added.
 * A guardian beaten early still hands the Act on at once, so the extra time is only there when it is needed.
 */
export function recutTimeline<Section extends PacedSection>(
  sections: readonly Section[],
  drop: readonly string[],
  stretch: Readonly<Record<string, number>> = {},
) {
  for (const name of [...drop, ...Object.keys(stretch)])
    if (!sections.some((section) => section.name === name))
      throw new Error(`recut: no section named ${name}`)
  const dropped = sections.filter((section) => drop.includes(section.name))
  const stretched = sections.filter((section) => stretch[section.name])
  const at = (frame: number) =>
    frame -
    dropped.reduce(
      (cut, section) =>
        cut + Math.max(0, Math.min(frame, section.to) - section.from),
      0,
    ) +
    stretched.reduce(
      (added, section) =>
        added + (frame >= section.to ? stretch[section.name]! : 0),
      0,
    )
  const kept = (frame: number) =>
    !dropped.some((section) => frame >= section.from && frame < section.to)
  return {
    at,
    kept,
    /** Frames cut from the Act, less the frames stretched into it. */
    removed:
      dropped.reduce((sum, section) => sum + section.to - section.from, 0) -
      Object.values(stretch).reduce((sum, frames) => sum + frames, 0),
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
 * one every so many frames (per section) from five seconds in (past a section's opening comms and its lesson
 * craft) until five seconds before it ends. `pairs` flies every school as mirrored pairs (Act IV's dolphins dive
 * across a partner).
 */
export function reinforcements<Kind extends string>(
  sections: readonly PacedSection[],
  plan: {
    kinds: readonly Kind[]
    every: Readonly<Record<string, number>>
    pairs?: boolean
    /** A lone launcher (the mortar, after Silas's second playtest) every so many frames, high then low. */
    launcher?: { kind: Kind; every: number }
  },
): RainbowWave<Kind>[] {
  const waves: RainbowWave<Kind>[] = []
  let n = 0
  let launched = 0
  for (const [name, every] of Object.entries(plan.every)) {
    const section = sections.find((s) => s.name === name)
    if (!section) throw new Error(`reinforcements: no section named ${name}`)
    if (plan.launcher)
      for (
        let at = section.from + 450;
        at <= section.to - 420;
        at += plan.launcher.every
      )
        waves.push({
          at,
          kind: plan.launcher.kind,
          formation: 'single',
          count: 1,
          lane: launched++ % 2 ? 0.78 : 0.22,
        })
    for (let at = section.from + 300; at <= section.to - 300; at += every) {
      const school = REINFORCEMENT_PATTERN[n % REINFORCEMENT_PATTERN.length]!
      waves.push({
        at,
        kind: plan.kinds[n % plan.kinds.length]!,
        ...school,
        ...(plan.pairs
          ? {
              formation: 'pair' as const,
              count: 4,
              lane: Math.min(school.lane, 1 - school.lane),
            }
          : {}),
      })
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
