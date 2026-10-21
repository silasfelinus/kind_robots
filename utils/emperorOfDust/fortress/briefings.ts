// Young Komodo's morning briefings as a given run reads them (conductor
// emperor-of-dust t-013): conditional variants keyed on story flags, and the
// hindsight view of his own lies once he has betrayed the throne.
import { DAYS, dayDef } from './content'
import { gateHolds, pickVariant, variantText } from './types'
import type { Briefing, BriefingVariant, DayDef, FortressRun } from './types'

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
