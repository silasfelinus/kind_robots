import type { Incident } from './types'

export type Briefing = {
  id: string
  source: string
  text: string
  truth: boolean
}

export const DAY_ONE_BRIEFINGS: readonly Briefing[] = [
  {
    id: 'aqueduct',
    source: 'Hollow Bell surveyors',
    text: 'The eastern aqueduct is leaking into the old roadbed.',
    truth: true,
  },
  {
    id: 'silver-bell',
    source: 'An overexcited court herald',
    text: 'Hollow Bell cast its famous bell from pure silver.',
    truth: false,
  },
  {
    id: 'wagons',
    source: 'Border outriders',
    text: 'Painted Jackalwire wagons have assembled by the southern toll bridge.',
    truth: true,
  },
]

export const KOMODO_DAY_ONE_HINT =
  'The outriders agree about those wagons. The silver-bell story sounds expensive for a town that cannot repair its own pipes. Watch the roads, Your Majesty.'

export const DAY_ONE_INCIDENTS: readonly Incident[] = [
  {
    id: 'd001-aqueduct',
    day: 1,
    title: 'The Broken Aqueduct',
    destinationId: 'hollow-bell',
    opensAtHour: 7,
    deadlineHour: 14,
    outwardHours: 2,
    missionHours: 2,
    hordeMinimum: 5,
    hordeMaximum: 20,
    neglected: { prosperity: -4, popularity: -5 },
    choices: [
      {
        id: 'repair',
        label: 'Send engineers to repair the channel',
        approach: 'ingenuity',
        difficulty: 3,
        specialty: 'mechanics',
        moralEffect: { popularity: 2 },
        success: { prosperity: 5 },
        failure: { prosperity: -2, horde: -2 },
        injuryDaysOnFailure: 2,
      },
      {
        id: 'levy',
        label: 'Levy the town for emergency repairs',
        approach: 'diplomacy',
        difficulty: 2,
        moralEffect: { popularity: -4 },
        success: { prosperity: 7 },
        failure: { prosperity: -4, popularity: -2 },
        injuryDaysOnFailure: 1,
      },
    ],
  },
  {
    id: 'd001-toll',
    day: 1,
    title: 'Painted Wagons at the Toll',
    destinationId: 'jackalwire',
    opensAtHour: 9,
    deadlineHour: 18,
    outwardHours: 4,
    missionHours: 1,
    hordeMinimum: 8,
    hordeMaximum: 24,
    neglected: { popularity: -3, horde: -5 },
    choices: [
      {
        id: 'parley',
        label: 'Offer safe passage in exchange for an armistice',
        approach: 'diplomacy',
        difficulty: 4,
        moralEffect: { popularity: 1 },
        success: { prosperity: 2, horde: 1 },
        failure: { prosperity: -3, horde: -2 },
        injuryDaysOnFailure: 2,
      },
      {
        id: 'break-toll',
        label: 'Break the blockade by force',
        approach: 'might',
        difficulty: 3,
        moralEffect: { popularity: -3 },
        success: { prosperity: 4, horde: -1 },
        failure: { horde: -6, popularity: -2 },
        injuryDaysOnFailure: 4,
      },
    ],
  },
  {
    id: 'd001-mirefen',
    day: 1,
    title: 'Lanterns on the Mirefen Road',
    destinationId: 'mirefen',
    opensAtHour: 11,
    deadlineHour: 20,
    outwardHours: 5,
    missionHours: 2,
    hordeMinimum: 5,
    hordeMaximum: 15,
    neglected: { popularity: -2 },
    choices: [
      {
        id: 'escort',
        label: 'Escort the swamp refugees without asking their secrets',
        approach: 'diplomacy',
        difficulty: 3,
        moralEffect: { popularity: 3 },
        success: { prosperity: 1 },
        failure: { prosperity: -2, horde: -2 },
        injuryDaysOnFailure: 2,
      },
      {
        id: 'question',
        label: 'Inspect the lanterns and record every traveler',
        approach: 'ingenuity',
        difficulty: 4,
        specialty: 'archives',
        moralEffect: { popularity: -1 },
        success: { prosperity: 3 },
        failure: { popularity: -2 },
        injuryDaysOnFailure: 1,
      },
    ],
  },
]
