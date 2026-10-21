import type { TrialResult } from './authoredBosses'
import type { JourneyStateV6 } from './deckV6'
import { JOURNEY_WORLD } from './journey'
import type { WorldEchoV7 } from './worldEchoesV7'

// These scenes require two *completed* specific trials, not mere moral marks.
// The original trial outcome and boss turn remain the sole source of truth.
const CHAINS: Record<
  string,
  Record<string, { title: string; text: string }>
> = {
  tablelands: {
    'tribute/tribute': {
      title: 'The tollkeepers compare notes',
      text: 'At the canyon camp you meet a collector who knows the mission clerk and the river keeper. They have agreed on a rate for travelers who pay to go first. You receive the lowest price. A rabbit family behind you receives the highest.',
    },
    'coerce/coerce': {
      title: 'Two people who remember',
      text: 'A novice from the mission is tending the hand of the river pilot you sent into danger. When you approach, neither speaks. The pilot takes the novice by the elbow and they walk toward the guarded road without asking you to follow.',
    },
    'witness/witness': {
      title: 'A ledger with two kinds of names',
      text: 'The mission witnesses have found the river crews at the canyon fire. One book counts the children who left the locked wing; the other counts boats still owed a crossing. The travelers read both aloud before the warden can begin his roll call.',
    },
    'solidarity/solidarity': {
      title: 'A chain of lanterns',
      text: 'The families who faced the Abbess together have brought spare lanterns to the river crews. The boat captains now escort the canyon caravan in turn. No one has appointed a leader; everyone knows who must be counted before they leave.',
    },
    'coerce/witness': {
      title: 'The novice hears your new words',
      text: 'The crew you helped at the river speaks well of you, but a novice from the mission stands beyond their fire. They remember whom you threatened to open the wing. You are allowed to sit with the crews; the novice leaves before the food is served.',
    },
    'witness/coerce': {
      title: 'A promise the pilot will not accept',
      text: 'You brought witnesses to the mission, and their story reached the canyon. So did the river pilot you forced to take the current for you. The caravan listens to both accounts. Nobody is ready to make one of them cancel the other.',
    },
  },
  cave: {
    'tribute/tribute': {
      title: 'A receipt with two signatures',
      text: 'The cave court has received copies of the river toll and the private payment you made to the warden. An adjudicator offers you the same privilege here. A family outside the circle recognizes the price and quietly moves to the end of the queue.',
    },
    'coerce/coerce': {
      title: 'The danger arrives ahead of you',
      text: 'An unwilling pilot and a canyon traveler wait beyond the blue candles. Both have described how you found a passage by making someone else face the guards. The court orders the captive not to speak to you without a witness.',
    },
    'witness/witness': {
      title: 'A road that can testify',
      text: 'The people counted at the river have joined the caravan witnesses before the cave court. They do not agree about who was brave. They agree about who was left behind, and put those names where the judges must see them.',
    },
    'solidarity/solidarity': {
      title: 'A hearing without a lone defendant',
      text: 'The river crews and canyon caravan arrange themselves around the court. One traveler speaks; another stays with the bound guardian. The judges may still rule against them, but cannot pretend a single stranger has invented the objection.',
    },
    'tribute/solidarity': {
      title: 'The fare you paid is remembered',
      text: 'Caravan volunteers greet the people you helped across the canyon. A river widow recognizes you as the traveler who purchased a crossing ahead of her boat. She accepts your help carrying supplies, but keeps the toll receipt in her pocket.',
    },
    'solidarity/tribute': {
      title: 'An old companion stays at the door',
      text: 'A ferryman who stood with you at the river has followed the caravan to the cave. The warden sold you passage while others waited; the ferryman knows. He will witness your hearing, but will not call your second bargain fair.',
    },
  },
  verge: {
    'tribute/tribute': {
      title: 'The price keeps following you',
      text: 'The warden took a ration and the court sold a verdict. At the last gate the negotiator already has both receipts. She offers to add your name to the list of people allowed through before the others have finished waiting.',
    },
    'coerce/coerce': {
      title: 'Nobody volunteers to hold the key',
      text: 'The canyon traveler you used as cover and the guardian you offered to the cave court have both sent warnings ahead. People stand far from you at the threshold. The passage looks easier when there is no one left willing to walk beside you.',
    },
    'witness/witness': {
      title: 'Two testimonies meet at the last stone',
      text: 'A caravan elder has carried the account of the bridge. Beside her, the released guardian carries the court judgment. Their stories do not match in every detail. Both name those who were almost left outside, and neither lets the gate clerk erase them.',
    },
    'solidarity/solidarity': {
      title: 'The road has learned to assemble',
      text: 'The caravan arrives with the guardian and the witnesses from the cave. Behind them come travelers carrying food, lamps and names. No one claims that you made the wasteland merciful. They made a practice of standing together, and have brought it here.',
    },
    'coerce/solidarity': {
      title: 'The caravan has not forgotten',
      text: 'The cave witnesses brought the guardian out, but a traveler you frightened at the canyon refuses your offered arm. Others accept the help. As the last gate comes into view, the group is carrying both a rescue and an unpaid apology.',
    },
    'solidarity/coerce': {
      title: 'The place left empty in the line',
      text: 'The canyon caravan still remembers when you kept them together. At the cave you bargained with the guardian in their place. Now the caravan leaves one deliberate space at the threshold, so nobody can call the absent guardian an accident.',
    },
  },
}

const lands = JOURNEY_WORLD.lands

function passedTrial(
  state: JourneyStateV6,
  trials: readonly TrialResult[],
  landId: string,
): TrialResult | undefined {
  const land = lands.find((entry) => entry.id === landId)
  if (!land) return undefined
  const boss = state.journey.bosses.find(
    (entry) =>
      entry.landId === landId &&
      entry.id === land.boss.id &&
      entry.roll.success,
  )
  if (!boss) return undefined
  return trials.find(
    (result) =>
      result.landId === landId &&
      result.bossId === boss.id &&
      result.turn === boss.turn &&
      result.roll.success &&
      result.roll.landId === landId &&
      result.roll.locationId === boss.id,
  )
}

export function moralChainsV7(
  state: JourneyStateV6,
  trials: readonly TrialResult[],
): WorldEchoV7[] {
  const result: WorldEchoV7[] = []
  for (let index = 2; index <= state.journey.landIndex; index++) {
    const land = lands[index]
    const earlier = lands[index - 2]
    const previous = lands[index - 1]
    if (!land || !earlier || !previous) break
    const first = passedTrial(state, trials, earlier.id)
    const second = passedTrial(state, trials, previous.id)
    if (!first || !second || first.turn >= second.turn) continue
    const key = first.choiceId + '/' + second.choiceId
    const scene = CHAINS[land.id]?.[key]
    if (!scene) continue
    result.push({
      id: 'chain-' + land.id + '-' + first.choiceId + '-' + second.choiceId,
      landId: land.id,
      sourceLandId: previous.id,
      sourceTurn: second.turn,
      source: 'trial',
      title: scene.title,
      text: scene.text,
    })
  }
  return result
}

export const MORAL_CHAIN_PAIRS = Object.freeze(
  Object.entries(CHAINS).flatMap(([landId, combinations]) =>
    Object.keys(combinations).map((pair) => landId + ':' + pair),
  ),
)
