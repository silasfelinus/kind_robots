import { CAST_DECK_VERSION, rulesForCharacter } from './castDeckV10'
import {
  characterFromSnapshot,
  SKILL_ORDER,
  ZUZU,
  type ShiftingCharacter,
} from './characters'
import { readCheck, type Skill } from './journey'
import {
  activeV6Card,
  adoptSpentDeeds,
  spentDeedsFromSave,
  v6Card,
  withSpentDeedsFrom,
  type JourneyRules,
  type V6Card,
} from './deckV6'
import {
  PERSONAL_DECK_VERSION,
  personalRulesFor,
  personalStartFlags,
} from './personalDeckV10'
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

// t-053: `personalDeckVersion` marks a journey on a personal road
// (personalDeckV10.ts): the traveler's own cards, own choices and identity
// deed. It is optional, like t-049's spentDeedsFrom: a V10 save written
// before personal roads has no field and replays under exactly the rules it
// was played by. Only "Begin another journey" starts a personal road.
export type JourneyLedgerV10 = Omit<JourneyLedgerV9, 'version'> & {
  version: 10
  castDeckVersion: number
  character: ShiftingCharacter
  personalDeckVersion?: number
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
  personal = false,
): JourneyLedgerV10 {
  const base = newJourneyLedgerV9(seed)
  const snapshot = JSON.parse(JSON.stringify(character)) as ShiftingCharacter
  return {
    ...base,
    version: 10,
    castDeckVersion: CAST_DECK_VERSION,
    character: snapshot,
    ...(personal ? { personalDeckVersion: PERSONAL_DECK_VERSION } : {}),
    current: {
      ...base.current,
      flags: personal
        ? personalStartFlags(snapshot)
        : [...snapshot.signatureFlags],
      journey: {
        ...base.current.journey,
        provisions: snapshot.startProvisions,
      },
    },
  }
}

// The same fresh journey, on its traveler's personal road. A journey already
// under way keeps the road it started on.
export const onPersonalRoad = (ledger: JourneyLedgerV10): JourneyLedgerV10 =>
  ledger.actions.length
    ? ledger
    : newJourneyLedgerV10(ledger.seed, ledger.character, true)

export const rulesForLedgerV10 = (
  ledger: Pick<JourneyLedgerV10, 'character' | 'personalDeckVersion'>,
): JourneyRules =>
  ledger.personalDeckVersion !== undefined
    ? personalRulesFor(ledger.character)
    : rulesForCharacter(ledger.character)

// The card this traveler is facing, with their own choices on a personal road.
export function activeCardV10(ledger: JourneyLedgerV10): V6Card | null {
  return activeV6Card(ledger.current, rulesForLedgerV10(ledger).card)
}

// Any card by id, as this traveler would see it.
export function cardForLedgerV10(
  ledger: JourneyLedgerV10,
  cardId: string,
): V6Card | null {
  return (rulesForLedgerV10(ledger).card ?? v6Card)(cardId)
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
    personalDeckVersion,
    actions,
    ...rest
  } = ledger
  const legacy: JourneyLedgerV9 = { ...rest, version: 9, actions }
  const next = stepJourneyLedgerV9(legacy, action, rulesForLedgerV10(ledger))
  if (next === legacy) return ledger
  return {
    ...next,
    version: 10,
    castDeckVersion,
    character,
    ...(personalDeckVersion === undefined ? {} : { personalDeckVersion }),
  }
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
    personalDeckVersion: _personal,
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
  const personal = Object.hasOwn(saved, 'personalDeckVersion')
  const fresh = newJourneyLedgerV10(saved.seed, character, personal)
  if (
    saved.version !== 10 ||
    (personal && saved.personalDeckVersion !== fresh.personalDeckVersion) ||
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
