import {
  AUTHORED_PACK,
  newAuthoredJourney,
  type AuthoredJourneyState,
} from './authoredJourney'
import { LATER_LAND_PACK, stepFiveLandJourney } from './authoredFiveLands'
import { JOURNEY_WORLD } from './journey'
import {
  newJourneyLedger,
  stepJourneyLedger,
  type JourneyLedgerAction,
} from './saveLedger'

export type JourneyLedgerV4 = {
  version: 4
  seed: number
  worldSha: string
  homesteadSha: string
  laterSources: string[]
  actions: JourneyLedgerAction[]
  current: AuthoredJourneyState
  usedRewards: string[]
}

const MAX_ACTIONS = 1200
const MAX_SAVE_SIZE = 500_000
const SOURCE_SHAS = LATER_LAND_PACK.sources.map((source) => source.blobSha)

const validSeed = (seed: unknown): seed is number =>
  Number.isSafeInteger(seed) &&
  (seed as number) >= 1 &&
  (seed as number) <= 0xffffffff

export function newJourneyLedgerV4(seed: number): JourneyLedgerV4 {
  const fresh = newAuthoredJourney(seed)
  return {
    version: 4,
    seed: fresh.journey.seed,
    worldSha: JOURNEY_WORLD.source.blobSha,
    homesteadSha: AUTHORED_PACK.sourceSha,
    laterSources: [...SOURCE_SHAS],
    actions: [],
    current: fresh,
    usedRewards: [],
  }
}

function applyAction(
  current: AuthoredJourneyState,
  usedRewards: readonly string[],
  action: JourneyLedgerAction,
): { current: AuthoredJourneyState; usedRewards: string[] } | null {
  if (!action || typeof action !== 'object') return null
  if (action.type === 'USE_REWARD') {
    const compatibility = newJourneyLedger(current.journey.seed)
    const result = stepJourneyLedger(
      {
        ...compatibility,
        current,
        usedRewards: [...usedRewards],
      },
      action,
    )
    if (result.current === current) return null
    return { current: result.current, usedRewards: result.usedRewards }
  }
  if (!['TRAVEL', 'CHOOSE', 'RESOLVE', 'BOSS'].includes(action.type))
    return null
  const next = stepFiveLandJourney(current, action)
  if (next === current) return null
  return { current: next, usedRewards: [...usedRewards] }
}

export function stepJourneyLedgerV4(
  ledger: JourneyLedgerV4,
  action: JourneyLedgerAction,
): JourneyLedgerV4 {
  if (ledger.actions.length >= MAX_ACTIONS) return ledger
  const next = applyAction(ledger.current, ledger.usedRewards, action)
  if (!next) return ledger
  return {
    ...ledger,
    actions: [...ledger.actions, action],
    ...next,
  }
}

export function restoreJourneyLedgerV4(value: unknown): JourneyLedgerV4 | null {
  if (!value || typeof value !== 'object') return null
  const saved = value as Partial<JourneyLedgerV4>
  if (
    saved.version !== 4 ||
    !validSeed(saved.seed) ||
    saved.worldSha !== JOURNEY_WORLD.source.blobSha ||
    saved.homesteadSha !== AUTHORED_PACK.sourceSha ||
    !Array.isArray(saved.laterSources) ||
    JSON.stringify(saved.laterSources) !== JSON.stringify(SOURCE_SHAS) ||
    !Array.isArray(saved.actions) ||
    saved.actions.length > MAX_ACTIONS ||
    !Array.isArray(saved.usedRewards) ||
    !saved.current
  )
    return null
  try {
    if (JSON.stringify(value).length > MAX_SAVE_SIZE) return null
    let current = newAuthoredJourney(saved.seed)
    let usedRewards: string[] = []
    for (const action of saved.actions) {
      const step = applyAction(current, usedRewards, action)
      if (!step) return null
      current = step.current
      usedRewards = step.usedRewards
    }
    if (
      JSON.stringify(current) !== JSON.stringify(saved.current) ||
      JSON.stringify(usedRewards) !== JSON.stringify(saved.usedRewards)
    )
      return null
    return {
      ...newJourneyLedgerV4(saved.seed),
      actions: saved.actions.map((action) => ({ ...action })),
      current,
      usedRewards,
    }
  } catch {
    return null
  }
}
