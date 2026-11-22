// utils/emperorOfDust/audio/cues.ts
//
// Which sound effects a change of the fortress earns (conductor emperor-of-dust
// t-073), as a pure diff of the run before and after, like Crystal Street's
// `cuesFor` (utils/crystalStreet/sound.ts). The page watches the store and
// hands each change here, so the engine and the store never call the sound.
// Jumps -- a rewind, a loaded slot, a new reign -- are not diffed: the page
// plays the load cue for those instead.

import type { FortressRun } from '../fortress/types'
import type { EmperorSfxName } from './sfx'
import { emperorActOfDay } from './music'

/** The fields of a run the diff reads; a whole FortressRun satisfies it. */
export type EmperorCueRun = Pick<
  FortressRun,
  'seed' | 'branch' | 'day' | 'brass' | 'roster' | 'active' | 'reports'
>

/** At most this many effects from one change, so a dawn stays legible. */
export const EMPEROR_MAX_CUES = 4

/** True when `next` is not a step on from `prev` but a different timeline. */
export function emperorRunJumped(
  prev: EmperorCueRun | null | undefined,
  next: EmperorCueRun | null | undefined,
): boolean {
  if (!prev || !next) return true
  return (
    prev.seed !== next.seed ||
    prev.branch !== next.branch ||
    next.day < prev.day ||
    next.day > prev.day + 1 ||
    next.reports.length < prev.reports.length
  )
}

/** The effects a move from `prev` to `next` earns, in the order they play. */
export function emperorCuesFor(
  prev: EmperorCueRun | null | undefined,
  next: EmperorCueRun | null | undefined,
): EmperorSfxName[] {
  if (!prev || !next || prev === next || emperorRunJumped(prev, next)) return []
  const cues: EmperorSfxName[] = []

  if (next.day > prev.day) {
    // A dawn: the bell first, then the night's news, worst first.
    const tonight = next.reports.slice(prev.reports.length)
    const quests = tonight.flatMap((report) => report.quests)
    const betrayed = tonight.some((report) => report.betrayal)
    const actTurned =
      emperorActOfDay(next.day) !== emperorActOfDay(prev.day) && next.day <= 50
    if (betrayed) cues.push('betrayal')
    else cues.push('dawnBell')
    if (quests.some((quest) => quest.deaths.length)) cues.push('followerDeath')
    else if (quests.some((quest) => quest.injuries.length))
      cues.push('followerInjured')
    const won = quests.filter(
      (quest) => quest.tier === 'success' || quest.tier === 'triumph',
    ).length
    // A partial result counts as neither; a quest left to expire is not news.
    const lost = quests.filter((quest) => quest.tier === 'failure').length
    if (won && won >= lost) cues.push('questSuccess')
    else if (lost) cues.push('questFailure')
    if (actTurned && !betrayed) cues.push('actChange')
    return cues.slice(0, EMPEROR_MAX_CUES)
  }

  // The same day: the player's own moves.
  if (next.roster.length > prev.roster.length) cues.push('recruit')
  if (next.active.length > prev.active.length) cues.push('questDispatched')
  else if (next.active.length < prev.active.length) cues.push('questWithdrawn')
  if (next.brass > prev.brass) cues.push('brassGain')
  else if (next.brass < prev.brass) cues.push('brassSpend')
  return cues.slice(0, EMPEROR_MAX_CUES)
}
