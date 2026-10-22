import { ACT_I_II_QUEST_CONTEXT } from './questBriefsEarly'
import { ACT_III_V_QUEST_CONTEXT } from './questBriefsLate'
import { CHORE_QUEST_CONTEXT } from './questBriefsChores'

/**
 * Every quest has an actionable dispatch AND authored story context.
 * Keep stable quest IDs, outcomes, difficulty and expiry separate from prose.
 * Live Playbook Manager edits replace the entire assembled brief.
 */
export const QUEST_CONTEXT: Readonly<Record<string, string>> = {
  ...ACT_I_II_QUEST_CONTEXT,
  ...ACT_III_V_QUEST_CONTEXT,
  ...CHORE_QUEST_CONTEXT,
}

export const questBrief = (id: string, dispatch: string): string => {
  const context = QUEST_CONTEXT[id.split('@')[0] ?? id]
  return context ? `${dispatch}\n\n${context}` : dispatch
}
