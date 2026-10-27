import { REDSHIRTS, type Redshirt } from '../gameOfCaptains/redshirts'
import { EXPEDITION_ENCOUNTERS } from '../gameOfCaptains/expedition'
import type { CatalogTab } from './catalog'

export type RedshirtDraft = {
  name: string
  anatomy: string
  history: string
  secretPower: string
  note: string
  referenceKey: string
  referenceTitle: string
  referenceTab: CatalogTab | ''
  intent: 'appearance' | 'redesign'
}

export type RedshirtAction = 'comment' | 'edit' | 'design'

export function baseRedshirtDraft(person: Redshirt): RedshirtDraft {
  return {
    name: person.name,
    anatomy: person.anatomy,
    history: person.history,
    secretPower: person.secretPower,
    note: '',
    referenceKey: '',
    referenceTitle: '',
    referenceTab: '',
    intent: 'redesign',
  }
}

/** These are actual playable expedition assignments, NOT authored solo character quests. */
export function redshirtQuestLinks(person: Redshirt) {
  return EXPEDITION_ENCOUNTERS.filter((encounter) => encounter.skill === person.talent)
    .map((encounter) => ({
      id: encounter.id,
      title: encounter.title,
      priority: encounter.priority,
      scope: encounter.scope,
      skill: encounter.skill,
      setup: encounter.setup,
      outcome: encounter.redshirtResult,
      activatesPower: true,
    }))
}

/** Render the working design, not a stale original when the artist changed the brief. */
export function redshirtPortraitPrompt(person: Redshirt, draft: RedshirtDraft): string {
  const influence = draft.referenceKey
    ? draft.referenceTab === 'characters' && draft.intent === 'appearance'
      ? `Adapt existing Kind Robots Character ${draft.referenceTitle} as this expedition recruit.`
      : `Visual inspiration from ${draft.referenceTab}: ${draft.referenceTitle}.`
    : ''
  return [
    `Original space-comedy alien portrait of ${draft.name.trim() || person.name}.`,
    `Anatomy: ${draft.anatomy.trim() || person.anatomy}.`,
    `History: ${draft.history.trim() || person.history}.`,
    influence,
    'Brilliant bright red Space Couch expedition shirt, visible expedition mission insignia.',
    'Full-character composition with a distinct expressive face and silhouette.',
  ].filter(Boolean).join(' ')
}

export function redshirtChanges(person: Redshirt, draft: RedshirtDraft) {
  const keys = ['name', 'anatomy', 'history', 'secretPower'] as const
  return keys.flatMap((key) =>
    person[key] === draft[key].trim()
      ? []
      : [{ field: key, before: person[key], after: draft[key].trim() }],
  )
}

export function redshirtBrief(person: Redshirt, draft: RedshirtDraft, action: RedshirtAction): string {
  const changes = redshirtChanges(person, draft)
  const lines = [
    `### Redshirt ${person.id} · ${person.name}`,
    `Action: ${action === 'comment' ? 'Comment' : action === 'edit' ? 'Proposed canon edit' : 'New design request'}`,
    'Source: Space Couch 100-redshirt roster',
  ]
  if (draft.referenceKey) {
    lines.push(
      `Linked ${draft.referenceTab}: ${draft.referenceTitle} (${draft.referenceKey})`,
      draft.referenceTab === 'characters' && draft.intent === 'appearance'
        ? 'Meaning: adapt the linked existing Character as this redshirt in-game. Preserve the original Character record, its relationships and canon; do not merely borrow its visual species.'
        : 'Meaning: redesign this redshirt using the linked entity as creative inspiration. A Facet such as kangaroo changes alien design language; it does not cast the Facet as a literal named character.',
    )
  }
  if (changes.length) {
    lines.push('Proposed fields (review before editing the authored roster):')
    for (const c of changes) lines.push(`- ${c.field}: ${c.before} -> ${c.after}`)
  }
  if (draft.note.trim()) lines.push('Direction: ' + draft.note.trim())
  lines.push(
    'Keep the regulation bright red Space Couch expedition uniform. Check authored portrait prompt and expedition outcomes after changing the canon.',
    `Related playable expedition encounters for ${person.talent}: ${redshirtQuestLinks(person).map((q) => q.id).join(', ')}.`,
    'These are skill-matched deployment opportunities, not yet unique redshirt quest arcs.',
  )
  return lines.join('\n')
}

export const REDSHIRT_ROSTER = REDSHIRTS
