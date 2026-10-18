import type { Briefing } from './dayOne'
import type { Incident } from './types'

export const DAY_FOUR_BRIEFINGS: readonly Briefing[] = [
  {
    id: 'ford-toll-flags',
    source: 'Eastern Ford ferrymen',
    text: 'Strangers in clean boots are planting survey flags along the far bank of the ford.',
    truth: true,
  },
  {
    id: 'crow-sky-silent',
    source: 'A Storm Crow fledgling',
    text: 'Every crow on the Heights has gone quiet at once, and the elders will not say why.',
    truth: true,
  },
  {
    id: 'jackal-peace-feast',
    source: 'A wagon-painter for hire',
    text: 'The Jackalwire Pack has laid down every blade and wants only to feast with the tower.',
    truth: false,
  },
]

export const KOMODO_DAY_FOUR_HINT =
  'Survey flags cost money and silence costs nerve, so both of those are real. A raider pack that wants only a feast has never existed, Your Majesty. Count your spoons before you attend.'

export const DAY_FOUR_INCIDENTS: readonly Incident[] = [
  {
    id: 'd004-survey-flags',
    day: 4,
    title: 'Flags on the Far Bank',
    destinationId: 'east-ford',
    opensAtHour: 7,
    deadlineHour: 13,
    outwardHours: 1,
    missionHours: 2,
    hordeMinimum: 3,
    hordeMaximum: 10,
    neglected: { prosperity: -4, popularity: -1 },
    choices: [
      {
        id: 'trace-the-surveyors',
        label: 'Follow the surveyors back and read whose seal is on their maps',
        approach: 'ingenuity',
        difficulty: 3,
        specialty: 'archives',
        moralEffect: { popularity: 1 },
        success: { prosperity: 5 },
        failure: { prosperity: -2 },
        injuryDaysOnFailure: 0,
      },
      {
        id: 'pull-the-flags',
        label: 'Pull every flag at dawn and post the Horde on the bank',
        approach: 'might',
        difficulty: 3,
        moralEffect: { popularity: -2 },
        success: { prosperity: 3, horde: 1 },
        failure: { popularity: -3, horde: -2 },
        injuryDaysOnFailure: 1,
      },
    ],
  },
  {
    id: 'd004-silent-crows',
    day: 4,
    title: 'The Silent Heights',
    destinationId: 'storm-crow-heights',
    opensAtHour: 8,
    deadlineHour: 17,
    outwardHours: 3,
    missionHours: 2,
    hordeMinimum: 2,
    hordeMaximum: 8,
    neglected: { popularity: -3, prosperity: -2 },
    choices: [
      {
        id: 'sit-with-the-elders',
        label: 'Sit with the elders on the cold ledge until someone speaks',
        approach: 'diplomacy',
        difficulty: 4,
        moralEffect: { popularity: 2 },
        success: { popularity: 3, prosperity: 3 },
        failure: { popularity: -2 },
        injuryDaysOnFailure: 0,
      },
      {
        id: 'climb-the-roost',
        label: 'Climb to the high roost and see what the crows are watching',
        approach: 'might',
        difficulty: 4,
        moralEffect: { popularity: 0 },
        success: { prosperity: 5 },
        failure: { horde: -2, prosperity: -1 },
        injuryDaysOnFailure: 2,
      },
    ],
  },
  {
    id: 'd004-painted-feast',
    day: 4,
    title: 'A Feast Under Painted Wagons',
    destinationId: 'jackalwire',
    opensAtHour: 11,
    deadlineHour: 20,
    outwardHours: 4,
    missionHours: 3,
    hordeMinimum: 6,
    hordeMaximum: 16,
    neglected: { horde: -3, prosperity: -3 },
    choices: [
      {
        id: 'attend-armed',
        label: 'Attend the feast with the Horde hidden in the supply carts',
        approach: 'might',
        difficulty: 4,
        moralEffect: { popularity: -2 },
        success: { prosperity: 4, horde: 2 },
        failure: { horde: -5, popularity: -2 },
        injuryDaysOnFailure: 3,
      },
      {
        id: 'bring-gifts',
        label:
          'Arrive unarmed with grain and wine and ask what they truly want',
        approach: 'diplomacy',
        difficulty: 5,
        moralEffect: { popularity: 2 },
        success: { popularity: 3, prosperity: 3, horde: 2 },
        failure: { prosperity: -3, popularity: -1 },
        injuryDaysOnFailure: 1,
      },
    ],
  },
]
