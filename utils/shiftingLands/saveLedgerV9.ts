import { JOURNEY_WORLD } from './journey'
import { sameReplay } from './saveLedger'
import {
  newJourneyLedgerV8,
  stepJourneyLedgerV8,
  type JourneyLedgerV8,
} from './saveLedgerV8'
import type { JourneyActionV7 } from './saveLedgerV7'
import { kitchenNoviceSourcesV8 } from './followerEchoesV8'
import type { WorldEchoV7 } from './worldEchoesV7'

export type KitchenNoviceChoiceV9 =
  | 'invite-sister'
  | 'respect-her-road'
  | 'carry-family-ledger'
  | 'sell-family-ledger'
  | 'stand-as-witness'
  | 'release-to-families'
  | 'offer-restitution'
  | 'refuse-restitution'

export type JourneyActionV9 =
  | JourneyActionV7
  | { type: 'FOLLOWER'; choiceId: KitchenNoviceChoiceV9 }

export type FollowerOutcomeV9 = {
  choiceId: KitchenNoviceChoiceV9
  turn: number
  landId: string
  text: string
}

export type JourneyLedgerV9 = Omit<JourneyLedgerV8, 'version' | 'actions'> & {
  version: 9
  actions: JourneyActionV9[]
  followerHistory: FollowerOutcomeV9[]
}

export type FollowerOptionV9 = {
  id: KitchenNoviceChoiceV9
  label: string
  consequence: string
  provisions: number
  flag: string
  mark?: 'mercy' | 'honesty' | 'ruthlessness'
}

const OPTIONS: Record<KitchenNoviceChoiceV9, FollowerOptionV9> = {
  'invite-sister': {
    id: 'invite-sister',
    label: 'Invite her to travel as an equal, not a servant',
    consequence:
      'You offer to carry the heavy end of her ledger chest. She studies your face, then steps onto the ferry beside you. She will travel until the families are found, and she keeps the right to leave.',
    provisions: 0,
    flag: 'kitchen-sister-traveling',
  },
  'respect-her-road': {
    id: 'respect-her-road',
    label: 'Let her continue the search independently',
    consequence:
      'You offer a place by the fire, but do not press her. She chooses the ferry clerks and the missing families over your company. You part without making her kindness into a debt.',
    provisions: 0,
    flag: 'kitchen-sister-declined',
  },
  'carry-family-ledger': {
    id: 'carry-family-ledger',
    label: 'Spend two provisions to escort the families through the canyon',
    consequence:
      'You share the last of your dry rations with the two families on her list. She walks beside you through the canyon, reading each name aloud until someone answers. Her trust is earned in the work, not the invitation.',
    provisions: -2,
    flag: 'kitchen-sister-helped-families',
    mark: 'mercy',
  },
  'sell-family-ledger': {
    id: 'sell-family-ledger',
    label: 'Trade the ledger to a toll collector for two provisions',
    consequence:
      'The collector pays for the names. The sister takes the book back before he can copy it, but the sale is enough. She leaves your camp at first light to warn the families herself.',
    provisions: 2,
    flag: 'kitchen-sister-departed',
    mark: 'ruthlessness',
  },
  'stand-as-witness': {
    id: 'stand-as-witness',
    label: 'Stand with her when the cave court demands a scapegoat',
    consequence:
      'You both read the missing names to the cave court. The guards cannot silence two witnesses without silencing the families behind them. She stays as your ally by choice, with her own voice and road.',
    provisions: 0,
    flag: 'kitchen-sister-loyal',
    mark: 'honesty',
  },
  'release-to-families': {
    id: 'release-to-families',
    label: 'Help her reunite the families, then part as friends',
    consequence:
      'You carry the ledger to the reunited families and give it back. She thanks you for the road shared, then follows the children home. The friendship remains even when the party does not.',
    provisions: 0,
    flag: 'kitchen-sister-independent',
  },
  'offer-restitution': {
    id: 'offer-restitution',
    label: 'Spend three provisions replacing the supplies you betrayed',
    consequence:
      'You return with food instead of an excuse. She accepts it for the families, not as payment for forgiveness. At the hearing she lets you carry the lamp, a tentative reunion with trust still to rebuild.',
    provisions: -3,
    flag: 'kitchen-sister-reunited',
    mark: 'mercy',
  },
  'refuse-restitution': {
    id: 'refuse-restitution',
    label: 'Leave the court without pretending the betrayal was harmless',
    consequence:
      'You leave the ledger and the judgment to those whose names it holds. The sister will testify, but not on your behalf. Your paths remain separate.',
    provisions: 0,
    flag: 'kitchen-sister-estranged',
  },
}

const MAX_ACTIONS = 1200
const MAX_SAVE_SIZE = 700_000
const isValidSeed = (seed: unknown): seed is number =>
  Number.isSafeInteger(seed) &&
  (seed as number) >= 1 &&
  (seed as number) <= 0xffffffff

export function newJourneyLedgerV9(seed: number): JourneyLedgerV9 {
  return {
    ...newJourneyLedgerV8(seed),
    version: 9,
    actions: [],
    followerHistory: [],
  }
}

export function kitchenNoviceStatusV9(ledger: JourneyLedgerV9): string {
  const last = ledger.followerHistory.at(-1)?.choiceId
  if (!last) return 'Not recruited'
  const labels: Record<KitchenNoviceChoiceV9, string> = {
    'invite-sister': 'Traveling companion',
    'respect-her-road': 'Independent traveler',
    'carry-family-ledger': 'Trusted companion',
    'sell-family-ledger': 'Departed after betrayal',
    'stand-as-witness': 'Loyal ally',
    'release-to-families': 'Parted as friends',
    'offer-restitution': 'Tentatively reunited',
    'refuse-restitution': 'Estranged',
  }
  return labels[last]
}

export function kitchenNoviceOptionsV9(
  ledger: JourneyLedgerV9,
): FollowerOptionV9[] {
  const state = ledger.current
  const journey = state.journey
  if (!['explore', 'boss'].includes(journey.phase)) return []
  const { intro, homestead, dustwater, tablelands } = kitchenNoviceSourcesV8(
    state,
    ledger.trialResults,
  )
  const history = ledger.followerHistory
  let choices: KitchenNoviceChoiceV9[] = []
  if (
    journey.landIndex === 1 &&
    history.length === 0 &&
    intro?.trusted &&
    homestead &&
    intro.turn < homestead.turn &&
    ['witness', 'solidarity'].includes(homestead.choiceId)
  ) {
    choices = ['invite-sister', 'respect-her-road']
  } else if (
    journey.landIndex === 2 &&
    history.length === 1 &&
    history[0]?.choiceId === 'invite-sister' &&
    homestead &&
    dustwater &&
    dustwater.turn > homestead.turn
  ) {
    choices = ['carry-family-ledger', 'sell-family-ledger']
  } else if (
    journey.landIndex === 3 &&
    history.length === 2 &&
    history[0]?.choiceId === 'invite-sister' &&
    tablelands &&
    dustwater &&
    tablelands.turn > dustwater.turn
  ) {
    choices =
      history[1]?.choiceId === 'carry-family-ledger'
        ? ['stand-as-witness', 'release-to-families']
        : history[1]?.choiceId === 'sell-family-ledger'
          ? ['offer-restitution', 'refuse-restitution']
          : []
  }
  return choices
    .map((id) => OPTIONS[id])
    .filter(
      (option) => journey.provisions + option.provisions >= 0,
    )
}

export function kitchenNoviceEchoesV9(
  ledger: JourneyLedgerV9,
): WorldEchoV7[] {
  return ledger.followerHistory.map((outcome) => ({
    id: `kitchen-novice-v9-${outcome.turn}-${outcome.choiceId}`,
    landId: outcome.landId,
    sourceLandId: outcome.landId,
    sourceTurn: outcome.turn,
    source: 'encounter',
    title: kitchenNoviceStatusV9({
      ...ledger,
      followerHistory: ledger.followerHistory.filter(
        (entry) => entry.turn <= outcome.turn,
      ),
    }),
    text: outcome.text,
  }))
}

export function stepJourneyLedgerV9(
  ledger: JourneyLedgerV9,
  action: JourneyActionV9,
): JourneyLedgerV9 {
  if (
    !action ||
    typeof action !== 'object' ||
    ledger.actions.length >= MAX_ACTIONS
  )
    return ledger
  if (action.type === 'FOLLOWER') {
    const option = kitchenNoviceOptionsV9(ledger).find(
      (candidate) => candidate.id === action.choiceId,
    )
    if (!option) return ledger
    const journey = ledger.current.journey
    const landId = JOURNEY_WORLD.lands[journey.landIndex]!.id
    const turn = journey.turn + 1
    const outcome: FollowerOutcomeV9 = {
      choiceId: option.id,
      turn,
      landId,
      text: option.consequence,
    }
    const marks = { ...ledger.current.marks }
    if (option.mark) marks[option.mark] += 1
    return {
      ...ledger,
      actions: [...ledger.actions, action],
      followerHistory: [...ledger.followerHistory, outcome],
      current: {
        ...ledger.current,
        flags: [...ledger.current.flags, option.flag],
        marks,
        journey: {
          ...journey,
          turn,
          provisions: journey.provisions + option.provisions,
          journal: [
            ...journey.journal,
            { turn, kind: 'encounter', landId, text: option.consequence },
          ],
        },
      },
    }
  }
  const legacy: JourneyLedgerV8 = {
    ...ledger,
    version: 8,
    actions: [],
  }
  const next = stepJourneyLedgerV8(legacy, action)
  if (next === legacy) return ledger
  return {
    ...next,
    version: 9,
    actions: [...ledger.actions, action],
    followerHistory: ledger.followerHistory,
  }
}

export function restoreJourneyLedgerV9(value: unknown): JourneyLedgerV9 | null {
  if (!value || typeof value !== 'object') return null
  const saved = value as Partial<JourneyLedgerV9>
  if (!isValidSeed(saved.seed)) return null
  const fresh = newJourneyLedgerV9(saved.seed)
  if (
    saved.version !== 9 ||
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
  try {
    if (JSON.stringify(value).length > MAX_SAVE_SIZE) return null
    let rebuilt = fresh
    for (const action of saved.actions) {
      const next = stepJourneyLedgerV9(rebuilt, action)
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
    return rebuilt
  } catch {
    return null
  }
}
