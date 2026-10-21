import type { TrialResult } from './authoredBosses'
import type { JourneyStateV6 } from './deckV6'
import { JOURNEY_WORLD } from './journey'
import { moralChainsV7 } from './moralChainsV7'

// Presentation only: never invent a deed, change the saved reducer or preview
// a future land. Every passage is keyed to the recorded, successful choice.
export type WorldEchoV7 = {
  id: string
  landId: string
  sourceLandId: string
  sourceTurn: number
  sourceLocationId?: string
  source: 'trial' | 'encounter'
  title: string
  text: string
}
type Line = { title: string; text: string }
const ARRIVALS: Record<string, Record<string, Line>> = {
  dustwater: {
    confront: {
      title: 'The guarded road',
      text: 'A ferryman recognizes the bar you broke at the mission. He waves you through, then bars the families behind you. Your strength has traveled farther than your reasons.',
    },
    parley: {
      title: 'Bread across the water',
      text: 'The keeper has heard about the mission witnesses. He counts the boat crews twice before naming the toll. No one is yet willing to call that mercy.',
    },
    evidence: {
      title: 'Names in the crossing book',
      text: 'A clerk copies the missing names you exposed at the mission into the river register. She cannot find them, but refuses to erase them again.',
    },
    witness: {
      title: 'The witnesses arrive first',
      text: 'A refugee who stood beside you at the mission is telling the boat crews how the guards were made to listen. The crews leave you a place at their fire.',
    },
    scout: {
      title: 'The path out of the courtyard',
      text: 'A traveler followed the patrol route you mapped at the mission. She explains the turns to the boat crews, who begin surveying their own riverbank.',
    },
    solidarity: {
      title: 'A lantern on every boat',
      text: 'Families who stood together at the refuge now share lamps with stranded crews. The smallest boat leaves its lantern lit for the last vessel.',
    },
    tribute: {
      title: 'The price of a quiet key',
      text: 'The river keeper heard a ration could buy silence at the mission. He smiles at your arrival and raises the price for those waiting behind you.',
    },
    coerce: {
      title: 'The novice remembers',
      text: 'A frightened novice from the mission waits among the river travelers. They turn away when they see you. The keeper observes the encounter and begins speaking in threats.',
    },
  },
  tablelands: {
    confront: {
      title: 'The force of the river',
      text: 'The canyon guards have heard of the gate you forced open. They clear your path, then double their escort around the weaker caravan.',
    },
    parley: {
      title: 'A toll book with witnesses',
      text: 'The river crews have copied their agreement onto a board at the canyon camp. It carries no authority here, but travelers read it together.',
    },
    evidence: {
      title: 'The watercourse in the map',
      text: 'An ibex scout marks the safe channel you proved at the river on a map of the high stone. A useful map has never made the warden generous.',
    },
    witness: {
      title: 'The crews keep count',
      text: 'Two ferrymen from the crossing count each traveler in the rain. They refuse to let the warden call another living person missing.',
    },
    scout: {
      title: 'Measure twice',
      text: 'The flood-gate measurements you took are chalked onto a canyon milestone. An ibex scout adds the wind direction and leaves the figures for strangers.',
    },
    solidarity: {
      title: 'One crossing becomes another',
      text: 'River crews have sent volunteers to escort the smallest caravan through the canyon. Neither will cross until every traveler is counted.',
    },
    tribute: {
      title: 'The purchased crossing',
      text: 'The warden opens his palm before you speak. The river keeper told him what you paid to go first. Behind you, a family counts its remaining meals.',
    },
    coerce: {
      title: 'An unwilling pilot',
      text: 'An unwilling river pilot reached the canyon by another way. They tell the caravan not to trust your offers of protection. Nobody meets your eyes.',
    },
  },
  cave: {
    confront: {
      title: 'The bridge remembers steel',
      text: 'The cave guards have heard of the barricade you broke. Their sentries meet you before the bound guardian can speak for himself.',
    },
    parley: {
      title: 'Oaths without seals',
      text: 'A caravan elder repeats the watch oath you offered at the canyon. The court asks who enforced it. Every traveler at the fire raises a hand.',
    },
    evidence: {
      title: 'The alternate path descends',
      text: 'The ibex scout traced the route you revealed to an opening above the cave. She marks it for anyone still trying to find the road.',
    },
    witness: {
      title: 'Caravan witnesses',
      text: 'Travelers who stood with you at the bridge wait outside the court. They offer to testify, knowing their own passage may be delayed.',
    },
    scout: {
      title: 'A habit of measuring',
      text: 'A mule driver remembers the canyon ledge you surveyed and points out a hairline crack in the court floor. He will not call it a safe escape.',
    },
    solidarity: {
      title: 'No one enters alone',
      text: 'The caravan refuses to let the captive face the court without witnesses. Its quietest member volunteers to keep every speaker’s name.',
    },
    tribute: {
      title: 'The warden’s receipt',
      text: 'The canyon warden’s paid passage is written into the court ledger. An adjudicator offers to make your next problem vanish for another ration.',
    },
    coerce: {
      title: 'Someone knows the bargain',
      text: 'A traveler you endangered at the bridge warns the bound guardian not to accept you as an advocate. The court listens with interest.',
    },
  },
  verge: {
    confront: {
      title: 'A verdict carried in scars',
      text: 'The sentries heard how you fought the court for its captive. They stand aside, but keep their spears in hand as you approach.',
    },
    parley: {
      title: 'The spoken oath',
      text: 'Your cave testimony is scratched into a milestone near the final gate. A messenger asks whether the words still hold without anyone to enforce them.',
    },
    evidence: {
      title: 'The missing line',
      text: 'The guardian sends a copy of the corrected judgment to the final threshold. The negotiator reads it twice, then hides the page beneath her key.',
    },
    witness: {
      title: 'A guardian finds their voice',
      text: 'The released guardian comes as far as the last ridge. They cannot cross for you, but offer to tell the court what you risked for them.',
    },
    scout: {
      title: 'The shape of a false law',
      text: 'The gap you measured in the court’s circle resembles a seam in the final gate. You show another traveler how to look for it.',
    },
    solidarity: {
      title: 'A road full of witnesses',
      text: 'People who stood with you in the cave court wait along the ridge. They are frightened, but refuse to let the negotiator question you alone.',
    },
    tribute: {
      title: 'A receipt from the dark',
      text: 'The court’s false verdict reaches the gate before you. The negotiator accepts it. Somewhere behind you the captive remains bound.',
    },
    coerce: {
      title: 'The cost of another’s chains',
      text: 'The guardian you offered in your place is still in the court. The outer lock opens when you arrive, as though the door expects the same bargain.',
    },
  },
}
const REPRISES: ReadonlyArray<
  Line & { id: string; landId: string; cardId: string; choiceId: string }
> = [
  {
    id: 'shared-bread',
    landId: 'dustwater',
    cardId: 'bread-under-the-long-table',
    choiceId: 'say-the-bread-was-yours',
    title: 'The boy with the bread',
    text: 'At the ferry rope you recognize the hungry boy whose blame you took. He offers you half of his last supper. The other half is already promised.',
  },
  {
    id: 'reported-boy',
    landId: 'dustwater',
    cardId: 'bread-under-the-long-table',
    choiceId: 'point-out-the-boy',
    title: 'An unforgiven report',
    text: 'The crossing clerk shows you a mission notice seeking punishment for the child you reported. She thanks you for respecting the rules. You can see the boy’s name beneath the fine.',
  },
  {
    id: 'saved-drover',
    landId: 'tablelands',
    cardId: 'the-infirmarys-last-cot',
    choiceId: 'give-your-own-medicine',
    title: 'The drover on the high road',
    text: 'The feverish drover from the mission now walks among the caravan. He is still pale, but guides a tired family to the next shelter. Your medicine helped him reach this place.',
  },
  {
    id: 'kept-lantern',
    landId: 'cave',
    cardId: 'the-refuge-lantern-at-midnight',
    choiceId: 'keep-the-lantern-burning',
    title: 'Another light kept burning',
    text: 'The promise you kept at the refuge has traveled as a story. At the cave mouth, a courier refuses to let the lamps die while other travelers sleep.',
  },
  {
    id: 'refuge-book',
    landId: 'verge',
    cardId: 'the-guest-book-on-the-lectern',
    choiceId: 'read-the-earlier-pages',
    title: 'The missing departures',
    text: 'The missing names you found in the guest book are repeated at the gate. The clerk leaves a blank line for each person rather than declaring them gone.',
  },
  {
    id: 'stolen-page',
    landId: 'verge',
    cardId: 'the-guest-book-on-the-lectern',
    choiceId: 'tear-out-a-page',
    title: 'The page that survived',
    text: 'The page you took from the refuge contradicts the last negotiator’s neat ledger. Someone beside the gate asks whether you intend to show it.',
  },
  {
    id: 'ibex-warning',
    landId: 'cave',
    cardId: 'the-watchful-overhang',
    choiceId: 'call-the-travelers-back',
    title: 'The scout in the rain',
    text: 'The ibex scout you heeded above the canyon guides another group to the cave. She points out the fallen rock behind them and directs the slowest traveler to shelter.',
  },
  {
    id: 'saved-map',
    landId: 'verge',
    cardId: 'the-map-in-ashes',
    choiceId: 'rescue-the-marked-fragment',
    title: 'The unburned road',
    text: 'The map fragment you saved from the archivist matches a line beneath the gate. The stone was once meant to guide travelers, not count them.',
  },
  {
    id: 'guardian-oath',
    landId: 'verge',
    cardId: 'the-forgotten-pledge',
    choiceId: 'speak-the-oath-back-to-him',
    title: 'An oath in two voices',
    text: 'The captive’s old words have been copied onto the last milestone with space for a second signature. No court commands the stranger waiting to sign.',
  },
  {
    id: 'healers-chest',
    landId: 'verge',
    cardId: 'shelter-for-the-storm',
    choiceId: 'carry-the-medicine-chest',
    title: 'The healer’s unfinished work',
    text: 'A courier from the storm shelter carries a medicine bag over the last ridge. The healer whose chest you carried is still treating people you may never meet.',
  },
]
const lands = JOURNEY_WORLD.lands
const locationLand = new Map(
  lands.flatMap((land) =>
    land.locations.map((loc) => [loc.id, land.id] as const),
  ),
)
const indexes = new Map(lands.map((land, index) => [land.id, index]))

export function worldEchoesV7(
  state: JourneyStateV6,
  trials: readonly TrialResult[],
): WorldEchoV7[] {
  const echoes: WorldEchoV7[] = []
  for (let index = 1; index <= state.journey.landIndex; index++) {
    const land = lands[index]!
    const previous = lands[index - 1]!
    const boss = state.journey.bosses.find(
      (item) => item.landId === previous.id,
    )
    if (!boss) continue
    const success = trials.find(
      (trial) =>
        trial.landId === previous.id &&
        trial.turn === boss.turn &&
        trial.roll.success,
    )
    const line = success && ARRIVALS[land.id]?.[success.choiceId]
    if (success && line)
      echoes.push({
        id: `trial-${previous.id}-${land.id}`,
        landId: land.id,
        sourceLandId: previous.id,
        sourceTurn: success.turn,
        source: 'trial',
        title: line.title,
        text: line.text,
      })
    let count = 0
    for (const reprise of REPRISES) {
      if (count >= 2 || reprise.landId !== land.id) continue
      const encounter = state.outcomes.find(
        (result) =>
          result.encounterId === reprise.cardId &&
          result.choiceId === reprise.choiceId &&
          result.success &&
          (indexes.get(locationLand.get(result.locationId) ?? '') ?? 99) <
            index,
      )
      if (!encounter) continue
      const sourceLandId = locationLand.get(encounter.locationId)
      if (!sourceLandId) continue
      echoes.push({
        id: reprise.id,
        landId: land.id,
        sourceLandId,
        sourceTurn: encounter.turn,
        sourceLocationId: encounter.locationId,
        source: 'encounter',
        title: reprise.title,
        text: reprise.text,
      })
      count++
    }
  }
  echoes.push(...moralChainsV7(state, trials))
  return echoes
}
