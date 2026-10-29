import type { VoyageRun } from './rules'
import { SKILLS, type Skill } from './crewAssignments'
import { expeditionEncounter } from './expedition'
import { REDSHIRT_BY_ID } from './redshirts'

/** Player's learned field reports, independent of individual voyage saves. */
export type RedshirtKnowledge = Record<string, Skill[]>

export function normalizeRedshirtKnowledge(raw: unknown): RedshirtKnowledge {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {}
  const cleaned: RedshirtKnowledge = {}
  for (const [id, skills] of Object.entries(raw)) {
    if (!REDSHIRT_BY_ID[id] || !Array.isArray(skills)) continue
    cleaned[id] = SKILLS.filter((skill) => skills.includes(skill))
  }
  return cleaned
}
export function learnRedshirtKnowledge(
  run: VoyageRun,
  prior: RedshirtKnowledge = {},
): RedshirtKnowledge {
  const next = normalizeRedshirtKnowledge(prior)
  const visits = [
    ...(run.expeditionHistory ?? []),
    ...(run.expeditionVisit ? [run.expeditionVisit] : []),
  ]
  for (const visit of visits) {
    for (const result of visit.results) {
      if (!REDSHIRT_BY_ID[result.lead]) continue
      const card = expeditionEncounter(result.encounterId)
      if (!card) continue
      const skills = new Set(next[result.lead] ?? [])
      skills.add(card.skill)
      next[result.lead] = SKILLS.filter((skill) => skills.has(skill))
    }
  }
  return next
}
export function knownRedshirtSkills(
  run: VoyageRun,
  prior: RedshirtKnowledge,
  id: string,
): Skill[] {
  return learnRedshirtKnowledge(run, prior)[id] ?? []
}
