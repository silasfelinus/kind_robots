import type { TrialResult } from './authoredBosses'
import type { JourneyStateV6, V6Result } from './deckV6'
import { JOURNEY_WORLD } from './journey'
import type { WorldEchoV7 } from './worldEchoesV7'

// First companion-contact arc. The kitchen sister already appears in
// "A Crust for the Road"; these beats remember her actual encounter and
// successive trial decisions. She is not a recruitable party member yet.
export const KITCHEN_NOVICE_QUEST_ID = 'kitchen-novice-road'

type Intro = { turn: number; trusted: boolean }
type PassedTrial = { turn: number; choiceId: string }

const humane = new Set([
  'witness',
  'solidarity',
  'evidence',
  'scout',
  'parley',
])
const coercive = new Set(['coerce', 'tribute'])

function introduction(state: JourneyStateV6): Intro | null {
  const result = state.outcomes.find(
    (entry): entry is V6Result =>
      entry.encounterId === 'a-crust-for-the-road' &&
      entry.locationId === 'wayside-refuge' &&
      (entry.choiceId === 'thank-with-bow' ||
        entry.choiceId === 'offer-help'),
  )
  if (!result || !result.roll || result.roll.success !== result.success)
    return null
  const expected =
    result.choiceId === 'thank-with-bow'
      ? result.success
        ? 'kitchen-novice-trust'
        : 'kitchen-novice-wary'
      : result.success
        ? 'refuge-locked-door-clue'
        : 'kitchen-novice-wary'
  if (!result.flags.includes(expected) || !state.flags.includes(expected))
    return null
  return { turn: result.turn, trusted: result.success }
}

function passedTrial(
  state: JourneyStateV6,
  trials: readonly TrialResult[],
  landId: string,
): PassedTrial | null {
  const land = JOURNEY_WORLD.lands.find((entry) => entry.id === landId)
  const boss = state.journey.bosses.find(
    (entry) =>
      entry.landId === landId &&
      entry.id === land?.boss.id &&
      entry.roll.success,
  )
  const result = trials.find(
    (entry) =>
      entry.landId === landId &&
      entry.bossId === boss?.id &&
      entry.turn === boss?.turn &&
      entry.roll.success &&
      entry.roll.landId === landId &&
      entry.roll.locationId === boss?.id,
  )
  return result ? { turn: result.turn, choiceId: result.choiceId } : null
}

function beat(
  id: string,
  landId: string,
  sourceLandId: string,
  sourceTurn: number,
  title: string,
  text: string,
  source: WorldEchoV7['source'] = 'trial',
): WorldEchoV7 {
  return {
    id: `${KITCHEN_NOVICE_QUEST_ID}-${id}`,
    landId,
    sourceLandId,
    sourceTurn,
    source,
    title,
    text,
  }
}

// Read-only projection from the V8 replay-verified ledger. The player makes
// the choices at the existing encounter and land trials; no hidden rolls,
// fabricated flags, retroactive bonuses or separate save key are introduced.
export function kitchenNoviceQuestEchoesV8(
  state: JourneyStateV6,
  trials: readonly TrialResult[],
): WorldEchoV7[] {
  const intro = introduction(state)
  const homestead = passedTrial(state, trials, 'homestead')
  if (!intro || !homestead || intro.turn >= homestead.turn) return []

  const echoes: WorldEchoV7[] = []
  if (state.journey.landIndex >= 1) {
    const trusted = intro.trusted
    const protectedPeople = humane.has(homestead.choiceId)
    const frightenedPeople = coercive.has(homestead.choiceId)
    const title = !trusted
      ? 'The kitchen sister keeps her distance'
      : protectedPeople
        ? 'The bread ledger crosses the river'
        : frightenedPeople
          ? 'A closed book at the ferry'
          : 'The sister at the landing'
    const text = !trusted
      ? 'At the ferry, the kitchen sister sets a wrapped list of missing travelers beside the clerk. She remembers how your meeting at the refuge ended. You may read the names with everyone else, but she does not entrust you with the book.'
      : protectedPeople
        ? 'The kitchen sister waits beside a shuttered ferry lamp with the names of those still missing from the refuge. You helped make room for witnesses at the Abbess\'s gate, so she lets you copy the list. She stays to find the families rather than joining your boat.'
        : frightenedPeople
          ? 'The kitchen sister reaches the ferry with her bread ledger hidden under a coat. She has heard what you paid or threatened to get through the refuge. When you ask for the names, she shuts the book and carries it to the public clerk instead.'
          : 'The kitchen sister arrives at the landing with a list of missing travelers. She remembers your help in the kitchen, but she has also heard how you opened the refuge gate. She leaves a copy for the ferry crews and asks you to keep your next promise in public.'
    echoes.push(
      beat(
        'crossing',
        'dustwater',
        'homestead',
        intro.turn,
        title,
        text,
        'encounter',
      ),
    )
  }

  const dustwater = passedTrial(state, trials, 'dustwater')
  if (!dustwater || dustwater.turn <= homestead.turn) return echoes
  if (state.journey.landIndex >= 2) {
    const repaired = humane.has(dustwater.choiceId)
    const harmed = coercive.has(dustwater.choiceId)
    const trusted = intro.trusted && humane.has(homestead.choiceId)
    const title = harmed
      ? 'The lantern goes the other way'
      : trusted && repaired
        ? 'Two lists at the canyon fire'
        : repaired
          ? 'A promise with a witness'
          : 'The sister keeps her own road'
    const text = harmed
      ? 'At the canyon fire, the kitchen sister finds the river families paying again for passage you bought or forced. She takes her lamp and the names she gathered toward their camp. She will not carry your message, though she keeps helping those who are stranded.'
      : trusted && repaired
        ? 'The kitchen sister spreads the refuge names beside the river crew\'s crossing list. You stood with witnesses at both gates; now two missing families are found among the caravan. She offers to carry the corrected list onward, but makes no promise to follow your orders.'
        : repaired
          ? 'At the canyon fire, the kitchen sister agrees to compare her refuge ledger with the river witnesses. She has not forgotten your earlier choices. She lets you hold the lamp while she reads, then takes it back before the caravan leaves.'
          : 'The kitchen sister brings her ledger to the canyon, but leaves it with the caravan elder. Your earlier help has not disappeared, and neither have the people left waiting at the river. She chooses a road where the names will be heard without you.'
    echoes.push(
      beat(
        'canyon',
        'tablelands',
        'dustwater',
        dustwater.turn,
        title,
        text,
      ),
    )
  }

  const tablelands = passedTrial(state, trials, 'tablelands')
  if (!tablelands || tablelands.turn <= dustwater.turn) return echoes
  if (state.journey.landIndex >= 3) {
    const earned =
      intro.trusted &&
      humane.has(homestead.choiceId) &&
      humane.has(dustwater.choiceId) &&
      humane.has(tablelands.choiceId)
    const broken = [homestead, dustwater, tablelands].some((result) =>
      coercive.has(result.choiceId),
    )
    echoes.push(
      beat(
        'cave',
        'cave',
        'tablelands',
        tablelands.turn,
        earned
          ? 'The sister brings the witnesses'
          : broken
            ? 'An ally you cannot command'
            : 'A lamp held at arm\'s length',
        earned
          ? 'At the cave court, the kitchen sister arrives with the two recovered families and a ledger everyone has signed. She stands beside you when the guards demand a single name to blame. She is an ally by choice, not a follower bought with bread, and stays with the families after the hearing.'
          : broken
            ? 'At the cave court, the kitchen sister carries the same lamp you saw at the refuge. She will testify for the missing families, but refuses to stand as your advocate. You can hear her evidence with the rest of the travelers; you cannot claim her trust.'
            : 'At the cave court, the kitchen sister sets her ledger before the witnesses and asks them to read every name. She allows you to help hold the lamp, but does not call the debt settled. Whatever you choose next must stand on its own.',
      ),
    )
  }
  return echoes
}
