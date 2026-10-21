import { ACT_ONE_DAYS, ACT_ONE_DUES, ACT_ONE_QUESTS } from './actOne'
import {
  ACT_ONE_LATE_DAYS,
  ACT_ONE_LATE_DUES,
  ACT_ONE_LATE_QUESTS,
} from './actOneLate'
import { ACT_TWO_DAYS, ACT_TWO_DUES, ACT_TWO_QUESTS } from './actTwo'
import { ACT_THREE_DAYS, ACT_THREE_DUES, ACT_THREE_QUESTS } from './actThree'
import { ACT_FOUR_DAYS, ACT_FOUR_DUES, ACT_FOUR_QUESTS } from './actFour'
import { ACT_FIVE_DAYS, ACT_FIVE_DUES, ACT_FIVE_QUESTS } from './actFive'
import { CHORES } from './chores'
import type { AudienceDef, DayDef, DueDef, QuestDef, SceneLine } from './types'
import { editChoices, liveTextStore } from '../../playbook/textOverlay'

// Seeded wasteland chores drawn at dawn (chores.ts, t-041).
export const QUEST_TEMPLATES: readonly QuestDef[] = CHORES

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

/** A scene line as one paragraph of text: someone else's line is "Who: text". */
export const editorLine = (line: SceneLine): string =>
  typeof line === 'string' ? line : `${line.who}: ${line.text}`

/**
 * Edited paragraphs back onto the authored lines: a paragraph in the place of
 * someone else's line stays theirs, with the "Who: " it was shown with removed.
 */
export const mergeSceneLines = (
  authored: readonly SceneLine[],
  edited: readonly string[],
): SceneLine[] =>
  edited.map((text, i) => {
    const line = authored[i]
    if (line === undefined || typeof line === 'string') return text
    const prefix = `${line.who}: `
    return {
      ...line,
      text: text.startsWith(prefix) ? text.slice(prefix.length) : text,
    }
  })

function liveAudience(audience: AudienceDef): AudienceDef {
  const edit = FORTRESS_LIVE_TEXT.get(`aud:${audience.id}`)
  if (!edit) return audience
  return {
    ...audience,
    title: edit.title ?? audience.title,
    lines: edit.body?.length
      ? mergeSceneLines(audience.lines, edit.body)
      : audience.lines,
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

/**
 * Every debt, fee and threat that can come due (t-040). Each act keeps its
 * own list; `effects.schedule` names them by id.
 */
export const DUES: readonly DueDef[] = [
  ...ACT_ONE_DUES,
  ...ACT_ONE_LATE_DUES,
  ...ACT_TWO_DUES,
  ...ACT_THREE_DUES,
  ...ACT_FOUR_DUES,
  ...ACT_FIVE_DUES,
]
const DUE_INDEX = new Map(DUES.map((due) => [due.id, due]))
export const dueDef = (id: string): DueDef | undefined => DUE_INDEX.get(id)

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
