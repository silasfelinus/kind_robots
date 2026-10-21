import {
  trialForLand,
  canChooseTrial,
  type AuthoredTrial,
  type TrialChoice,
} from './authoredBosses'
import type { JourneyStateV6 } from './deckV6'
import { JOURNEY_WORLD } from './journey'

export const TRIAL_RULES_V7 = 1

// These are new routes, never mutations of the V5-pinned authoredTrials.json.
// A witnessed appeal requires two real moral marks earned by encounters.
// Scouting requires a once-per-land, one-HP preparation action in the V7 ledger.
const WITNESS_SCENES: Record<
  string,
  {
    label: string
    success: string
    failure: string
  }
> = {
  homestead: {
    label: 'Bring the people you helped to witness',
    success:
      'The people whose burdens you carried stand together at the doorway. The Abbess cannot call them all liars. She opens the dormitory, not out of kindness, but because she has lost her power to keep it shut.',
    failure:
      'Your witnesses speak, but the guards divide them before they can be heard together. You get them clear of the courtyard at the price of your own strength.',
  },
  dustwater: {
    label: 'Let the travelers testify together',
    success:
      'The rescued boat crews name what each person was charged, then refuse to cross separately. The keeper faces a line of witnesses instead of one traveler and opens the gate to all of them.',
    failure:
      'The keeper demands a receipt for every story. You argue until the river rises and return to the bank exhausted; the crews remain ready to try again.',
  },
  tablelands: {
    label: 'Ask the caravan to stand as witnesses',
    success:
      'The caravan refuses to let the warden count its people as missing property. With every traveler watching, the barricade is lifted and the bridge belongs to the road again.',
    failure:
      'The warden questions every witness until the approaching storm scatters the caravan. You stay to help the last traveler clear the pass and withdraw bruised.',
  },
  cave: {
    label: 'Testify on behalf of the bound',
    success:
      'You recount the people who kept faith with one another aboveground. The court must weigh that witness against its old binding, and the guardian is released on a promise the judges must also keep.',
    failure:
      'The court calls kindness an unreliable witness. You refuse to abandon the guardian but the circle throws you back, shaking and sore.',
  },
  verge: {
    label: 'Carry the names of those who trusted you',
    success:
      'You speak the names of people you protected and promises you kept. The negotiator demands silence, but the people on the road answer for themselves. The gate opens because no single voice can bind them all.',
    failure:
      'The negotiator turns each remembered name into another weight on your shoulders. You stagger back, still free to speak, and must decide whether to try again.',
  },
}

const SCOUT_SCENES: Record<
  string,
  {
    label: string
    success: string
    failure: string
  }
> = {
  homestead: {
    label: 'Use the watch route you mapped',
    success:
      'Your patient survey reveals the patrol change beside the locked wing. You cross the courtyard between bells and open a way for the hidden children.',
    failure:
      'A second patrol arrives earlier than your map predicted. You retreat before the guards close the corridor, hurting from the scramble.',
  },
  dustwater: {
    label: 'Follow the counterweight rhythm',
    success:
      'You waited long enough to learn the winch sequence. When its chain slackens you guide the boats through the shallow channel, one careful crossing at a time.',
    failure:
      'The chain catches at the wrong moment. You are thrown from the wheel and limp back to the landing as the boats wait.',
  },
  tablelands: {
    label: 'Take the surveyed stone path',
    success:
      'You lead the weakest travelers along the ledge you measured before the storm. The warden looks down from the barricade as the caravan leaves without needing permission.',
    failure:
      'The ground you sounded is weaker than it seemed. You turn the others back just in time and stagger away with scraped hands.',
  },
  cave: {
    label: 'Read the circle you measured',
    success:
      'The judges have left a gap between two inscriptions. You found it while studying the court, and now use that gap to break the binding without drawing a blade.',
    failure:
      'Your mark on the floor points at a false gap. The court sends you reeling away from the captive, who remains bound.',
  },
  verge: {
    label: 'Cross by the seam you surveyed',
    success:
      'Your hours of patient study have shown where the seal was repaired. You press at its hidden seam, and the stone key turns without your surrendering a single name.',
    failure:
      'The seam shifts under your hand and the stone bites back. You withdraw injured, with enough of the pattern learned to know the threshold can be opened.',
  },
}

// Physical discoveries from V6 encounter cards belong to the matching trial.
// The V5/V6 original flag lists remain unmodified for restored old journeys.
const ADDITIONAL_EVIDENCE: Record<string, readonly string[]> = {
  homestead: [
    'the-infirmarys-last-cot-empty-wing',
    'the-guest-book-on-the-lectern-page-taken',
    'the-guest-book-on-the-lectern-blank-departures',
    'the-refuge-lantern-at-midnight-cart-track',
  ],
  dustwater: ['deed-knows-old-roads'],
  tablelands: ['deed-knows-old-roads'],
  cave: ['deed-told-truth'],
  verge: ['deed-kept-promise'],
}

export function trialForLandV7(landId: string): AuthoredTrial | null {
  const base = trialForLand(landId)
  const witness = WITNESS_SCENES[landId]
  const scout = SCOUT_SCENES[landId]
  if (!base || !witness || !scout) return null
  const evidence = ADDITIONAL_EVIDENCE[landId] ?? []
  const choices: TrialChoice[] = base.choices.map((choice) =>
    choice.id === 'evidence'
      ? {
          ...choice,
          requiredAnyFlags: [
            ...new Set([...choice.requiredAnyFlags, ...evidence]),
          ],
        }
      : { ...choice },
  )
  choices.push(
    {
      id: 'witness',
      label: witness.label,
      intent:
        'Call on people you helped or truths you defended. Requires at least two earned mercy or honesty marks; costs no provisions.',
      skill: 'bearing',
      target: landId === 'verge' ? 10 : 9,
      cost: 0,
      requiredAnyFlags: [],
      success: witness.success,
      failure: witness.failure,
    },
    {
      id: 'scout',
      label: scout.label,
      intent:
        'Use the pattern learned by spending one health to study this specific trial first.',
      skill: 'awareness',
      target: landId === 'verge' ? 9 : 8,
      cost: 0,
      requiredAnyFlags: [],
      success: scout.success,
      failure: scout.failure,
    },
  )
  return { ...base, choices }
}

export function canChooseTrialV7(
  choice: TrialChoice,
  state: JourneyStateV6,
  prepared: readonly string[],
): boolean {
  const landId = state.journey.phase === 'boss' ? state.journey.landIndex : -1
  if (
    choice.id === 'witness' &&
    Math.max(state.marks.mercy, state.marks.honesty) < 2
  )
    return false
  if (choice.id === 'scout' && !prepared.includes(landIdToName(landId)))
    return false
  return canChooseTrial(choice, state.flags, state.journey.provisions)
}

function landIdToName(index: number): string {
  return JOURNEY_WORLD.lands[index]?.id ?? ''
}

export function canPrepareTrialV7(
  state: JourneyStateV6,
  prepared: readonly string[],
): boolean {
  const journey = state.journey
  const land = JOURNEY_WORLD.lands[journey.landIndex]
  return (
    journey.phase === 'boss' &&
    journey.hp >= 3 &&
    !!land &&
    !prepared.includes(land.id)
  )
}
