// Young Komodo's morning briefings as a given run reads them (conductor
// emperor-of-dust t-013): conditional variants keyed on story flags, and the
// hindsight view of his own lies once he has betrayed the throne.
import { DAYS, dayDef } from './content'
import { gateHolds, pickVariant, variantText } from './types'
import type {
  Briefing,
  BriefingVariant,
  DayDef,
  FortressRun,
  RumourChallenge,
} from './types'

/** The flag the Day 41 dawn sets when Komodo hands over the tower. */
export const BETRAYAL_FLAG = 'komodo-betrayal'

export const variantHolds = (
  run: Pick<FortressRun, 'flags'>,
  variant: BriefingVariant,
): boolean => gateHolds(run.flags, variant)

/**
 * The briefing as this run reads it: the first variant whose flags hold
 * replaces the source and text. Truth and Komodo's authorship stay as written.
 */
export const resolveBriefing = (
  run: Pick<FortressRun, 'flags'>,
  briefing: Briefing,
): Briefing => {
  const variant = briefing.variants?.find((entry) => variantHolds(run, entry))
  if (!variant) return briefing
  return {
    ...briefing,
    source: variant.source ?? briefing.source,
    text: variant.text ?? briefing.text,
  }
}

/** Today's three reports for this run, or null on an unscripted day. */
export const dayBriefings = (
  run: Pick<FortressRun, 'flags' | 'day'>,
  def: DayDef | undefined = dayDef(run.day),
): DayDef['briefings'] | null =>
  def
    ? (def.briefings.map((briefing) =>
        resolveBriefing(run, briefing),
      ) as DayDef['briefings'])
    : null

/**
 * The advisor's morning line and the overheard whisper as this run hears
 * them (t-040): `komodoVariants` and `whisper.variants`, first match wins.
 */
export const dayLines = (
  run: Pick<FortressRun, 'flags'>,
  def: DayDef | undefined,
): { komodo: string; whisper?: { source: string; text: string } } => {
  if (!def) return { komodo: '' }
  const whisper = def.whisper
  const heard = whisper ? pickVariant(run.flags, whisper.variants) : undefined
  return {
    komodo: variantText(run.flags, def.komodo, def.komodoVariants),
    ...(whisper
      ? {
          whisper: {
            source: heard?.source ?? whisper.source,
            text: heard?.text ?? whisper.text,
          },
        }
      : {}),
  }
}

export type HindsightEntry = {
  day: number
  title: string
  briefing: Briefing
  hindsight: string
}

/**
 * After the betrayal the Archive reads the old dispatches again: every report
 * that was Komodo's own lie, as this run heard it, with what was true instead.
 */
export const komodoLiesInHindsight = (run: FortressRun): HindsightEntry[] => {
  if (!run.flags.includes(BETRAYAL_FLAG)) return []
  return DAYS.filter((def) => def.day < run.day).flatMap((authored) => {
    const def = dayDef(authored.day) ?? authored
    return def.briefings
      .filter((briefing) => briefing.komodoLie && briefing.hindsight)
      .map((briefing) => ({
        day: def.day,
        title: def.title,
        briefing: resolveBriefing(run, briefing),
        hindsight: briefing.hindsight ?? '',
      }))
  })
}

/** Brass the court earns for catching the day's false report. */
export const RUMOUR_BOUNTY = 8

const stableIndex = (key: string, size: number): number => {
  let hash = 0
  for (const char of key) hash = (hash * 31 + char.charCodeAt(0)) >>> 0
  return hash % size
}

const CLEARED_LINES: ((source: string) => string)[] = [
  (source) =>
    `Two riders follow the report to its end and find it standing. ${source} had it right.`,
  (source) =>
    `${source} is asked to repeat every word, and every word holds. Nothing in the report proves false.`,
  () =>
    'The clerk checks the report against the ledgers, the gate tallies and three witnesses. It is true as told.',
  () =>
    'The runner sent to test it comes back footsore and empty-handed: everything in the report is where it was said to be.',
  () =>
    'The Archive reads the report against last week’s dispatches. They agree on every point. No error turns up.',
  (source) =>
    `A sergeant spends the morning trying to break the story and cannot. ${source} gave it straight.`,
  () =>
    'Every name in the report answers to its name. Every count matches. The investigation finds nothing incorrect.',
  () =>
    'The investigator returns at the noon bell with mud to the knee and a short answer: true, all of it.',
  (source) =>
    `${source} bristles at the questions, then answers them all. The report survives the asking.`,
  () =>
    'The inquiry turns over every stone in the report and finds only the truth underneath.',
  () =>
    'The questions go out at dawn and come back by midday. The report holds. Whatever is false this morning, it is not this.',
  (source) =>
    `${source} leads the investigator to the very spot, and there it is, exactly as reported.`,
]

const CAUGHT_LINES: ((source: string) => string)[] = [
  (source) =>
    `The investigator follows the report to its root and finds nothing there. ${source} heard it secondhand and passed it on as fact.`,
  () =>
    'By noon the story has come apart: the dates are wrong and the witness was never there. The court is spared a costly mistake.',
  (source) =>
    `Two questions in the right tavern and the report collapses. ${source} was repeating a rumour.`,
  () => 'The road is walked end to end. What the report promised is not on it.',
  () =>
    'The ledgers do not agree with the report, and the ledgers are right. Someone wanted the crown to believe this.',
  () =>
    'The investigator comes back grinning. The report is false, and now the court knows who spreads such things.',
  (source) =>
    `${source} cannot name a single person who saw it happen. The report goes on the fire.`,
  () =>
    'Three witnesses, three different stories, none of them the one in the report. The lie is caught before it costs anything.',
]

const KOMODO_CAUGHT = (source: string): string =>
  `${source} cannot say where the story came from, and the investigator finds no trace of it. Young Komodo laughs it off a beat too late.`

/** The advisor's word on the challenge, before the day's pick is made. */
export const rumourPrompt = (
  run: Pick<FortressRun, 'rumourChallenges'>,
): string =>
  run.rumourChallenges?.length
    ? 'One report a day can be looked into, Your Majesty. Which of these rings false?'
    : 'Not every rumour that reaches this court is reliable, Your Majesty. Runners repeat tavern talk, and some people lie to us on purpose. Name one report a day and I will have it looked into. Catch the false one and the court profits by it.'

/** What the investigation of a challenged report turned up. */
export const rumourVerdict = (briefing: Briefing): string => {
  if (briefing.truth)
    return CLEARED_LINES[stableIndex(briefing.id, CLEARED_LINES.length)]!(
      briefing.source,
    )
  if (briefing.komodoLie) return KOMODO_CAUGHT(briefing.source)
  return CAUGHT_LINES[stableIndex(briefing.id, CAUGHT_LINES.length)]!(
    briefing.source,
  )
}

/** Today's challenge, if the crown has already looked into a report. */
export const todaysChallenge = (
  run: Pick<FortressRun, 'day' | 'rumourChallenges'>,
): RumourChallenge | undefined =>
  run.rumourChallenges?.find((entry) => entry.day === run.day)

/** Challenges that caught the false report, out of all made this reign. */
export const rumourTally = (
  run: Pick<FortressRun, 'rumourChallenges'>,
): { caught: number; made: number } => ({
  caught: (run.rumourChallenges ?? []).filter((entry) => entry.caught).length,
  made: run.rumourChallenges?.length ?? 0,
})
