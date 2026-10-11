// /utils/arcade/pinball/tables/zuzuLastBell/lamps.ts
//
// The Last Bell's lamp matrix (conductor zuzu-pinball/t-008), read from its
// rules state: every shot arrow lit as a target, a chapter's shots blinking,
// the Mortuary arrow blinking while it will tell the next chapter, the five
// seals of the story track (broken ones lit, the chapter being told
// blinking), the bonus multiplier, the kickback, the extra ball in the
// Croc's mouth and the shoot-again lamp. A tilt puts everything out.

import type { LampLevel, TableDef } from '../../types'
import type { LampFrame } from '../../rules/lamps'
import { CHAPTERS, litShots, RELICS_FOR_CRYPT, SEAL_COUNT } from './chapters'
import type { ZuzuRulesState } from './rules'
import { STIR_SHOTS, wateringHoleRunning } from './wateringHole'

/** The waterline LEDs ringing the Croc's pool. */
export const WATERLINE_LAMPS = ['waterline-1', 'waterline-2', 'waterline-3']

/** The story track's seal lamps, one per chapter. */
export const SEAL_LAMPS = CHAPTERS.map((_, i) => `seal-${i + 1}`)
/** Bonus multiplier lamps, 2x and up. */
export const MULTIPLIER_LAMPS = ['bonus-2x', 'bonus-3x', 'bonus-4x', 'bonus-5x']

export function zuzuLamps(state: ZuzuRulesState, table: TableDef): LampFrame {
  const lamps: Record<string, LampLevel> = {}
  for (const insert of table.inserts ?? []) lamps[insert.id] = 'off'
  for (const flasher of table.flashers ?? []) lamps[flasher.id] = 'off'
  if (state.tilted) return { lamps, gi: 0 }
  const set = (id: string, level: LampLevel) => {
    if (id in lamps) lamps[id] = level
  }
  const story = state.story
  const run = story.run
  const hot = new Set<string>(
    run ? litShots(CHAPTERS[story.chapter]!, story.progress, run.rove) : [],
  )
  if (state.croc.extraBallLit) hot.add('croc-mouth')
  // The Watering Hole: the orbits stir the water, then the mouth is lit.
  const hole = state.wateringHole
  const watering = wateringHoleRunning(hole)
  if (watering && hole.lit) hot.add('croc-mouth')
  else if (watering) for (const shot of STIR_SHOTS) hot.add(shot)
  const mortuaryOpen = story.mortuaryLit && !run
  if (mortuaryOpen) hot.add('mortuary')
  for (const insert of table.inserts ?? []) {
    if (!insert.shot || insert.shape !== 'arrow') continue
    if (insert.shot === 'mortuary')
      set(insert.id, mortuaryOpen ? 'blink' : 'off')
    else set(insert.id, hot.has(insert.shot) ? 'blink' : 'on')
  }
  // The Croc's arrow is lit only while his jaws are open to take the ball.
  const cycle = state.croc.cycle.phase
  if (cycle !== 'open') set('river-croc-mouth', 'off')
  for (const [i, id] of SEAL_LAMPS.entries())
    set(
      id,
      i < story.chapter ? 'on' : i === story.chapter && run ? 'blink' : 'off',
    )
  for (const [i, id] of MULTIPLIER_LAMPS.entries())
    set(id, state.bonusMultiplier >= i + 2 ? 'on' : 'off')
  const seals = state.sealsDown.length
  set('abbey-seals', seals >= 3 ? 'blink' : seals > 0 ? 'on' : 'off')
  set('relic-lamp', seals >= SEAL_COUNT ? 'blink' : 'off')
  set('kickback-lamp', state.kickbackLit ? 'on' : 'off')
  set('croc-reward', state.croc.extraBallLit ? 'blink' : 'off')
  for (const id of WATERLINE_LAMPS)
    set(
      id,
      watering && (hole.lit || cycle === 'death-roll')
        ? 'blink'
        : watering || cycle === 'open'
          ? 'on'
          : 'off',
    )
  set('shoot-again', state.extraBalls > 0 ? 'on' : 'off')
  set('crypt-seal', state.relics >= RELICS_FOR_CRYPT ? 'blink' : 'off')
  set(
    'croc-flasher',
    cycle === 'death-roll' || hot.has('croc-mouth') ? 'blink' : 'off',
  )
  set(
    'bell-flasher',
    hot.has('bell-spiral') || (!run && !story.mortuaryLit) ? 'blink' : 'off',
  )
  return { lamps, gi: 1 }
}
