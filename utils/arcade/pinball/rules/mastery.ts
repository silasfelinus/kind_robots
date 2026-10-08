// /utils/arcade/pinball/rules/mastery.ts
//
// AMI Village Rescue's mastery goals (conductor kind-pinball/t-014): a ladder
// of table challenges, FX3-style, for replay value. Each is earned once per
// player, the first time it happens in any game. A goal is read from the
// rules state before and after an event (and the effects it made), so this
// stays pure and testable without WebGL. The runtime announces a goal on the
// DMD the first time it is earned; the arcade store keeps each player's
// progress (utils/arcade/mastery.ts); the cabinet's how-to-play page shows
// the ladder, with the sub-table's two goals as question marks until earned.

import type { ArcadeMasteryGoal } from '../../types'
import type { RuleEffect } from '../types'
import type { PinballRulesState } from './engine'

/** The ladder, roughly in the order a player meets them. */
export const MASTERY_GOALS: readonly ArcadeMasteryGoal[] = [
  { id: 'skill-shot', title: 'SKILL SHOT', hint: 'MAKE THE LIT SHOT' },
  { id: 'first-village', title: 'FIRST VILLAGE', hint: 'SHOOT THE SAUCER' },
  { id: 'village-saved', title: 'VILLAGE SAVED', hint: 'FINISH A VILLAGE' },
  { id: 'combo-3', title: '3-WAY COMBO', hint: 'CHAIN 3 SHOTS' },
  { id: 'multiball', title: 'AMI MULTIBALL', hint: 'LOCK THE BALLS' },
  { id: 'jackpot', title: 'JACKPOT', hint: 'RAMPS IN MULTIBALL' },
  {
    id: 'secret',
    title: 'SECRET VILLAGE',
    hint: 'FIND THE HIDDEN ROOM',
    secret: true,
  },
  {
    id: 'nets-home',
    title: 'NETS HOME',
    hint: 'BRING ALL NETS HOME',
    secret: true,
  },
  { id: 'super-jackpot', title: 'SUPER JACKPOT', hint: 'THEN THE LOCK' },
  { id: 'extra-ball', title: 'EXTRA BALL', hint: 'VISIT 5 VILLAGES' },
  { id: 'wizard', title: 'MALARIA-FREE', hint: 'VISIT 6 VILLAGES' },
  { id: 'ten-million', title: 'TEN MILLION', hint: 'SCORE 10,000,000' },
]

const TEN_MILLION = 10_000_000

const shown = (effects: readonly RuleEffect[], scene: string) =>
  effects.some((e) => e.type === 'dmd' && e.scene === scene)

/** The goals the change from `before` to `after` (with its effects) achieves. */
export function goalsMet(
  before: PinballRulesState,
  after: PinballRulesState,
  effects: readonly RuleEffect[],
): string[] {
  const [was, now] = [before.play, after.play]
  const met: string[] = []
  if (shown(effects, 'skill-shot')) met.push('skill-shot')
  if (now.villages.mode && !was.villages.mode) met.push('first-village')
  if (now.villages.saved > was.villages.saved) met.push('village-saved')
  if (now.combo.count >= 2 && was.combo.count < 2) met.push('combo-3')
  if (now.multiballs > was.multiballs) met.push('multiball')
  if (shown(effects, 'jackpot') && now.multiball.running) met.push('jackpot')
  if (after.sub.found > before.sub.found) met.push('secret')
  // HOME with all three nets pays two on the bonus multiplier.
  if (
    before.sub.nets.length >= 3 &&
    after.bonusMultiplier - before.bonusMultiplier >= 2
  )
    met.push('nets-home')
  if (shown(effects, 'super-jackpot')) met.push('super-jackpot')
  if (now.extraBalls > was.extraBalls) met.push('extra-ball')
  if (now.wizard.running && !was.wizard.running) met.push('wizard')
  if (after.score >= TEN_MILLION && before.score < TEN_MILLION)
    met.push('ten-million')
  return met
}

/** The callout and DMD message for a goal earned for the first time. */
export function masteryEffects(id: string, earned: number): RuleEffect[] {
  const goal = MASTERY_GOALS.find((g) => g.id === id)
  if (!goal) return []
  return [
    { type: 'sound', name: 'mastery' },
    {
      type: 'dmd',
      text: goal.title,
      sub: `MASTERY ${earned}/${MASTERY_GOALS.length}`,
      ms: 2200,
    },
  ]
}
