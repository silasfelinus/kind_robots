import { LENSES, type Choice, type EncounterCard, type LensId } from './content'

/**
 * The seven-lens opening is a perspective selection, not a seven-branch quest.
 * Existing route-specific outcomes stay intact; these authored supplements
 * provide the missing perspectives without creating extra story cards.
 * Saved opening IDs, route indices, skill checks and art keys remain stable.
 */
export const OPENING_LENS_ADDITIONS: Record<string, Choice[]> = {
  'GR-2': [
    {
      id: 'fair-tipsy',
      label: 'Tipsy: stay for a toast and hear the volunteer announcements',
      lens: 'tipsy',
      check: { skill: 'rizz', target: 7 },
      success: {
        text: 'The toast somehow becomes a public vote on whether the fair needs a second first-aid station. You listen to the volunteers, take the minutes, and learn that democracy is mostly folding chairs.',
        effects: { goodwill: 1, flag: 'fair_second_station' },
      },
      failure: {
        text: 'You mistake a volunteer announcement for an encore. The crew corrects you, kindly, and hands you the actual schedule. The band still gets its encore.',
        effects: { nerve: 1, flag: 'fair_corrected_schedule' },
      },
    },
    {
      id: 'fair-cocaine',
      label:
        'Cocaine: slow the festival rush long enough to verify the schedule',
      lens: 'cocaine',
      check: { skill: 'wits', target: 9 },
      success: {
        text: 'Three urgent deadlines turn out to be one poster printed three times. A stage manager checks your amended schedule. There is room for everyone after all, even the puppet nobody remembers hiring.',
        effects: {
          evidence: 'The independently checked fair timetable',
          flag: 'fair_schedule_verified',
        },
      },
      failure: {
        text: 'You announce a solution a minute too early. The sound engineer spots the problem, and you let her correct it in public. The festival survives the embarrassment.',
        effects: { flag: 'fair_rushed_correction' },
      },
    },
    {
      id: 'fair-mdma',
      label: 'MDMA: offer to help without mistaking warmth for permission',
      lens: 'mdma',
      check: { skill: 'rizz', target: 9 },
      success: {
        text: 'The performers appreciate your kindness but request a written access agreement, not a group hug. You help draft one, and everyone gets to keep their boundaries.',
        effects: { goodwill: 1, flag: 'fair_consent_agreement' },
      },
      failure: {
        text: 'You invite strangers into a big shared plan. Two decline. You thank them for saying so and help the willing volunteers find water, chairs and an actual point of contact.',
        effects: { flag: 'fair_respected_no' },
      },
    },
  ],
  'KN-2': [
    {
      id: 'race-stoned',
      label: 'Stoned: watch the costumes and catch the rhythm underneath',
      lens: 'stoned',
      check: { skill: 'psyche', target: 9 },
      success: {
        text: 'The dancing shrimp has exactly the same little hesitation as the generator by the door. Cedar checks the motor before anyone declares it supernatural. It is still quite strange.',
        effects: {
          evidence: 'A shared rhythm between the shrimp and generator',
          flag: 'race_pattern_checked',
        },
      },
      failure: {
        text: 'You spend a while puzzling over a loose propeller on the floor. A mechanic shows you where it belongs. The best discovery tonight is that someone labeled the parts.',
        effects: { nerve: 1, flag: 'race_propeller_labeled' },
      },
    },
    {
      id: 'race-tripping',
      label: 'Tripping: follow the painted shadows without following strangers',
      lens: 'tripping_balls',
      check: { skill: 'psyche', target: 9 },
      success: {
        text: 'The painted fish on the warehouse wall swims against its own shadow. A sober photographer captures the same frame. Nobody can agree what it means, which feels unusually democratic.',
        effects: {
          evidence: 'A photographed fish moving against its shadow',
          weird: 1,
        },
      },
      failure: {
        text: 'For one dizzy minute the warehouse has a second ceiling. You sit down, drink water, and let the tuba player point out the actual exit. The night remains gloriously unfinished.',
        effects: { flag: 'race_second_ceiling' },
      },
    },
    {
      id: 'race-meth',
      label: 'Meth: share the overnight watch before it becomes a dare',
      lens: 'meth',
      check: { skill: 'lore', target: 9 },
      success: {
        text: 'The radio keeps predicting tomorrow twice. You write down both reports and ask a rested marshal to verify the frequency. The marshal insists you take a break and does not make it a judgment.',
        effects: {
          evidence: 'Two independently compared race radio forecasts',
          flag: 'race_night_watch',
        },
      },
      failure: {
        text: 'The same weather announcement comes around until every word seems urgent. You hand the radio to the next shift. They find a broken playback switch and another unexplained voice.',
        effects: { flag: 'race_watch_handoff' },
      },
    },
  ],
  'QW-2': [
    {
      id: 'quiet-tipsy',
      label: 'Tipsy: accept the picnic invitation but keep the walk your own',
      lens: 'tipsy',
      check: { skill: 'rizz', target: 7 },
      success: {
        text: 'An elderly walker introduces you to three neighbors and a dog with a fake parking permit. The dog is not authorized to comment on the tide. Everybody laughs and leaves the birds alone.',
        effects: { goodwill: 1, flag: 'quiet_picnic_neighbors' },
      },
      failure: {
        text: 'You make a joke the others cannot hear over the reeds. Rather than repeat it louder, you ask about the trail. Someone gives you a useful map and an embarrassing nickname.',
        effects: { evidence: 'A hand-marked path above the slough' },
      },
    },
    {
      id: 'quiet-cocaine',
      label: 'Cocaine: stop counting minutes and check the tide marker',
      lens: 'cocaine',
      check: { skill: 'wits', target: 9 },
      success: {
        text: 'The tide marker is exactly forty minutes ahead of the posted chart. You double-check against a second gauge and leave a note for the next visitor, who will have fewer reasons to hurry.',
        effects: {
          evidence: 'Cross-checked tide marker discrepancy',
          flag: 'quiet_tide_recorded',
        },
      },
      failure: {
        text: 'Your first reading is off by a notch. A passing birdwatcher corrects you and shows where the gauge is repaired each spring. You write down her name instead of defending the mistake.',
        effects: { flag: 'quiet_tide_correction' },
      },
    },
    {
      id: 'quiet-meth',
      label:
        'Meth: sit out the noise and let a rested neighbor verify the signs',
      lens: 'meth',
      check: { skill: 'lore', target: 9 },
      success: {
        text: 'You note that the posted trail hours disagree with the maintenance notice. A rested ranger verifies both with the district office. The marsh was not trying to trick you; the printer was.',
        effects: {
          evidence: 'Verified marsh notice discrepancy',
          flag: 'quiet_signs_verified',
        },
      },
      failure: {
        text: 'The letters on the sign refuse to stay put. You choose a quiet bench and ask someone else to read them. The answer is ordinary, the relief entirely real.',
        effects: { nerve: 1, flag: 'quiet_rest_accepted' },
      },
    },
    {
      id: 'quiet-mdma',
      label:
        'MDMA: share the bench without asking the stranger to share a life',
      lens: 'mdma',
      check: { skill: 'rizz', target: 9 },
      success: {
        text: 'You and a stranger quietly clean up some plastic caught in the reeds. They tell you their first name and nothing else. It feels generous to leave the story at that.',
        effects: { goodwill: 1, flag: 'quiet_shared_care' },
      },
      failure: {
        text: 'You offer a heartfelt account of the bay. The stranger prefers silence, and you respect it. Later they point out a heron you would have walked right past.',
        effects: { flag: 'quiet_space_respected' },
      },
    },
  ],
}

/** Only these three specific beats select the permanent opening perspective. */
export function openingLensChoices(card: EncounterCard): Choice[] {
  const additions = OPENING_LENS_ADDITIONS[card.id]
  if (!additions) return card.choices
  const authored = [...card.choices, ...additions].filter(
    (choice) => choice.lens && !choice.locked,
  )
  return LENSES.filter((lens) => lens.open).flatMap((lens) =>
    authored.filter((choice) => choice.lens === lens.id),
  )
}

export function availableOpeningLenses(card: EncounterCard): LensId[] {
  return openingLensChoices(card).flatMap((choice) =>
    choice.lens ? [choice.lens] : [],
  )
}
