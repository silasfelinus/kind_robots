import type {
  Check,
  Choice,
  CompanionId,
  Effects,
  EncounterCard,
  LeadId,
  LensId,
  Outcome,
  SceneKind,
  SkillId,
} from '../ecotone/content'

// A Playbook Manager edit is an overlay on one authored card: text fields that
// replace the source, per-choice text rewrites, and extra choices an admin adds.
// The same sanitizer runs on the server before saving and in the client before a
// live edit touches play, so a bad row can never break a run.

export type ChoiceEdit = {
  label?: string
  cost?: string
  success?: string
  failure?: string
}

export type AddedChoice = {
  id: string
  label: string
  cost?: string
  check?: Check
  success: Outcome
  failure?: Outcome
}

export type CardEdit = {
  title?: string
  place?: string
  body?: string[]
  provenance?: string
  lensLines?: Partial<Record<LensId, string>>
  leadLines?: Partial<Record<CompanionId, string>>
  aloneLine?: string
  variants?: Partial<Record<LeadId, string[]>>
  choices?: Record<string, ChoiceEdit>
  added?: AddedChoice[]
  /** Marks a Studio-authored "+ New beat": dealt from this chapter's fork pool like an authored encounter. */
  beat?: { chapter: number; scene: SceneKind }
}

export const NEW_BEAT_PREFIX = 'new-beat-'
const NEW_BEAT_KEY = /^new-beat-[a-z0-9-]{1,48}$/
const BEAT_CHAPTERS = [1, 2, 3, 4, 5, 6]
const BEAT_SCENES: SceneKind[] = [
  'meadow',
  'theater',
  'beach',
  'bay',
  'plaza',
  'highway',
  'marsh',
  'rivermouth',
]

export function isNewBeatKey(key: string): boolean {
  return NEW_BEAT_KEY.test(key)
}

const SKILLS: SkillId[] = ['rizz', 'burly', 'wits', 'lore', 'psyche']
const TARGETS = [7, 9, 11]
const LENS_IDS: LensId[] = [
  'sober',
  'tipsy',
  'stoned',
  'tripping_balls',
  'cocaine',
  'meth',
  'mdma',
]
const COMPANION_IDS: CompanionId[] = ['mara', 'kit', 'juniper', 'cedar']
const LEAD_IDS: LeadId[] = [...COMPANION_IDS, 'alone']
export const MAX_ADDED_CHOICES = 3
const TEXT_LIMIT = 2000
const SHORT_LIMIT = 200

function record(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null
}

function text(value: unknown, limit = TEXT_LIMIT): string | undefined {
  if (typeof value !== 'string') return undefined
  const trimmed = value.trim()
  return trimmed ? trimmed.slice(0, limit) : undefined
}

function paragraphs(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined
  const out = value.flatMap((p) => text(p) ?? []).slice(0, 8)
  return out.length ? out : undefined
}

function keyed<K extends string, V>(
  value: unknown,
  keys: K[],
  read: (v: unknown) => V | undefined,
): Partial<Record<K, V>> | undefined {
  const source = record(value)
  if (!source) return undefined
  const out: Partial<Record<K, V>> = {}
  for (const key of keys) {
    const v = read(source[key])
    if (v !== undefined) out[key] = v
  }
  return Object.keys(out).length ? out : undefined
}

function step(value: unknown): number | undefined {
  const n = Number(value)
  if (!Number.isFinite(n) || n === 0) return undefined
  return Math.max(-2, Math.min(2, Math.round(n)))
}

export function sanitizeEffects(value: unknown): Effects {
  const source = record(value) ?? {}
  const effects: Effects = {}
  const nerve = step(source.nerve)
  const goodwill = step(source.goodwill)
  const weird = step(source.weird)
  if (nerve) effects.nerve = nerve
  if (goodwill) effects.goodwill = Math.max(0, goodwill)
  if (weird) effects.weird = Math.max(0, weird)
  const evidence = text(source.evidence, SHORT_LIMIT)
  if (evidence) effects.evidence = evidence
  const flag = text(source.flag, 64)
    ?.toLowerCase()
    .replace(/[^a-z0-9_]+/g, '_')
  if (flag) effects.flag = flag
  return effects
}

function outcome(value: unknown): Outcome | undefined {
  const source = record(value)
  const body = text(source?.text)
  if (!source || !body) return undefined
  return { text: body, effects: sanitizeEffects(source.effects) }
}

function addedChoice(value: unknown, index: number): AddedChoice | null {
  const source = record(value)
  const label = text(source?.label, SHORT_LIMIT)
  const success = outcome(source?.success)
  if (!source || !label || !success) return null
  const check = record(source.check)
  const skill = check?.skill as SkillId | undefined
  const target = Number(check?.target)
  const choice: AddedChoice = {
    id: `added-${index + 1}`,
    label,
    success,
  }
  const cost = text(source.cost, SHORT_LIMIT)
  if (cost) choice.cost = cost
  if (skill && SKILLS.includes(skill) && TARGETS.includes(target)) {
    choice.check = { skill, target }
    const failure = outcome(source.failure)
    // A rolled choice always authors its complication.
    choice.failure = failure ?? {
      text: 'It doesn’t go the way you hoped.',
      effects: { nerve: -1 },
    }
  }
  return choice
}

/** Keeps only fields an overlay may change, trimmed and bounded. */
export function sanitizeCardEdit(raw: unknown): CardEdit {
  const source = record(raw) ?? {}
  const edit: CardEdit = {}
  const title = text(source.title, SHORT_LIMIT)
  const place = text(source.place, SHORT_LIMIT)
  const provenance = text(source.provenance)
  const aloneLine = text(source.aloneLine)
  const body = paragraphs(source.body)
  if (title) edit.title = title
  if (place) edit.place = place
  if (provenance) edit.provenance = provenance
  if (aloneLine) edit.aloneLine = aloneLine
  if (body) edit.body = body
  const lensLines = keyed(source.lensLines, LENS_IDS, (v) => text(v))
  const leadLines = keyed(source.leadLines, COMPANION_IDS, (v) => text(v))
  const variants = keyed(source.variants, LEAD_IDS, paragraphs)
  if (lensLines) edit.lensLines = lensLines
  if (leadLines) edit.leadLines = leadLines
  if (variants) edit.variants = variants
  const choices = record(source.choices)
  if (choices) {
    const out: Record<string, ChoiceEdit> = {}
    for (const [id, value] of Object.entries(choices).slice(0, 8)) {
      const c = record(value)
      if (!c || !/^[a-z0-9-]{1,64}$/.test(id)) continue
      const choiceEdit: ChoiceEdit = {}
      const label = text(c.label, SHORT_LIMIT)
      const cost = text(c.cost, SHORT_LIMIT)
      const success = text(c.success)
      const failure = text(c.failure)
      if (label) choiceEdit.label = label
      if (cost) choiceEdit.cost = cost
      if (success) choiceEdit.success = success
      if (failure) choiceEdit.failure = failure
      if (Object.keys(choiceEdit).length) out[id] = choiceEdit
    }
    if (Object.keys(out).length) edit.choices = out
  }
  if (Array.isArray(source.added)) {
    const added = source.added
      .slice(0, MAX_ADDED_CHOICES)
      .flatMap((value, index) => addedChoice(value, index) ?? [])
    if (added.length) edit.added = added
  }
  const beat = record(source.beat)
  const chapter = Number(beat?.chapter)
  if (beat && BEAT_CHAPTERS.includes(chapter)) {
    const scene = BEAT_SCENES.find((s) => s === beat.scene) ?? 'meadow'
    edit.beat = { chapter, scene }
  }
  return edit
}

export function isEmptyEdit(edit: CardEdit): boolean {
  return Object.keys(edit).length === 0
}

function mergeChoice(choice: Choice, edit?: ChoiceEdit): Choice {
  if (!edit) return choice
  return {
    ...choice,
    label: edit.label ?? choice.label,
    cost: edit.cost ?? choice.cost,
    success: { ...choice.success, text: edit.success ?? choice.success.text },
    failure: choice.failure
      ? { ...choice.failure, text: edit.failure ?? choice.failure.text }
      : choice.failure,
  }
}

/** The card as play sees it with an overlay applied. Choice ids and mechanics stay put. */
export function applyCardEdit(
  card: EncounterCard,
  raw: CardEdit,
): EncounterCard {
  const edit = sanitizeCardEdit(raw)
  const choices = card.choices.map((choice) =>
    mergeChoice(choice, edit.choices?.[choice.id]),
  )
  const room = Math.max(0, 4 - choices.length)
  const added = (edit.added ?? [])
    .slice(0, room)
    .map((choice): Choice => ({ ...choice }))
  return {
    ...card,
    title: edit.title ?? card.title,
    place: edit.place ?? card.place,
    body: edit.body ?? card.body,
    provenance: edit.provenance ?? card.provenance,
    aloneLine: edit.aloneLine ?? card.aloneLine,
    lensLines: edit.lensLines
      ? { ...card.lensLines, ...edit.lensLines }
      : card.lensLines,
    leadLines: edit.leadLines
      ? { ...card.leadLines, ...edit.leadLines }
      : card.leadLines,
    variants: edit.variants
      ? { ...card.variants, ...edit.variants }
      : card.variants,
    choices: [...choices, ...added],
  }
}

export const BEAT_CHAPTER_CHOICES = BEAT_CHAPTERS
export const BEAT_SCENE_CHOICES = BEAT_SCENES

/** A fresh Studio key such as `new-beat-3f9k2a`. */
export function makeNewBeatKey(
  seed = Math.random().toString(36).slice(2, 8),
): string {
  const slug = seed
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '')
    .slice(0, 24)
  return `${NEW_BEAT_PREFIX}${slug || 'draft'}`
}

/**
 * The empty card a "+ New beat" row is measured against in the Studio, so the
 * same overlay editor works on it. Unlike newBeatCard it exists while a draft.
 */
export function blankBeatCard(
  key: string,
  raw: CardEdit,
): EncounterCard | null {
  if (!isNewBeatKey(key)) return null
  const edit = sanitizeCardEdit(raw)
  return {
    id: key,
    kind: 'encounter',
    chapter: edit.beat?.chapter ?? 1,
    scene: edit.beat?.scene ?? 'meadow',
    place: 'Somewhere along the route',
    title: 'Untitled beat',
    body: [],
    provenance: 'Written in the Playbook Studio.',
    choices: [],
  }
}

/**
 * A new beat is playable only when it has a title, a body and at least one choice;
 * otherwise it stays a draft and the engine never deals it.
 */
export function newBeatCard(key: string, raw: CardEdit): EncounterCard | null {
  if (!isNewBeatKey(key)) return null
  const edit = sanitizeCardEdit(raw)
  if (!edit.beat || !edit.title || !edit.body || !edit.added?.length)
    return null
  return {
    id: key,
    kind: 'encounter',
    chapter: edit.beat.chapter,
    scene: edit.beat.scene,
    place: edit.place ?? 'Somewhere along the route',
    title: edit.title,
    body: edit.body,
    lensLines: edit.lensLines,
    leadLines: edit.leadLines,
    aloneLine: edit.aloneLine,
    variants: edit.variants,
    provenance: edit.provenance ?? 'Written in the Playbook Studio.',
    choices: edit.added.map((choice): Choice => ({ ...choice })),
  }
}
