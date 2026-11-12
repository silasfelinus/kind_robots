import { CAST_DECK_VERSION, rulesForCharacter } from './castDeckV10'
import {
  characterFromSnapshot,
  SKILL_ORDER,
  ZUZU,
  type ShiftingCharacter,
} from './characters'
import { readCheck, type Skill } from './journey'
import {
  adoptSpentDeeds,
  spentDeedsFromSave,
  withSpentDeedsFrom,
} from './deckV6'
import { sameReplay } from './saveLedger'
import {
  newJourneyLedgerV9,
  stepJourneyLedgerV9,
  v9CharacterSheet,
  type JourneyActionV9,
  type JourneyLedgerV9,
} from './saveLedgerV9'

// zuzu-shifting-lands/t-052: V10 is V9 played by a chosen character. The
// snapshot fixes the skills every roll adds, the starting provisions and the
// signature deeds, and the identity the draw keeps you from meeting. V9 and
// older saves keep their own reducers and keys; they are Zuzu's journeys.

export type JourneyLedgerV10 = Omit<JourneyLedgerV9, 'version'> & {
  version: 10
  castDeckVersion: number
  character: ShiftingCharacter
}

const MAX_ACTIONS = 1200
const MAX_SAVE_SIZE = 700_000
const isValidSeed = (seed: unknown): seed is number =>
  Number.isSafeInteger(seed) &&
  (seed as number) >= 1 &&
  (seed as number) <= 0xffffffff

export function newJourneyLedgerV10(
  seed: number,
  character: ShiftingCharacter = ZUZU,
): JourneyLedgerV10 {
  const base = newJourneyLedgerV9(seed)
  const snapshot = JSON.parse(JSON.stringify(character)) as ShiftingCharacter
  return {
    ...base,
    version: 10,
    castDeckVersion: CAST_DECK_VERSION,
    character: snapshot,
    current: {
      ...base.current,
      flags: [...snapshot.signatureFlags],
      journey: {
        ...base.current.journey,
        provisions: snapshot.startProvisions,
      },
    },
  }
}

export function stepJourneyLedgerV10(
  ledger: JourneyLedgerV10,
  action: JourneyActionV9,
): JourneyLedgerV10 {
  if (!action || typeof action !== 'object') return ledger
  const {
    version: _version,
    castDeckVersion,
    character,
    actions,
    ...rest
  } = ledger
  const legacy: JourneyLedgerV9 = { ...rest, version: 9, actions }
  const next = stepJourneyLedgerV9(legacy, action, rulesForCharacter(character))
  if (next === legacy) return ledger
  return { ...next, version: 10, castDeckVersion, character }
}

// Who walked a saved journey: V10 records it; everything older was Zuzu.
export function journeyCharacter(ledger: {
  version: number
  character?: ShiftingCharacter
}): ShiftingCharacter {
  return ledger.version === 10 && ledger.character ? ledger.character : ZUZU
}

// The V9 shape of a V10 run, for the follower, echo and sheet projections
// that read a V9 ledger. Never persisted or stepped.
export function v9View(ledger: JourneyLedgerV10): JourneyLedgerV9 {
  const {
    version: _version,
    castDeckVersion: _deck,
    character: _character,
    ...rest
  } = ledger
  return { ...rest, version: 9 }
}

// The V9 sheet adds earned techniques and injuries to Zuzu's table; a V10
// sheet moves each skill by the traveler's difference from Zuzu. Zuzu's table
// never drops a skill below 1, so the floor of 0 lands exactly where it would
// had the traveler's own table been the base.
export function v10CharacterSheet(ledger: JourneyLedgerV10) {
  const sheet = v9CharacterSheet(v9View(ledger))
  const skills = { ...sheet.skills }
  for (const skill of SKILL_ORDER)
    skills[skill] = Math.max(
      0,
      skills[skill] + ledger.character.skills[skill] - ZUZU.skills[skill],
    )
  return { ...sheet, skills }
}

// A check reading for this traveler: the shared readCheck adds Zuzu's table,
// so the traveler's difference rides in the modifier.
export function readCheckFor(
  character: Pick<ShiftingCharacter, 'skills'>,
  skill: Skill,
  target: number,
  modifier = 0,
) {
  return readCheck(
    skill,
    target,
    modifier + character.skills[skill] - ZUZU.skills[skill],
  )
}

export function restoreJourneyLedgerV10(
  value: unknown,
): JourneyLedgerV10 | null {
  if (!value || typeof value !== 'object') return null
  const saved = value as Partial<JourneyLedgerV10>
  if (!isValidSeed(saved.seed)) return null
  const character = characterFromSnapshot(saved.character)
  if (!character) return null
  const fresh = newJourneyLedgerV10(saved.seed, character)
  if (
    saved.version !== 10 ||
    saved.castDeckVersion !== fresh.castDeckVersion ||
    saved.trialRulesVersion !== fresh.trialRulesVersion ||
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
    !Array.isArray(saved.followerHistory) ||
    !saved.current
  )
    return null
  const spentDeedsFrom = spentDeedsFromSave(saved.current)
  if (typeof spentDeedsFrom !== 'number') return null
  try {
    if (JSON.stringify(value).length > MAX_SAVE_SIZE) return null
    let rebuilt: JourneyLedgerV10 = {
      ...fresh,
      current: withSpentDeedsFrom(fresh.current, spentDeedsFrom),
    }
    for (const action of saved.actions) {
      const next = stepJourneyLedgerV10(rebuilt, action)
      if (next === rebuilt) return null
      rebuilt = next
    }
    if (
      !sameReplay(rebuilt.current, saved.current) ||
      !sameReplay(rebuilt.trialResults, saved.trialResults) ||
      !sameReplay(rebuilt.followerHistory, saved.followerHistory) ||
      JSON.stringify(rebuilt.usedRewards) !==
        JSON.stringify(saved.usedRewards) ||
      JSON.stringify(rebuilt.prepared) !== JSON.stringify(saved.prepared)
    )
      return null
    return { ...rebuilt, current: adoptSpentDeeds(rebuilt.current) }
  } catch {
    return null
  }
}
