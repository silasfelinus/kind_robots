// /utils/arcade/pinball/rules/lamps.ts
//
// The lamp matrix (conductor kind-pinball/t-019): which inserts and flashers
// are lit, read from the rules state. Pure, like the rules reducer, so the
// renderer only draws what this says and tests can check it without WebGL.
//
// What is lit is what matters now: the lock arrow flashes once the A-M-I
// bank is down, the left orbit flashes while the secret door is open, the
// kickback lamp shows it will save the ball, and the rainbow across the
// lower playfield counts the bonus multiplier the sub-table brought home.
// Table 1's features (t-007) blink the arrows that are worth going for: a
// village's shots, the jackpot ramps and the super jackpot at the lock in
// multiball, every arrow in the wizard mode, the upper feed for the extra
// ball, and the award saucer while it will start a village. Every other shot
// arrow stays lit as a target, and a tilt puts every lamp and the GI out.
// Light shows and the attract show play over this matrix
// (rules/lightShows.ts).

import type { LampLevel, TableDef } from '../types'
import type { PinballRulesState } from './engine'
import { ARROW_SHOTS, RAMP_SHOTS, VILLAGES } from './village'

export type LampFrame = {
  lamps: Record<string, LampLevel>
  /** General illumination, 0 (out) to 1. */
  gi: number
}

/** Rainbow lamps across the lower playfield, in order, for the multiplier. */
export const RAINBOW_LAMPS = [
  'rainbow-1',
  'rainbow-2',
  'rainbow-3',
  'rainbow-4',
  'rainbow-5',
  'rainbow-6',
]

const NET_LAMPS: Record<string, string> = {
  'net-n': 'lamp-net-n',
  'net-e': 'lamp-net-e',
  'net-t': 'lamp-net-t',
}

/** The lamps for a game in progress. */
export function lampStates(
  state: PinballRulesState,
  table: TableDef,
): LampFrame {
  const lamps: Record<string, LampLevel> = {}
  for (const insert of table.inserts ?? []) lamps[insert.id] = 'off'
  for (const flasher of table.flashers ?? []) lamps[flasher.id] = 'off'
  if (state.tilted) return { lamps, gi: 0 }

  const set = (id: string, level: LampLevel) => {
    if (id in lamps) lamps[id] = level
  }
  for (const insert of table.inserts ?? []) {
    if (insert.shot && insert.shape === 'arrow') set(insert.id, 'on')
  }
  const amiDown = state.dropsDown.ami ?? []
  for (const id of amiDown) set(`lamp-${id}`, 'on')
  set('arrow-lock', amiDown.length >= 3 ? 'blink' : 'off')
  const play = state.play
  const village = play.villages.mode
    ? VILLAGES[play.villages.mode.village]
    : undefined
  const hot = new Set<string>(village?.shots ?? [])
  if (play.wizard.running) for (const id of ARROW_SHOTS) hot.add(id)
  if (play.multiball.running) for (const id of RAMP_SHOTS) hot.add(id)
  if (play.multiball.superLit) hot.add('lock')
  if (play.extraBallLit) hot.add('upper-feed')
  for (const id of hot) set(`arrow-${id}`, 'blink')
  set('lamp-award', play.villages.scoopLit ? 'blink' : 'on')
  if (state.sub.doorOpen) {
    set('arrow-left-orbit', 'blink')
    set('flasher-secret', 'blink')
  }
  set('lamp-kickback', state.kickbackLit ? 'on' : 'off')
  const earned = Math.min(RAINBOW_LAMPS.length, state.bonusMultiplier - 1)
  for (const [i, id] of RAINBOW_LAMPS.entries())
    set(id, i < earned ? 'on' : 'off')
  for (const net of state.sub.nets) set(NET_LAMPS[net] ?? '', 'on')
  set(
    'arrow-sub-home',
    state.sub.nets.length >= Object.keys(NET_LAMPS).length ? 'blink' : 'on',
  )
  return { lamps, gi: 1 }
}
