import { AUTHORED_PACK } from './authoredJourney'
import { LATER_LAND_PACK } from './authoredFiveLands'
import {
  retireAuthoredTrial,
  stepAuthoredTrial,
  type TrialResult,
} from './authoredBosses'
import {
  DECK_V6,
  newJourneyV6,
  stepJourneyV6,
  v6SheetSource,
  type ActionV6,
  type JourneyStateV6,
} from './deckV6'
import { JOURNEY_WORLD } from './journey'
import { canUseJourneyReward, journeyCharacterSheet } from './progression'
import { sameReplay } from './saveLedger'
import { TRIAL_SOURCE_SHA } from './saveLedgerV5'

export type JourneyActionV6 =
  | ActionV6
  | { type: 'TRIAL'; choiceId: string }
  | { type: 'RETREAT' }
  | { type: 'USE_REWARD'; rewardId: string }

export type JourneyLedgerV6 = {
  version: 6
  seed: number
  worldSha: string
  homesteadSha: string
  laterSources: string[]
  trialSha: string
  deckVersion: number
  actions: JourneyActionV6[]
  current: JourneyStateV6
  usedRewards: string[]
  trialResults: TrialResult[]
}

const MAX_ACTIONS = 1200
const MAX_SAVE_SIZE = 700_000
const SOURCE_SHAS = LATER_LAND_PACK.sources.map((source) => source.blobSha)
const REWARD_EFFECTS = {
  'willow-bark-dose': {
    hp: 2,
    provisions: 0,
    text: 'You take a measured dose of willow bark.',
  },
  'recovered-rations': {
    hp: 0,
    provisions: 2,
    text: 'You open the recovered rations for the road.',
  },
} as const
const validSeed = (seed: unknown): seed is number =>
  Number.isSafeInteger(seed) &&
  (seed as number) >= 1 &&
  (seed as number) <= 0xffffffff

export function newJourneyLedgerV6(seed: number): JourneyLedgerV6 {
  const fresh = newJourneyV6(seed)
  return {
    version: 6,
    seed: fresh.journey.seed,
    worldSha: JOURNEY_WORLD.source.blobSha,
    homesteadSha: AUTHORED_PACK.sourceSha,
    laterSources: [...SOURCE_SHAS],
    trialSha: TRIAL_SOURCE_SHA,
    deckVersion: DECK_V6.schemaVersion,
    actions: [],
    current: fresh,
    usedRewards: [],
    trialResults: [],
  }
}

export function v6CharacterSheet(
  state: JourneyStateV6,
  usedRewards: readonly string[],
) {
  return journeyCharacterSheet(v6SheetSource(state), usedRewards)
}

type Step = {
  current: JourneyStateV6
  usedRewards: string[]
  trialResults: TrialResult[]
}

function useReward(
  state: JourneyStateV6,
  usedRewards: readonly string[],
  rewardId: string,
): JourneyStateV6 | null {
  const journey = state.journey
  if (
    ['fallen', 'retired', 'complete'].includes(journey.phase) ||
    !Object.hasOwn(REWARD_EFFECTS, rewardId) ||
    !canUseJourneyReward(
      v6CharacterSheet(state, usedRewards),
      rewardId,
      usedRewards,
    )
  )
    return null
  const effect = REWARD_EFFECTS[rewardId as keyof typeof REWARD_EFFECTS]
  const hp = Math.min(8, journey.hp + effect.hp)
  const provisions = Math.min(30, journey.provisions + effect.provisions)
  if (hp === journey.hp && provisions === journey.provisions) return null
  const turn = journey.turn + 1
  return {
    ...state,
    journey: {
      ...journey,
      hp,
      provisions,
      turn,
      journal: [
        ...journey.journal,
        {
          turn,
          kind: 'encounter',
          landId: JOURNEY_WORLD.lands[journey.landIndex]!.id,
          text: effect.text,
        },
      ],
    },
  }
}

function applyAction(
  state: JourneyStateV6,
  usedRewards: readonly string[],
  trialResults: readonly TrialResult[],
  action: JourneyActionV6,
): Step | null {
  if (!action || typeof action !== 'object') return null
  const keep = (current: JourneyStateV6): Step => ({
    current,
    usedRewards: [...usedRewards],
    trialResults: [...trialResults],
  })
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
    return next === state.journey ? null : keep({ ...state, journey: next })
  }
  if (action.type === 'USE_REWARD') {
    if (typeof action.rewardId !== 'string') return null
    const next = useReward(state, usedRewards, action.rewardId)
    return next
      ? {
          current: next,
          usedRewards: [...usedRewards, action.rewardId],
          trialResults: [...trialResults],
        }
      : null
  }
  if (action.type !== 'TRAVEL' && action.type !== 'CHOOSE') return null
  const next = stepJourneyV6(state, action)
  return next === state ? null : keep(next)
}

export function stepJourneyLedgerV6(
  ledger: JourneyLedgerV6,
  action: JourneyActionV6,
): JourneyLedgerV6 {
  if (ledger.actions.length >= MAX_ACTIONS) return ledger
  const next = applyAction(
    ledger.current,
    ledger.usedRewards,
    ledger.trialResults,
    action,
  )
  if (!next) return ledger
  return { ...ledger, actions: [...ledger.actions, action], ...next }
}

export function restoreJourneyLedgerV6(value: unknown): JourneyLedgerV6 | null {
  if (!value || typeof value !== 'object') return null
  const saved = value as Partial<JourneyLedgerV6>
  if (
    saved.version !== 6 ||
    !validSeed(saved.seed) ||
    saved.worldSha !== JOURNEY_WORLD.source.blobSha ||
    saved.homesteadSha !== AUTHORED_PACK.sourceSha ||
    saved.trialSha !== TRIAL_SOURCE_SHA ||
    saved.deckVersion !== DECK_V6.schemaVersion ||
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
    let step: Step = {
      current: newJourneyV6(saved.seed),
      usedRewards: [],
      trialResults: [],
    }
    for (const action of saved.actions) {
      const next = applyAction(
        step.current,
        step.usedRewards,
        step.trialResults,
        action,
      )
      if (!next) return null
      step = next
    }
    if (
      !sameReplay(step.current, saved.current) ||
      JSON.stringify(step.usedRewards) !== JSON.stringify(saved.usedRewards) ||
      !sameReplay(step.trialResults, saved.trialResults)
    )
      return null
    return {
      ...newJourneyLedgerV6(saved.seed),
      actions: saved.actions.map((action) => ({ ...action })),
      ...step,
    }
  } catch {
    return null
  }
}
