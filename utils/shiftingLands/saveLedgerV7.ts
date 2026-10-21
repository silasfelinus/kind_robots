import { JOURNEY_WORLD } from './journey'
import { sameReplay } from './saveLedger'
import {
  newJourneyLedgerV6,
  stepJourneyLedgerV6,
  type JourneyActionV6,
  type JourneyLedgerV6,
} from './saveLedgerV6'
import { stepAuthoredTrial } from './authoredBosses'
import {
  TRIAL_RULES_V7,
  canChooseTrialV7,
  canPrepareTrialV7,
  trialForLandV7,
} from './trialRulesV7'

export type JourneyActionV7 = JourneyActionV6 | { type: 'PREPARE' }

export type JourneyLedgerV7 = Omit<JourneyLedgerV6, 'version' | 'actions'> & {
  version: 7
  trialRulesVersion: number
  prepared: string[]
  actions: JourneyActionV7[]
}

const MAX_ACTIONS = 1200
const MAX_SAVE_SIZE = 700_000
const seedIsValid = (seed: unknown): seed is number =>
  Number.isSafeInteger(seed) &&
  (seed as number) >= 1 &&
  (seed as number) <= 0xffffffff

export function newJourneyLedgerV7(seed: number): JourneyLedgerV7 {
  return {
    ...newJourneyLedgerV6(seed),
    version: 7,
    trialRulesVersion: TRIAL_RULES_V7,
    prepared: [],
    actions: [],
  }
}

export function stepJourneyLedgerV7(
  ledger: JourneyLedgerV7,
  action: JourneyActionV7,
): JourneyLedgerV7 {
  if (
    ledger.actions.length >= MAX_ACTIONS ||
    !action ||
    typeof action !== 'object'
  )
    return ledger
  const state = ledger.current
  if (action.type === 'PREPARE') {
    if (!canPrepareTrialV7(state, ledger.prepared)) return ledger
    const land = JOURNEY_WORLD.lands[state.journey.landIndex]!
    const turn = state.journey.turn + 1
    return {
      ...ledger,
      prepared: [...ledger.prepared, land.id],
      actions: [...ledger.actions, action],
      current: {
        ...state,
        journey: {
          ...state.journey,
          hp: state.journey.hp - 1,
          turn,
          journal: [
            ...state.journey.journal,
            {
              kind: 'boss',
              landId: land.id,
              turn,
              text: 'You spend your remaining daylight studying the trial. The work takes a toll on your strength, but you find a safer approach.',
            },
          ],
        },
      },
    }
  }
  if (action.type === 'TRIAL') {
    if (typeof action.choiceId !== 'string' || state.journey.phase !== 'boss')
      return ledger
    const land = JOURNEY_WORLD.lands[state.journey.landIndex]
    const trial = land && trialForLandV7(land.id)
    const choice = trial?.choices.find(
      (candidate) => candidate.id === action.choiceId,
    )
    if (!trial || !choice || !canChooseTrialV7(choice, state, ledger.prepared))
      return ledger
    const result = stepAuthoredTrial(
      state.journey,
      state.flags,
      action.choiceId,
      trial,
    )
    if (!result) return ledger
    return {
      ...ledger,
      actions: [...ledger.actions, action],
      current: { ...state, journey: result.journey },
      trialResults: [...ledger.trialResults, result.outcome],
    }
  }
  // Existing encounters, rewards and retreat behavior are exactly the V6
  // reducer. The temporary V6 envelope never persists or changes old saves.
  const temporary: JourneyLedgerV6 = {
    ...ledger,
    version: 6,
    actions: [],
  }
  const next = stepJourneyLedgerV6(temporary, action)
  if (next === temporary) return ledger
  return {
    ...ledger,
    actions: [...ledger.actions, action],
    current: next.current,
    usedRewards: next.usedRewards,
    trialResults: next.trialResults,
  }
}

export function restoreJourneyLedgerV7(value: unknown): JourneyLedgerV7 | null {
  if (!value || typeof value !== 'object') return null
  const saved = value as Partial<JourneyLedgerV7>
  if (!seedIsValid(saved.seed)) return null
  const fresh = newJourneyLedgerV7(saved.seed)
  if (
    saved.version !== 7 ||
    saved.trialRulesVersion !== TRIAL_RULES_V7 ||
    saved.worldSha !== fresh.worldSha ||
    saved.homesteadSha !== fresh.homesteadSha ||
    saved.trialSha !== fresh.trialSha ||
    saved.deckVersion !== fresh.deckVersion ||
    JSON.stringify(saved.laterSources) !== JSON.stringify(fresh.laterSources) ||
    !Array.isArray(saved.actions) ||
    saved.actions.length > MAX_ACTIONS ||
    !Array.isArray(saved.prepared) ||
    !Array.isArray(saved.usedRewards) ||
    !Array.isArray(saved.trialResults) ||
    !saved.current
  )
    return null
  try {
    if (JSON.stringify(value).length > MAX_SAVE_SIZE) return null
    let rebuilt = fresh
    for (const action of saved.actions) {
      const next = stepJourneyLedgerV7(rebuilt, action)
      if (next === rebuilt) return null
      rebuilt = next
    }
    if (
      !sameReplay(rebuilt.current, saved.current) ||
      !sameReplay(rebuilt.trialResults, saved.trialResults) ||
      JSON.stringify(rebuilt.usedRewards) !==
        JSON.stringify(saved.usedRewards) ||
      JSON.stringify(rebuilt.prepared) !== JSON.stringify(saved.prepared)
    )
      return null
    return rebuilt
  } catch {
    return null
  }
}
