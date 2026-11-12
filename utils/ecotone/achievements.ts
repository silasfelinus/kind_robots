// /utils/ecotone/achievements.ts
//
// Ecotone's site achievements (utils/achievements/catalog/main/weird-humboldt.ts),
// judged from one played step: the run before and after a story choice, plus
// the endings and Case Files ledgers. The store calls this from update() only,
// never from a save load, import or restore, so a pasted save cannot farm
// awards. No achievement rewards picking an opening lens.

import { chosenFamilyEnding } from './chosenFamily'
import { companionTimeSpent } from './companionTime'
import { COMPANIONS } from './content'
import {
  chanceToSucceed,
  computeEnding,
  travelParty,
  type RunState,
} from './engine'
import { MYSTERIES, mysteryEnding } from './mysteries'

export const ECOTONE_HALF_GALLERY = 42

export type EcotoneLedgers = {
  endingsBefore: readonly string[]
  endingsAfter: readonly string[]
  casesBefore: number
  casesAfter: number
}

const LEAD_HOPE: Record<string, string> = {
  mara: 'weird-humboldt-mara-hope',
  kit: 'weird-humboldt-kit-hope',
  juniper: 'weird-humboldt-juniper-hope',
  cedar: 'weird-humboldt-cedar-hope',
  alone: 'weird-humboldt-alone-hope',
  ecotopia: 'weird-humboldt-wild-way',
}

/** A check made against the odds: under a 30% chance, and it still landed. */
function longShot(before: RunState | null, after: RunState): boolean {
  const fresh = after.log.slice(before?.log.length ?? 0)
  return fresh.some(
    (entry) =>
      entry.roll?.success === true &&
      chanceToSucceed(entry.roll.target - entry.roll.bonus) < 0.3,
  )
}

/** The achievement codes this step earned (the achievement store skips owned ones). */
export function ecotoneDeeds(
  before: RunState | null,
  after: RunState,
  ledgers: EcotoneLedgers,
): string[] {
  // A new run, or a different run swapped in, is not a played step.
  if (!before || before.seed !== after.seed) return []
  if (after.log.length < before.log.length) return []
  const codes: string[] = []

  if (longShot(before, after)) codes.push('weird-humboldt-long-shot')

  if (
    companionTimeSpent(after.flags, after.meetingOrder).length >
    companionTimeSpent(before.flags, before.meetingOrder).length
  )
    codes.push('weird-humboldt-free-hour')

  if (
    travelParty(after).length >= 3 &&
    travelParty(before).length < travelParty(after).length
  )
    codes.push('weird-humboldt-full-car')

  if (
    COMPANIONS.every((companion) =>
      after.meetingOrder.includes(companion.id),
    ) &&
    before.meetingOrder.length < after.meetingOrder.length
  )
    codes.push('weird-humboldt-all-guides')

  if (!mysteryEnding(before) && mysteryEnding(after))
    codes.push('weird-humboldt-case-closed')

  if (
    ledgers.casesAfter > ledgers.casesBefore &&
    ledgers.casesAfter >= MYSTERIES.length
  )
    codes.push('weird-humboldt-all-cases')

  if (
    ledgers.endingsAfter.length > ledgers.endingsBefore.length &&
    ledgers.endingsAfter.length >= ECOTONE_HALF_GALLERY
  )
    codes.push('weird-humboldt-half-gallery')

  if (before.phase !== 'end' && after.phase === 'end') {
    const ending = computeEnding(after)
    codes.push('weird-humboldt-first-weekend')
    if (ending.fate === 'hope') {
      codes.push('weird-humboldt-hopeful-county')
      const lead = LEAD_HOPE[ending.lead]
      if (lead) codes.push(lead)
      if (ending.lens === 'sober') codes.push('weird-humboldt-clear-eyed')
      if (chosenFamilyEnding(after, ending.fate, (id) => id))
        codes.push('weird-humboldt-long-table')
    } else {
      codes.push('weird-humboldt-dark-county')
    }
  }
  return codes
}
