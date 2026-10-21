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

// In this world it is cheap to move the cost onto someone with less power.
// These shortcuts are real mechanical advantages, with records that the
// ending must remember. The routes do not alter V5/V6 authored trials.
const DARK_SCENES: Record<string, {
  tribute: { label: string; success: string; failure: string }
  coerce: { label: string; success: string; failure: string }
}> = {
  homestead: {
    tribute: {
      label: 'Buy the Abbess\'s silence',
      success: 'You pass a ration to the keeper of the records. He hands you the dormitory key and erases your name, but the other locked doors remain locked.',
      failure: 'The keeper accepts your ration, then demands a second payment. You escape his guards without the key.',
    },
    coerce: {
      label: 'Make a frightened novice open the door',
      success: 'The novice obeys before a guard can shout. You step into the corridor while they are left to explain their trembling hands.',
      failure: 'The novice freezes under your threat. The guards arrive, and you retreat while the novice takes the blame.',
    },
  },
  dustwater: {
    tribute: {
      label: 'Purchase the first place in the crossing',
      success: 'The keeper moves the gate for you and closes it again behind your boat. The stranded families wait in the rising water.',
      failure: 'The keeper pockets your food and claims the current is too swift. The stranded families see who tried to buy their place.',
    },
    coerce: {
      label: 'Force the smallest boat to take the danger',
      success: 'The unwilling pilot tests the current for you. You follow the safe wake to shore, hearing the pilot still calling for help.',
      failure: 'The pilot refuses and the river flings you against the stones. Your threat has bought no passage.',
    },
  },
  tablelands: {
    tribute: {
      label: 'Buy passage past the caravan',
      success: 'The warden pockets your ration and raises the bar for you alone. The caravan stays under the storm clouds.',
      failure: 'The warden eats your offered ration and keeps the barricade closed. The caravan watches your private bargain fail.',
    },
    coerce: {
      label: 'Put the caravan between you and the guards',
      success: 'The escorts turn to contain the frightened caravan. You slip across the unguarded bridge while their shouting follows you.',
      failure: 'The escorts hold their line. A traveler trips in the crush you caused, and you limp back before the bridge.',
    },
  },
  cave: {
    tribute: {
      label: 'Purchase a false verdict',
      success: 'An adjudicator changes one line of the verdict for the food you offered. You walk free while the bound guardian remains.',
      failure: 'The food disappears into the court and no sentence changes. Your offer stains the oath you tried to buy.',
    },
    coerce: {
      label: 'Offer the guardian in your place',
      success: 'The court takes the captive as its surety and opens the passage for you. The guardian will remember the bargain.',
      failure: 'The guardian refuses the terms, and the court drives you back into the cold corridors.',
    },
  },
  verge: {
    tribute: {
      label: 'Pay the gate with another\'s future',
      success: 'The negotiator accepts the provision and the promise you had no right to trade. The door opens. Behind it you hear a name being struck from a book.',
      failure: 'The key turns halfway and stops. You lose the ration, and the name you offered hangs unanswered in the stone.',
    },
    coerce: {
      label: 'Leave someone else to hold the seal',
      success: 'You force a fellow traveler against the hinge-less door. It opens for you while they struggle beneath its weight, and you do not turn back.',
      failure: 'Your chosen hostage breaks free. The threshold throws you backward, and there is no one left willing to help you stand.',
    },
  },
}

const SOLIDARITY_SCENES: Record<string, { label: string; success: string; failure: string }> = {
  homestead: {
    label: 'Return with the refuge united',
    success: 'The families come with names and lanterns, and refuse to leave until the children are counted. The Abbess opens the wing before witnesses she cannot separate.',
    failure: 'The guards drive the families back, but they stay to help each other to safety. The doors remain shut for another night.',
  },
  dustwater: {
    label: 'Organize a crossing for everyone',
    success: 'The boat crews work the chain together. The gate opens for the last, slowest vessel as surely as it opens for yours.',
    failure: 'The keeper scatters the crews before they can lift the chain. They retreat together, unwilling to leave the smallest boat behind.',
  },
  tablelands: {
    label: 'Stand with the whole caravan',
    success: 'The travelers join hands at the bridge and demand one crossing for all. The warden must give way or reveal the cruelty of the order.',
    failure: 'The warden holds the span, and you shoulder the wounded back through the rain without abandoning anyone.',
  },
  cave: {
    label: 'Call the witnesses the court ignored',
    success: 'Every voice the court excluded speaks in turn. The judgment is rewritten in public, and the guardian walks out among them.',
    failure: 'The court seals its ears, but the witnesses carry the account away and keep one another safe from reprisal.',
  },
  verge: {
    label: 'Open the passage without leaving anyone',
    success: 'No one signs the demand for silence. Those who crossed the wastes beside you shoulder the door until it opens wide enough for all of you.',
    failure: 'You refuse the easy solitary crossing. The door stays shut, and your companions help you stand for another try.',
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
  const dark = DARK_SCENES[landId]
  const solidarity = SOLIDARITY_SCENES[landId]
  if (!base || !witness || !scout || !dark || !solidarity) return null
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
      target: landId === 'verge' ? 11 : 10,
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
      target: landId === 'verge' ? 11 : 9,
      cost: 0,
      requiredAnyFlags: [],
      success: scout.success,
      failure: scout.failure,
    },
  )
  choices.push(
    {
      id: 'tribute',
      label: dark.tribute.label,
      intent: 'Spend 1 provision to buy priority while other people bear the consequences. Easy Wits check; your bargain becomes part of your story.',
      skill: 'wits',
      target: 7,
      cost: 1,
      requiredAnyFlags: [],
      success: dark.tribute.success,
      failure: dark.tribute.failure,
    },
    {
      id: 'coerce',
      label: dark.coerce.label,
      intent: 'Shift the danger onto another traveler. An easier Steel check at no material cost; your cruelty will be remembered.',
      skill: 'steel',
      target: 8,
      cost: 0,
      requiredAnyFlags: [],
      success: dark.coerce.success,
      failure: dark.coerce.failure,
    },
    {
      id: 'solidarity',
      label: solidarity.label,
      intent: 'Requires four mercy and two honesty marks from real encounters. Organize those you protected for a hard-won collective route.',
      skill: 'bearing',
      target: landId === 'verge' ? 10 : 9,
      cost: 0,
      requiredAnyFlags: [],
      success: solidarity.success,
      failure: solidarity.failure,
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
  if (
    choice.id === 'solidarity' &&
    (state.marks.mercy < 4 || state.marks.honesty < 2)
  ) return false
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
