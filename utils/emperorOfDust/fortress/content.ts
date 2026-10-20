import { ACT_ONE_DAYS, ACT_ONE_QUESTS } from './actOne'
import { ACT_ONE_LATE_DAYS, ACT_ONE_LATE_QUESTS } from './actOneLate'
import { ACT_TWO_DAYS, ACT_TWO_QUESTS } from './actTwo'
import { ACT_THREE_DAYS, ACT_THREE_QUESTS } from './actThree'
import { ACT_FOUR_DAYS, ACT_FOUR_QUESTS } from './actFour'
import { ACT_FIVE_DAYS, ACT_FIVE_QUESTS } from './actFive'
import type { AudienceDef, DayDef, QuestDef } from './types'
import { editChoices, liveTextStore } from '../../playbook/textOverlay'

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
      success: { brass: 15, affinity: { saltroad: 3 } },
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
      success: { brass: 10, affinity: { freeholds: 3 }, local: { yard: 1 } },
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
      triumph: { brass: 25, affinity: { saltroad: 5 } },
      success: { brass: 15, affinity: { saltroad: 3 } },
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
        affinity: { 'hollow-bell': 3 },
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
  {
    id: 'r-roost-storm',
    title: 'A Roost in the Storm',
    summary:
      'Lightning split a Storm Crow roost on the Heights, and the fledglings are on the ledge below it. The Crows will not ask for help. Go anyway.',
    region: 'storm-crow-heights',
    faction: 'storm-crows',
    durationDays: 1,
    boardDays: 2,
    party: { min: 1, max: 2 },
    requirements: [
      { stat: 'might', band: 'low' },
      { stat: 'heart', band: 'mid' },
    ],
    danger: 'low',
    tags: ['weather'],
    rewards: {
      success: { brass: 5, affinity: { 'storm-crows': 3 } },
      failure: { affinity: { 'storm-crows': -2 } },
    },
    expired: { affinity: { 'storm-crows': -2 } },
    outcomes: {
      success:
        'Every fledgling is back in a dry nest. An old crow watched the whole climb and said nothing, which from a Crow is thanks.',
      partial: 'Most of the fledglings were brought up. The ledge kept one.',
      failure:
        'The ledge was slicker than it looked. The Crows took it from there.',
      expired: 'The Crows managed alone, and noted who did not come.',
    },
  },
  {
    id: 'r-fen-lantern',
    title: 'A Lantern Gone Out',
    summary:
      'One of the green lanterns on the Mirefen causeway has gone dark, and travellers are walking off the path. Relight it before someone drowns.',
    region: 'mirefen',
    faction: 'mire-mothers',
    durationDays: 1,
    boardDays: 2,
    party: { min: 1, max: 2 },
    requirements: [
      { stat: 'lore', band: 'mid' },
      { stat: 'wits', band: 'low' },
    ],
    danger: 'low',
    tags: ['tracking'],
    rewards: {
      success: { affinity: { 'mire-mothers': 3 }, local: { lamplight: 1 } },
      failure: { affinity: { 'mire-mothers': -2 } },
    },
    expired: { affinity: { 'mire-mothers': -2 } },
    outcomes: {
      success:
        'The lantern burns green again. Nobody saw who filled it, but the reeds bent toward the tower all evening.',
      partial: 'The lantern flickers. It will last a few nights.',
      failure: 'The wick would not take. The causeway stays dark.',
      expired:
        'Someone walked off the path that night. The fen did not give them back.',
    },
  },
  {
    id: 'r-wagon-escort',
    title: 'An Escort for the Painted Wagons',
    summary:
      'A Jackalwire wagon wants to cross Freehold land to sell scrap at the Ford, and nobody will let it pass without a crown escort.',
    region: 'jackalwire',
    faction: 'jackalwire',
    durationDays: 1,
    boardDays: 2,
    party: { min: 1, max: 2 },
    requirements: [
      { stat: 'guile', band: 'mid' },
      { stat: 'might', band: 'low' },
    ],
    danger: 'low',
    tags: ['negotiation'],
    rewards: {
      success: { brass: 10, affinity: { jackalwire: 3 } },
      failure: { affinity: { jackalwire: -2, freeholds: -2 } },
    },
    expired: { affinity: { jackalwire: -2 } },
    outcomes: {
      success:
        'The wagon reached the Ford, sold everything, and left before anyone could change their mind. The Pack sends a painted hubcap by way of thanks.',
      partial: 'The wagon got through, minus a wheel and most of its temper.',
      failure: 'A Freehold farmer and a Pack driver came to blows at the gate.',
      expired: 'The wagon turned back, and the Pack blamed the crown.',
    },
  },
  {
    id: 'r-tunnel-rescue',
    title: 'A Tunnel Caved In',
    summary:
      'A side tunnel under the badlands came down in the night with two Mole diggers behind it. The Moles are digging. They need more hands.',
    region: 'mole-tunnels',
    faction: 'moles',
    durationDays: 1,
    boardDays: 1,
    party: { min: 1, max: 3 },
    requirements: [
      { stat: 'might', band: 'mid' },
      { stat: 'wits', band: 'low' },
    ],
    danger: 'mid',
    tags: ['tunnels', 'urgent'],
    rewards: {
      success: { affinity: { moles: 3 }, local: { yard: 1 } },
      failure: { affinity: { moles: -2 } },
    },
    expired: { affinity: { moles: -3 } },
    outcomes: {
      success:
        'Both diggers came out blinking and furious about the delay. Granny Umber sent a jar of honey up to the tower.',
      partial:
        'One digger came out. The Moles are still digging for the other.',
      failure: 'The roof came down again before anyone reached them.',
      expired: 'The Moles dug alone, all night.',
    },
  },
  {
    id: 'r-salvage-claim',
    title: 'A Disputed Salvage Claim',
    summary:
      'Two Rustline crews both say they found the same derailed engine first. Settle it before they settle it with crowbars.',
    region: 'rail-yards',
    faction: 'rustline',
    durationDays: 1,
    boardDays: 2,
    party: { min: 1, max: 2 },
    requirements: [
      { stat: 'wits', band: 'mid' },
      { stat: 'heart', band: 'low' },
    ],
    danger: 'none',
    tags: ['negotiation', 'records'],
    rewards: {
      success: { brass: 5, affinity: { rustline: 3 } },
      failure: { affinity: { rustline: -2 } },
    },
    expired: { affinity: { rustline: -2 } },
    outcomes: {
      success:
        'The engine was split down the middle, exactly, with a chalk line. Both crews say they were cheated, which means it was fair.',
      partial: 'The crews agreed to share it, for now.',
      failure: 'The crowbars came out anyway.',
      expired: 'The crowbars decided it.',
    },
  },
]

const QUEST_INDEX = new Map<string, QuestDef>(
  [
    ...ACT_ONE_QUESTS,
    ...ACT_ONE_LATE_QUESTS,
    ...ACT_TWO_QUESTS,
    ...ACT_THREE_QUESTS,
    ...ACT_FOUR_QUESTS,
    ...ACT_FIVE_QUESTS,
    ...QUEST_TEMPLATES,
  ].map((quest) => [quest.id, quest]),
)

// Playbook Manager live text (conductor weird-humboldt t-037): titles, story
// text, option labels and responses, quest summaries and outcome lines. Costs,
// gates, effects, rewards and which quests post stay authored.
export const FORTRESS_LIVE_TEXT = liveTextStore()

const TIERS = ['triumph', 'success', 'partial', 'failure', 'expired'] as const

/** The quest as authored, for tools that must not see live edits. */
export const authoredQuestDef = (id: string): QuestDef | undefined =>
  QUEST_INDEX.get(id.split('@')[0] ?? id)

/** Template instances are `${templateId}@${day}`. */
export const questDef = (id: string): QuestDef | undefined => {
  const quest = authoredQuestDef(id)
  const edit = quest && FORTRESS_LIVE_TEXT.get(`quest:${quest.id}`)
  if (!quest || !edit) return quest
  const outcomes = { ...quest.outcomes }
  for (const tier of TIERS) {
    const text = edit.choices?.[tier]?.success
    if (text) outcomes[tier] = text
  }
  return {
    ...quest,
    title: edit.title ?? quest.title,
    summary: edit.body?.[0] ?? quest.summary,
    outcomes,
  }
}

function liveAudience(audience: AudienceDef): AudienceDef {
  const edit = FORTRESS_LIVE_TEXT.get(`aud:${audience.id}`)
  if (!edit) return audience
  return {
    ...audience,
    title: edit.title ?? audience.title,
    lines: edit.body?.length ? edit.body : audience.lines,
    options: editChoices(audience.options, edit, (option, change) => ({
      response: change.success ?? option.response,
    })),
  }
}

function liveDay(day: DayDef): DayDef {
  const edit = FORTRESS_LIVE_TEXT.get(`day:${day.day}`)
  // Briefing text is only replaced when the edit keeps all three plus Komodo.
  const body = edit?.body?.length === 4 ? edit.body : null
  return {
    ...day,
    title: edit?.title ?? day.title,
    briefings: body
      ? (day.briefings.map((b, i) => ({
          ...b,
          text: body[i] ?? b.text,
        })) as DayDef['briefings'])
      : day.briefings,
    komodo: body?.[3] ?? day.komodo,
    audiences: day.audiences.map(liveAudience),
  }
}

export const isTemplateInstance = (id: string): boolean => id.includes('@')

export const DAYS: readonly DayDef[] = [
  ...ACT_ONE_DAYS,
  ...ACT_ONE_LATE_DAYS,
  ...ACT_TWO_DAYS,
  ...ACT_THREE_DAYS,
  ...ACT_FOUR_DAYS,
  ...ACT_FIVE_DAYS,
]

export const dayDef = (day: number): DayDef | undefined => {
  const found = DAYS.find((entry) => entry.day === day)
  return found && FORTRESS_LIVE_TEXT.version ? liveDay(found) : found
}

export const LAST_DAY = 50
