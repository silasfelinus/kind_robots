import type { CrewId, VoyageRun } from './rules'
import { CREW_PROFILES } from './crewAssignments'
import { VOYAGE_CHAPTERS } from './voyageMap'
import { TRIO_ADVENTURES_A } from './trioAdventuresA'
import { TRIO_ADVENTURES_B } from './trioAdventuresB'
import { TRIO_ADVENTURES_E } from './trioAdventuresE'
import { TRIO_ADVENTURES_F } from './trioAdventuresF'

/**
 * Party adventures (Silas, 2026-10-27, kind_robots#4182): the twelve crew
 * taken three at a time make 220 parties, and each party earns an
 * interstitial adventure of three steps and two endings of its own. "This is
 * an adventure across an insane universe, and we're just along for the ride."
 *
 * A voyage whose three crew form an authored party plays that party's
 * adventure as the Act II interlude: one step per debrief from chapter 4,
 * each a real choice with authored outcomes. A step left unplayed waits for
 * the next debrief, so the three can still be finished by chapter 9. Each
 * option leans toward one of the party's two endings; the ending the
 * majority of choices leans toward is read in the finale epilogue beside the
 * galactic and nemesis endings. A party without an adventure is untouched.
 *
 * State lives on the v1 save as one optional field (`trioAdventure`), like
 * `romance`; restoreTrioAdventure drops a malformed record rather than the
 * voyage.
 */

export type TrioEndingIndex = 0 | 1
/** Every crew look a trio prompt may use, plus the couch phrase and house style (artPrompts.ts). */
export type TrioLooks = Record<CrewId, string> & {
  couch: string
  /** The couch phrase with a capital, to open a sentence. */
  Couch: string
  style: string
}
export type TrioArt = (looks: TrioLooks) => string
export type TrioOption = {
  label: string
  outcome: string
  /** Which of the party's two endings this choice leans toward. */
  ending: TrioEndingIndex
}
export type TrioStep = {
  title: string
  setup: string
  options: readonly [TrioOption, TrioOption]
  art: TrioArt
}
export type TrioEnding = { title: string; text: string; art: TrioArt }
export type TrioAdventure = {
  crew: readonly [CrewId, CrewId, CrewId]
  title: string
  premise: string
  steps: readonly [TrioStep, TrioStep, TrioStep]
  endings: readonly [TrioEnding, TrioEnding]
}
export type TrioRecord = {
  /** The party key (trioKey) the record belongs to. */
  trio: string
  /** One option index per step played, in order. */
  choices: TrioEndingIndex[]
  /** The chapter whose debrief played the latest step. */
  lastChapter: number
  /** Set by the finale epilogue once every step has been played. */
  ending?: TrioEndingIndex
}
export type TrioVoyage = VoyageRun & { trioAdventure?: TrioRecord }

/** The debrief of this chapter offers the first step; one step per chapter after it. */
export const TRIO_FIRST_CHAPTER = 4
export const TRIO_STEPS = 3
export const ALL_PARTIES = 220

/** Order-free key for a party: its three ids sorted and joined. */
export const trioKey = (crew: readonly string[]) => [...crew].sort().join('-')

export const TRIO_ADVENTURES: readonly TrioAdventure[] = [
  ...TRIO_ADVENTURES_A,
  ...TRIO_ADVENTURES_B,
  ...TRIO_ADVENTURES_E,
  ...TRIO_ADVENTURES_F,
]
export const TRIO_BY_KEY: Readonly<Record<string, TrioAdventure>> =
  Object.fromEntries(
    TRIO_ADVENTURES.map((adventure) => [trioKey(adventure.crew), adventure]),
  )

/** Art slot for a step (1-3) or an ending ('a' | 'b') under public/game-of-captains. */
export const trioArtKey = (key: string, part: 1 | 2 | 3 | 'a' | 'b') =>
  `trios/${key}-${typeof part === 'number' ? `step-${part}` : `ending-${part}`}`

export function trioAdventureFor(run: VoyageRun): TrioAdventure | null {
  return run.crew.length === 3 ? (TRIO_BY_KEY[trioKey(run.crew)] ?? null) : null
}

function recordFor(run: VoyageRun): TrioRecord | null {
  const record = (run as TrioVoyage).trioAdventure
  return record && record.trio === trioKey(run.crew) ? record : null
}

/** The step a debrief offers now, or null. */
export function trioStepDue(
  run: VoyageRun,
): { adventure: TrioAdventure; index: number; step: TrioStep } | null {
  if (run.phase !== 'debrief') return null
  const adventure = trioAdventureFor(run)
  if (!adventure) return null
  const record = recordFor(run)
  const index = record?.choices.length ?? 0
  if (index >= TRIO_STEPS || record?.lastChapter === run.chapter) return null
  if (run.chapter < TRIO_FIRST_CHAPTER + index) return null
  return { adventure, index, step: adventure.steps[index]! }
}

/** The outcome recorded in this chapter's debrief, for the page to show after a choice. */
export function trioOutcomeThisChapter(run: VoyageRun): string | null {
  const record = recordFor(run)
  const adventure = trioAdventureFor(run)
  if (run.phase !== 'debrief' || !record || !adventure) return null
  if (record.lastChapter !== run.chapter) return null
  const index = record.choices.length - 1
  const choice = record.choices[index]
  if (choice === undefined) return null
  const outcome = adventure.steps[index]!.options[choice].outcome
  return index + 1 === TRIO_STEPS
    ? `${outcome} The interlude is over. What it comes to will be read at the jump gate.`
    : outcome
}

export function chooseTrioStep(
  run: VoyageRun,
  option: TrioEndingIndex,
): VoyageRun {
  const due = trioStepDue(run)
  if (!due || (option !== 0 && option !== 1)) return run
  const { adventure, index, step } = due
  const chosen = step.options[option]
  const previous = recordFor(run)
  const trioAdventure: TrioRecord = {
    trio: trioKey(run.crew),
    choices: [...(previous?.choices ?? []), option],
    lastChapter: run.chapter,
  }
  const line = `Interlude ${index + 1}/${TRIO_STEPS}, ${adventure.title}: ${step.title}. ${chosen.label}. ${chosen.outcome}`
  return { ...run, trioAdventure, log: [...run.log, line] } as TrioVoyage
}

/** The ending a finished party earned: the one most of its three choices lean toward. */
export function trioEndingIndex(run: VoyageRun): TrioEndingIndex | null {
  const adventure = trioAdventureFor(run)
  const record = recordFor(run)
  if (!adventure || !record || record.choices.length < TRIO_STEPS) return null
  const leaningB = record.choices.filter(
    (choice, step) => adventure.steps[step]!.options[choice].ending === 1,
  ).length
  return leaningB * 2 > TRIO_STEPS ? 1 : 0
}

export function trioEnding(run: VoyageRun): TrioEnding | null {
  const index = trioEndingIndex(run)
  return index === null ? null : trioAdventureFor(run)!.endings[index]
}

const names = (crew: readonly CrewId[]) => {
  const list = crew.map(
    (id) => CREW_PROFILES.find((profile) => profile.id === id)!.name,
  )
  return `${list.slice(0, -1).join(', ')} and ${list.at(-1)}`
}

const EPILOGUE = 'Party epilogue: '

/**
 * Appends the party's ending to a finished voyage, after finishVoyage and
 * beside the galactic and nemesis endings. An adventure begun but left
 * unfinished gets one plain line; a party without an adventure is returned
 * unchanged.
 */
export function trioEpilogue(run: VoyageRun): VoyageRun {
  if (run.phase !== 'ending') return run
  const adventure = trioAdventureFor(run)
  if (!adventure) return run
  if (run.log.some((line) => line.startsWith(EPILOGUE))) return run
  const record = recordFor(run)
  if (!record?.choices.length) return run
  const index = trioEndingIndex(run)
  const text =
    index === null
      ? `${names(adventure.crew)} never finished ${adventure.title}. It is still on the agenda, under any other business.`
      : `${adventure.title}, ${adventure.endings[index].title}: ${adventure.endings[index].text}`
  return {
    ...run,
    ...(index === null ? {} : { trioAdventure: { ...record, ending: index } }),
    scene: `${run.scene} ${text}`,
    log: [...run.log, EPILOGUE + text],
  } as TrioVoyage
}

/**
 * Keeps a saved party record only when it is well formed and belongs to the
 * saved crew; anything else is dropped and the voyage loads without it.
 * Saves from before party adventures have no record and load unchanged.
 */
export function restoreTrioAdventure<T extends VoyageRun | null>(run: T): T {
  if (!run) return run
  const record = (run as TrioVoyage).trioAdventure
  if (record === undefined) return run
  const adventure = trioAdventureFor(run)
  const valid =
    !!record &&
    typeof record === 'object' &&
    !!adventure &&
    record.trio === trioKey(run.crew) &&
    Array.isArray(record.choices) &&
    record.choices.length <= TRIO_STEPS &&
    record.choices.every((choice) => choice === 0 || choice === 1) &&
    Number.isInteger(record.lastChapter) &&
    record.lastChapter >= TRIO_FIRST_CHAPTER &&
    record.lastChapter <= VOYAGE_CHAPTERS &&
    (record.ending === undefined || record.ending === 0 || record.ending === 1)
  if (valid) return run
  const { trioAdventure: _dropped, ...rest } = run as TrioVoyage
  return rest as T
}
