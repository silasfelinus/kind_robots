import {
  newAuthoredJourney,
  restoreAuthoredJourney,
  stepAuthoredJourney,
  type AuthoredAction,
  type AuthoredJourneyState,
} from './authoredJourney'
import { JOURNEY_WORLD } from './journey'
import { canUseJourneyReward, journeyCharacterSheet } from './progression'

export type JourneyLedgerAction =
  AuthoredAction | { type: 'USE_REWARD'; rewardId: string }

export type JourneyLedger = {
  version: 3
  seed: number
  manifestBlobSha: string
  packSha: string
  legacyCheckpoint: AuthoredJourneyState | null
  actions: JourneyLedgerAction[]
  current: AuthoredJourneyState
  usedRewards: string[]
}

const MAX_ACTIONS = 1200
const MAX_SAVE_SIZE = 500_000
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

// Story wording (journal lines, shift reasons, outcome prose) is presentation:
// a restore must still agree on every die, choice, flag, HP and route, but a
// prose rewrite of the authored cards must not reject a saved run.
const PROSE_KEYS = new Set(['text', 'reason', 'resultText'])

export function sameReplay(a: unknown, b: unknown): boolean {
  const mechanics = (value: unknown) =>
    JSON.stringify(value, (key, field) =>
      PROSE_KEYS.has(key) ? undefined : field,
    )
  return mechanics(a) === mechanics(b)
}

const sourceIsCurrent = (s: JourneyLedger): boolean =>
  s.manifestBlobSha === JOURNEY_WORLD.source.blobSha &&
  s.packSha === newAuthoredJourney(s.seed).packSha

const isSeed = (seed: unknown): seed is number =>
  Number.isSafeInteger(seed) &&
  (seed as number) >= 1 &&
  (seed as number) <= 0xffffffff

export function newJourneyLedger(seed: number): JourneyLedger {
  const fresh = newAuthoredJourney(seed)
  return {
    version: 3,
    seed: fresh.journey.seed,
    manifestBlobSha: JOURNEY_WORLD.source.blobSha,
    packSha: fresh.packSha,
    legacyCheckpoint: null,
    actions: [],
    current: fresh,
    usedRewards: [],
  }
}

// Preserve existing V2 visits, dice and identities without inventing a history
// that the old format never recorded. Subsequent V3 events are replay-verified
// from this explicitly marked checkpoint, not silently retroactively rescored.
export function migrateJourneyLedger(legacy: unknown): JourneyLedger | null {
  const checkpoint = restoreAuthoredJourney(legacy)
  if (!checkpoint || !isSeed(checkpoint.journey.seed)) return null
  const fresh = newJourneyLedger(checkpoint.journey.seed)
  return {
    ...fresh,
    legacyCheckpoint: checkpoint,
    current: checkpoint,
  }
}

function useReward(
  current: AuthoredJourneyState,
  usedRewards: readonly string[],
  rewardId: string,
): { current: AuthoredJourneyState; usedRewards: string[] } | null {
  if (
    current.journey.phase === 'fallen' ||
    current.journey.phase === 'retired' ||
    current.journey.phase === 'complete' ||
    !Object.hasOwn(REWARD_EFFECTS, rewardId)
  )
    return null
  const sheet = journeyCharacterSheet(current, usedRewards)
  if (!canUseJourneyReward(sheet, rewardId, usedRewards)) return null
  const effect = REWARD_EFFECTS[rewardId as keyof typeof REWARD_EFFECTS]
  const hp = Math.min(8, current.journey.hp + effect.hp)
  const provisions = Math.min(
    30,
    current.journey.provisions + effect.provisions,
  )
  if (hp === current.journey.hp && provisions === current.journey.provisions)
    return null
  const turn = current.journey.turn + 1
  return {
    usedRewards: [...usedRewards, rewardId],
    current: {
      ...current,
      journey: {
        ...current.journey,
        hp,
        provisions,
        turn,
        journal: [
          ...current.journey.journal,
          {
            turn,
            kind: 'encounter',
            landId: JOURNEY_WORLD.lands[current.journey.landIndex]!.id,
            text: effect.text,
          },
        ],
      },
    },
  }
}

function applyAction(
  current: AuthoredJourneyState,
  usedRewards: readonly string[],
  action: JourneyLedgerAction,
): { current: AuthoredJourneyState; usedRewards: string[] } | null {
  if (!action || typeof action !== 'object') return null
  if (action.type === 'USE_REWARD') {
    if (typeof action.rewardId !== 'string') return null
    return useReward(current, usedRewards, action.rewardId)
  }
  if (!['TRAVEL', 'CHOOSE', 'RESOLVE', 'BOSS'].includes(action.type))
    return null
  const next = stepAuthoredJourney(current, action)
  if (next === current) return null
  return { current: next, usedRewards: [...usedRewards] }
}

export function stepJourneyLedger(
  ledger: JourneyLedger,
  action: JourneyLedgerAction,
): JourneyLedger {
  if (ledger.actions.length >= MAX_ACTIONS) return ledger
  const advanced = applyAction(ledger.current, ledger.usedRewards, action)
  if (!advanced) return ledger
  return {
    ...ledger,
    actions: [...ledger.actions, action],
    ...advanced,
  }
}

export function replayJourneyLedger(value: unknown): JourneyLedger | null {
  if (!value || typeof value !== 'object') return null
  const saved = value as Partial<JourneyLedger>
  if (
    saved.version !== 3 ||
    !isSeed(saved.seed) ||
    !Array.isArray(saved.actions) ||
    saved.actions.length > MAX_ACTIONS ||
    !Array.isArray(saved.usedRewards) ||
    !saved.current ||
    !saved.manifestBlobSha ||
    !saved.packSha
  )
    return null
  const original = newJourneyLedger(saved.seed)
  if (!sourceIsCurrent(saved as JourneyLedger)) return null
  let current = original.current
  if (saved.legacyCheckpoint !== null) {
    const checkpoint = restoreAuthoredJourney(saved.legacyCheckpoint)
    if (!checkpoint || checkpoint.journey.seed !== saved.seed) return null
    current = checkpoint
  }
  let usedRewards: string[] = []
  try {
    if (JSON.stringify(value).length > MAX_SAVE_SIZE) return null
    for (const action of saved.actions) {
      const next = applyAction(current, usedRewards, action)
      if (!next) return null
      current = next.current
      usedRewards = next.usedRewards
    }
    if (
      !sameReplay(current, saved.current) ||
      JSON.stringify(usedRewards) !== JSON.stringify(saved.usedRewards)
    )
      return null
  } catch {
    return null
  }
  // Return the canonical replay rather than caller-owned mutable objects.
  return {
    ...original,
    legacyCheckpoint:
      saved.legacyCheckpoint === null ? null : currentCheckpoint(saved),
    actions: saved.actions.map((action) => ({ ...action })),
    current,
    usedRewards,
  }
}

function currentCheckpoint(
  saved: Partial<JourneyLedger>,
): AuthoredJourneyState {
  return restoreAuthoredJourney(saved.legacyCheckpoint)!
}

export function restoreJourneyLedger(value: unknown): JourneyLedger | null {
  return replayJourneyLedger(value)
}
