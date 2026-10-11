import {
  AUTHORED_PACK,
  newAuthoredJourney,
  type AuthoredJourneyState,
} from './authoredJourney'
import { LATER_LAND_PACK } from './authoredFiveLands'
import {
  retireAuthoredTrial,
  stepAuthoredTrial,
  type TrialResult,
} from './authoredBosses'
import { JOURNEY_WORLD } from './journey'
import { newJourneyLedgerV4, stepJourneyLedgerV4 } from './saveLedgerV4'
import type { JourneyLedgerAction } from './saveLedger'

export type JourneyActionV5 =
  | JourneyLedgerAction
  | { type: 'TRIAL'; choiceId: string }
  | { type: 'RETREAT' }

export type JourneyLedgerV5 = {
  version: 5
  seed: number
  worldSha: string
  homesteadSha: string
  laterSources: string[]
  trialSha: string
  actions: JourneyActionV5[]
  current: AuthoredJourneyState
  usedRewards: string[]
  trialResults: TrialResult[]
}

const MAX_ACTIONS = 1200
const MAX_SAVE_SIZE = 500_000
// Git blob of authoredTrials.json. Changing the trial narrative or check rules
// requires an explicit save-version migration, not a silent reroll on restore.
export const TRIAL_SOURCE_SHA = '1acc49193e828ca102483c79c038e7626ae9d325'
const SOURCE_SHAS = LATER_LAND_PACK.sources.map((source) => source.blobSha)
const validSeed = (seed: unknown): seed is number =>
  Number.isSafeInteger(seed) &&
  (seed as number) >= 1 &&
  (seed as number) <= 0xffffffff

export function newJourneyLedgerV5(seed: number): JourneyLedgerV5 {
  const fresh = newAuthoredJourney(seed)
  return {
    version: 5,
    seed: fresh.journey.seed,
    worldSha: JOURNEY_WORLD.source.blobSha,
    homesteadSha: AUTHORED_PACK.sourceSha,
    laterSources: [...SOURCE_SHAS],
    trialSha: TRIAL_SOURCE_SHA,
    actions: [],
    current: fresh,
    usedRewards: [],
    trialResults: [],
  }
}

function applyAction(
  state: AuthoredJourneyState,
  usedRewards: readonly string[],
  trialResults: readonly TrialResult[],
  action: JourneyActionV5,
): {
  current: AuthoredJourneyState
  usedRewards: string[]
  trialResults: TrialResult[]
} | null {
  if (!action || typeof action !== 'object') return null
  if (action.type === 'TRIAL') {
    if (typeof action.choiceId !== 'string') return null
    const next = stepAuthoredTrial(state.journey, state.flags, action.choiceId)
    if (!next) return null
    return {
      current: { ...state, journey: next.journey },
      usedRewards: [...usedRewards],
      trialResults: [...trialResults, next.outcome],
    }
  }
  if (action.type === 'RETREAT') {
    const next = retireAuthoredTrial(state.journey)
    if (next === state.journey) return null
    return {
      current: { ...state, journey: next },
      usedRewards: [...usedRewards],
      trialResults: [...trialResults],
    }
  }
  // V5 boss attempts must be explicitly authored TRIAL actions. Old BOSS
  // commands still replay through their own versioned V3/V4 interpreters.
  if (!['TRAVEL', 'CHOOSE', 'RESOLVE', 'USE_REWARD'].includes(action.type))
    return null
  const intermediate = {
    ...newJourneyLedgerV4(state.journey.seed),
    current: state,
    usedRewards: [...usedRewards],
  }
  const next = stepJourneyLedgerV4(intermediate, action)
  if (next === intermediate) return null
  return {
    current: next.current,
    usedRewards: next.usedRewards,
    trialResults: [...trialResults],
  }
}

export function stepJourneyLedgerV5(
  ledger: JourneyLedgerV5,
  action: JourneyActionV5,
): JourneyLedgerV5 {
  if (ledger.actions.length >= MAX_ACTIONS) return ledger
  const next = applyAction(
    ledger.current,
    ledger.usedRewards,
    ledger.trialResults,
    action,
  )
  if (!next) return ledger
  return {
    ...ledger,
    actions: [...ledger.actions, action],
    ...next,
  }
}

export function restoreJourneyLedgerV5(value: unknown): JourneyLedgerV5 | null {
  if (!value || typeof value !== 'object') return null
  const saved = value as Partial<JourneyLedgerV5>
  if (
    saved.version !== 5 ||
    !validSeed(saved.seed) ||
    saved.worldSha !== JOURNEY_WORLD.source.blobSha ||
    saved.homesteadSha !== AUTHORED_PACK.sourceSha ||
    saved.trialSha !== TRIAL_SOURCE_SHA ||
    !Array.isArray(saved.laterSources) ||
    JSON.stringify(saved.laterSources) !== JSON.stringify(SOURCE_SHAS) ||
    !Array.isArray(saved.actions) ||
    saved.actions.length > MAX_ACTIONS ||
    !Array.isArray(saved.usedRewards) ||
    !Array.isArray(saved.trialResults) ||
    !saved.current
  )
    return null
  try {
    if (JSON.stringify(value).length > MAX_SAVE_SIZE) return null
    let current = newAuthoredJourney(saved.seed)
    let usedRewards: string[] = []
    let trialResults: TrialResult[] = []
    for (const action of saved.actions) {
      const step = applyAction(current, usedRewards, trialResults, action)
      if (!step) return null
      current = step.current
      usedRewards = step.usedRewards
      trialResults = step.trialResults
    }
    if (
      JSON.stringify(current) !== JSON.stringify(saved.current) ||
      JSON.stringify(usedRewards) !== JSON.stringify(saved.usedRewards) ||
      JSON.stringify(trialResults) !== JSON.stringify(saved.trialResults)
    )
      return null
    return {
      ...newJourneyLedgerV5(saved.seed),
      actions: saved.actions.map((action) => ({ ...action })),
      current,
      usedRewards,
      trialResults,
    }
  } catch {
    return null
  }
}
