import { ACT_ONE_DAYS, ACT_ONE_QUESTS } from './actOne'
import { ACT_ONE_LATE_DAYS, ACT_ONE_LATE_QUESTS } from './actOneLate'
import { ACT_TWO_DAYS, ACT_TWO_QUESTS } from './actTwo'
import { ACT_THREE_DAYS, ACT_THREE_QUESTS } from './actThree'
import type { DayDef, QuestDef } from './types'

// Seeded wasteland chores drawn at dawn. Each draw depends on the run's seed
// and branch, so a rewound day can post different ones.
export const QUEST_TEMPLATES: readonly QuestDef[] = [
  {
    id: 'r-bandit-sighting',
    title: 'Bandits on the Saltroad',
    summary:
      'A caravan master reports armed strangers shadowing the trade road. Drive them off before they pick a target.',
    region: 'saltroad',
    faction: 'saltroad',
    durationDays: 1,
    boardDays: 2,
    party: { min: 1, max: 3 },
    requirements: [
      { stat: 'might', band: 'mid' },
      { stat: 'guile', band: 'low' },
    ],
    danger: 'mid',
    tags: ['defense'],
    rewards: {
      success: { brass: 15, affinity: { saltroad: 5 } },
      failure: { affinity: { saltroad: -3 } },
    },
    expired: { affinity: { saltroad: -3 } },
    outcomes: {
      success:
        'The strangers fled into the hills, leaving a cookpot and a very good hat.',
      partial: 'The strangers moved on, but not far.',
      failure: 'The strangers were better armed than the report said.',
      expired: 'The caravan master hired someone else, and told everyone why.',
    },
  },
  {
    id: 'r-sick-herd',
    title: 'A Sick Herd',
    summary:
      'A Freehold herd is coughing blood. Find out why before it spreads.',
    region: 'east-ford',
    faction: 'freeholds',
    durationDays: 2,
    boardDays: 2,
    party: { min: 1, max: 2 },
    requirements: [
      { stat: 'wits', band: 'mid' },
      { stat: 'lore', band: 'low', hidden: true },
    ],
    danger: 'low',
    tags: ['medicine'],
    rewards: {
      success: { brass: 10, affinity: { freeholds: 8 }, local: { yard: 1 } },
      failure: { affinity: { freeholds: -3 } },
    },
    expired: { affinity: { freeholds: -5 } },
    outcomes: {
      success: 'Bad water from a cracked cistern. The herd will live.',
      partial: 'Half the herd recovered.',
      failure: 'Nobody could say what was wrong. The herd was burned.',
      expired: 'The cough spread to the next farm.',
    },
  },
  {
    id: 'r-lost-caravan',
    title: 'The Late Caravan',
    summary:
      'A Saltroad caravan is three days late. Find the tracks before the wind does.',
    region: 'saltroad',
    faction: 'saltroad',
    durationDays: 2,
    boardDays: 2,
    party: { min: 1, max: 3 },
    requirements: [
      { stat: 'guile', band: 'mid' },
      { stat: 'wits', band: 'low' },
    ],
    danger: 'mid',
    tags: ['tracking'],
    rewards: {
      triumph: { brass: 25, affinity: { saltroad: 10 } },
      success: { brass: 15, affinity: { saltroad: 8 } },
      failure: { affinity: { saltroad: -5 } },
    },
    expired: { affinity: { saltroad: -5 } },
    outcomes: {
      triumph:
        'The caravan was stuck in a dry wash, intact, and very glad to see anyone.',
      success: 'The caravan is found, minus two wagons.',
      partial: 'The tracks led to one abandoned wagon.',
      failure: 'The wind took the tracks.',
      expired: 'The caravan never arrived.',
    },
  },
  {
    id: 'r-boundary-dispute',
    title: 'A Fence in the Wrong Place',
    summary:
      'Two Hollow Bell families both claim the same well, and one of them has built a fence around it.',
    region: 'hollow-bell',
    faction: 'hollow-bell',
    durationDays: 1,
    boardDays: 2,
    party: { min: 1, max: 2 },
    requirements: [{ stat: 'heart', band: 'mid' }],
    danger: 'none',
    tags: ['negotiation'],
    rewards: {
      success: {
        brass: 5,
        affinity: { 'hollow-bell': 6 },
        local: { 'old-houses': 1 },
      },
      failure: { affinity: { 'hollow-bell': -3 } },
    },
    expired: { affinity: { 'hollow-bell': -2 } },
    outcomes: {
      success: 'The fence is now a gate, and both families have a key.',
      partial: 'The fence stays. The shouting stops.',
      failure: 'The fence is now a wall.',
      expired: 'The families settled it themselves, with shovels.',
    },
  },
  {
    id: 'r-strange-relic',
    title: 'Glass That Does Not Break',
    summary:
      'Salvagers dug up a pane of old-world glass that will not shatter. The Archive wants it studied before it is sold.',
    region: 'rail-yards',
    durationDays: 2,
    boardDays: 2,
    party: { min: 1, max: 2 },
    requirements: [
      { stat: 'lore', band: 'mid' },
      { stat: 'wits', band: 'low' },
    ],
    danger: 'low',
    tags: ['records'],
    rewards: {
      success: { local: { lamplight: 3 } },
      failure: { local: { lamplight: -1 } },
    },
    expired: { local: { lamplight: -1 } },
    outcomes: {
      success:
        'The glass is catalogued. It hums, very faintly, when the bell rings.',
      partial: 'The glass is catalogued, roughly.',
      failure: 'The salvagers sold it before anyone arrived.',
      expired: 'The salvagers sold it.',
    },
  },
]

const QUEST_INDEX = new Map<string, QuestDef>(
  [
    ...ACT_ONE_QUESTS,
    ...ACT_ONE_LATE_QUESTS,
    ...ACT_TWO_QUESTS,
    ...ACT_THREE_QUESTS,
    ...QUEST_TEMPLATES,
  ].map((quest) => [quest.id, quest]),
)

/** Template instances are `${templateId}@${day}`. */
export const questDef = (id: string): QuestDef | undefined =>
  QUEST_INDEX.get(id.split('@')[0] ?? id)

export const isTemplateInstance = (id: string): boolean => id.includes('@')

export const DAYS: readonly DayDef[] = [
  ...ACT_ONE_DAYS,
  ...ACT_ONE_LATE_DAYS,
  ...ACT_TWO_DAYS,
  ...ACT_THREE_DAYS,
]

export const dayDef = (day: number): DayDef | undefined =>
  DAYS.find((entry) => entry.day === day)

export const LAST_DAY = 50
