import type { TrialResult } from './authoredBosses'
import type { ShiftingCharacter } from './characters'
import { activeV6Card, choiceSpends, type JourneyStateV6 } from './deckV6'
import { HOPEFUL_CONSTELLATION_TITLES_V7 } from './endingsConstellationsV7'
import { authoredEndingV7, authoredEndingV7Base } from './endingsV7'
import type { JourneyRoll, JourneyState } from './journey'

// zuzu-shifting-lands/t-051: which achievements one step of the journey
// earned. Pure: it reads the ledger before and after a single played action
// and never looks at a restored or freshly started run, so reloading a save
// or replaying its ledger cannot award anything. The store calls it only from
// dispatch, after a step that changed the ledger.

export type DeedLedger = {
  version: number
  current: {
    journey: JourneyState
    outcomes: readonly { roll: JourneyRoll | null }[]
  }
  trialResults?: readonly TrialResult[]
  usedRewards?: readonly string[]
  followerHistory?: readonly { choiceId: string }[]
  character?: ShiftingCharacter
}
export type DeedAction = { type: string; choiceId?: string }

const TERMINAL = ['complete', 'fallen', 'retired']

// Trials that open each land's last gate. Codes stay literal so the
// achievement contract can see where each one is awarded.
const TRIAL_CODES: Record<string, string> = {
  homestead: 'zuzu-shifting-lands-open-door',
  dustwater: 'zuzu-shifting-lands-crossing-gate',
  tablelands: 'zuzu-shifting-lands-canyon-warden',
  cave: 'zuzu-shifting-lands-storm-crow-depths',
}

// A long shot: the dice alone had to show 10 or more (one roll in six).
const longShot = (roll: JourneyRoll | null | undefined): boolean =>
  !!roll && roll.success && roll.difficulty - roll.modifier >= 10

const travelerId = (ledger: DeedLedger): string =>
  ledger.version === 10 && ledger.character ? ledger.character.id : 'zuzu'

export function journeyDeedCodes(
  before: DeedLedger,
  after: DeedLedger,
  action: DeedAction,
): string[] {
  const codes: string[] = []
  const was = before.current.journey
  const now = after.current.journey

  if (now.bosses.length > was.bosses.length) {
    const code = TRIAL_CODES[now.bosses[now.bosses.length - 1]!.landId]
    if (code) codes.push(code)
  }

  const trialsBefore = before.trialResults?.length ?? 0
  const newTrials = (after.trialResults ?? []).slice(trialsBefore)
  const passed = newTrials.filter((trial) => trial.roll.success)
  if (passed.some((trial) => trial.choiceId === 'witness'))
    codes.push('zuzu-shifting-lands-witness-trial')
  if (passed.some((trial) => trial.choiceId === 'scout'))
    codes.push('zuzu-shifting-lands-scouted')
  if (passed.length && travelerId(after) === 'jeffery-mittens')
    codes.push('zuzu-shifting-lands-mittens-road')
  if (passed.length && travelerId(after) === 'fennec-siblings')
    codes.push('zuzu-shifting-lands-fennec-road')

  const newOutcomes = after.current.outcomes.slice(
    before.current.outcomes.length,
  )
  if (
    newOutcomes.some((outcome) => longShot(outcome.roll)) ||
    passed.some((trial) => longShot(trial.roll))
  )
    codes.push('zuzu-shifting-lands-hard-roll')

  if (
    action.type === 'CHOOSE' &&
    before.version >= 6 &&
    newOutcomes.length > 0
  ) {
    const card = activeV6Card(before.current as unknown as JourneyStateV6)
    const choice = card?.choices.find((entry) => entry.id === action.choiceId)
    if (card && choice && choiceSpends(card.id, choice).length)
      codes.push('zuzu-shifting-lands-spent-deed')
  }

  const rewardsBefore = before.usedRewards ?? []
  if (
    (after.usedRewards ?? [])
      .slice(rewardsBefore.length)
      .includes('willow-bark-dose')
  )
    codes.push('zuzu-shifting-lands-healer')

  const followerBefore = before.followerHistory?.length ?? 0
  for (const step of (after.followerHistory ?? []).slice(followerBefore)) {
    if (step.choiceId === 'stand-as-witness')
      codes.push('zuzu-shifting-lands-kitchen-loyal')
    if (step.choiceId === 'offer-restitution')
      codes.push('zuzu-shifting-lands-restitution')
  }

  if (!TERMINAL.includes(now.phase) || TERMINAL.includes(was.phase))
    return codes

  if (now.phase === 'retired') codes.push('zuzu-shifting-lands-turn-back')
  if (now.phase === 'complete') {
    codes.push('zuzu-shifting-lands-beyond-the-verge')
    if (travelerId(after) === 'custom')
      codes.push('zuzu-shifting-lands-own-legend')
  }
  // Moral endings exist from V7 on, when the toll and the shared road do.
  if (after.version < 7) return codes
  const trials = after.trialResults ?? []
  const state = after.current as unknown as JourneyStateV6
  if (
    now.phase === 'complete' &&
    !trials.some(
      (trial) => trial.choiceId === 'tribute' || trial.choiceId === 'coerce',
    )
  )
    codes.push('zuzu-shifting-lands-honest-road')
  const base = authoredEndingV7Base(state, trials)
  if (base?.title === 'A Road Wide Enough for Everyone')
    codes.push('zuzu-shifting-lands-wide-road')
  if (base?.path === 'Reckoning and partial repair')
    codes.push('zuzu-shifting-lands-debt-carried')
  const ending = authoredEndingV7(state, trials)
  if (ending && HOPEFUL_CONSTELLATION_TITLES_V7.includes(ending.title))
    codes.push('zuzu-shifting-lands-constellation')
  return codes
}
