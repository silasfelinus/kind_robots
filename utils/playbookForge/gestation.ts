import { ADDITION_KINDS, type AdditionKind } from './adjust'
import { newDesignId } from './designs'
import { presetForGenre } from './facets'
import { blueprintFromIdea } from './presets'
import type { Blueprint } from './types'

// Gestation: the daily playbook challenge's concepts growing in the Forge.
// Conductor writes a dated docket each Pacific day (pitches/playbook-
// challenges/<date>.yaml) and keeps editorial memory in MEMORY.yaml; Silas
// leaves notes for the next development in SILAS-NOTES.yaml, which the next
// day's brief answers first. A pitch can be forged into a draft blueprint.

export const GESTATION_DIR = 'pitches/playbook-challenges'
export const GESTATION_NOTES = `${GESTATION_DIR}/SILAS-NOTES.yaml`
export const GESTATION_STATES = [
  'incubating',
  'promising',
  'parked',
  'rejected',
  'approved',
] as const

export type GestationPitch = {
  slug: string
  conceptId: string
  title: string
  mode: string
  parents: string[]
  hook: string
  genrePillar: string
  genreGap: string
  audience: string
  worldScope: string
  emotionalPromise: string
  coreLoop: string
  uniqueMechanic: string
  signatureSystems: string[]
  openingChoices: string
  evolution: string
  preserve: string
  challenge: string
  nextQuestions: string[]
  cast: Record<string, number>
  production: Record<string, number>
  /** Authored design prompts: the pitch's look, before anything is built. */
  designs: { kind: AdditionKind; title: string; prompt: string }[]
}

export type GestationNote = {
  at: string
  by: string
  note: string
  status: 'open' | 'addressed' | 'dismissed'
  addressedIn?: string
}

export type GestationConcept = {
  conceptId: string
  title: string
  status: (typeof GESTATION_STATES)[number]
  tags: string[]
  latest: GestationPitch
  latestDate: string
  versions: {
    date: string
    slug: string
    mode: string
    title: string
    evolution: string
  }[]
  strengths: string[]
  guardrails: string[]
  nextMoves: string[]
  notes: GestationNote[]
}

type Raw = Record<string, unknown>
const str = (v: unknown) => (typeof v === 'string' ? v.trim() : '')
const strs = (v: unknown) =>
  Array.isArray(v) ? v.map((x) => str(x)).filter(Boolean) : []
const nums = (v: unknown): Record<string, number> =>
  v && typeof v === 'object'
    ? Object.fromEntries(
        Object.entries(v as Raw).filter(
          (e): e is [string, number] => typeof e[1] === 'number',
        ),
      )
    : {}

export function readPitch(raw: Raw): GestationPitch | null {
  const slug = str(raw.slug)
  const title = str(raw.title)
  if (!slug || !title) return null
  return {
    slug,
    conceptId: str(raw.concept_id) || slug,
    title,
    mode: str(raw.mode) || 'new',
    parents: strs(raw.parents),
    hook: str(raw.hook),
    genrePillar: str(raw.genre_pillar),
    genreGap: str(raw.genre_gap),
    audience: str(raw.audience),
    worldScope: str(raw.world_scope),
    emotionalPromise: str(raw.emotional_promise),
    coreLoop: str(raw.core_loop),
    uniqueMechanic: str(raw.unique_mechanic),
    signatureSystems: strs(raw.signature_systems),
    openingChoices: str(raw.opening_choices),
    evolution: str(raw.evolution),
    preserve: str(raw.preserve),
    challenge: str(raw.challenge),
    nextQuestions: strs(raw.next_questions),
    cast: nums(raw.cast),
    production: nums(raw.production),
    designs: (Array.isArray(raw.designs) ? raw.designs : []).flatMap((d) => {
      const row = (d ?? {}) as Raw
      const title = str(row.title)
      const prompt = str(row.prompt)
      if (!title || !prompt) return []
      const kind = str(row.kind)
      return [
        {
          kind: (ADDITION_KINDS.some((k) => k.id === kind)
            ? kind
            : 'other') as AdditionKind,
          title,
          prompt,
        },
      ]
    }),
  }
}

function readNote(raw: Raw): GestationNote | null {
  const note = str(raw.note)
  if (!note) return null
  const status = str(raw.status)
  return {
    at: str(raw.at),
    by: str(raw.by),
    note,
    status: status === 'addressed' || status === 'dismissed' ? status : 'open',
    ...(str(raw.addressed_in) ? { addressedIn: str(raw.addressed_in) } : {}),
  }
}

/**
 * Concepts from every docket (oldest first), editorial memory and notes,
 * newest development first. Malformed entries are skipped, never fatal.
 */
export function buildGestation(
  dockets: { date: string; data: unknown }[],
  memory: unknown,
  notes: unknown,
): GestationConcept[] {
  const concepts = new Map<string, GestationConcept>()
  const editorial =
    ((memory as Raw | null)?.concepts as Record<string, Raw> | undefined) ?? {}
  const silas =
    ((notes as Raw | null)?.notes as Record<string, unknown> | undefined) ?? {}
  for (const { date, data } of [...dockets].sort((a, b) =>
    a.date.localeCompare(b.date),
  )) {
    const pitches = (data as Raw | null)?.pitches
    if (!Array.isArray(pitches)) continue
    for (const raw of pitches) {
      const pitch = readPitch((raw ?? {}) as Raw)
      if (!pitch) continue
      const memo = editorial[pitch.conceptId] ?? {}
      const status = str(memo.status)
      const concept: GestationConcept = concepts.get(pitch.conceptId) ?? {
        conceptId: pitch.conceptId,
        title: pitch.title,
        status: (GESTATION_STATES as readonly string[]).includes(status)
          ? (status as GestationConcept['status'])
          : 'incubating',
        tags: strs(memo.tags),
        latest: pitch,
        latestDate: date,
        versions: [],
        strengths: strs(memo.strengths),
        guardrails: strs(memo.guardrails),
        nextMoves: strs(memo.next_moves),
        notes: [],
      }
      concept.title = pitch.title
      concept.latest = pitch
      concept.latestDate = date
      concept.versions.push({
        date,
        slug: pitch.slug,
        mode: pitch.mode,
        title: pitch.title,
        evolution: pitch.evolution,
      })
      concepts.set(pitch.conceptId, concept)
    }
  }
  for (const concept of concepts.values()) {
    const rows = silas[concept.conceptId]
    concept.notes = Array.isArray(rows)
      ? rows.flatMap((row) => {
          const note = readNote((row ?? {}) as Raw)
          return note ? [note] : []
        })
      : []
  }
  return [...concepts.values()].sort(
    (a, b) =>
      b.latestDate.localeCompare(a.latestDate) ||
      a.title.localeCompare(b.title),
  )
}

/** A draft blueprint from a pitch: its genre's loadout plus the counts it names. */
export function blueprintFromPitch(pitch: GestationPitch): Blueprint {
  const genre = presetForGenre({
    title: pitch.genrePillar,
    description: pitch.hook,
  })
  const base = blueprintFromIdea(pitch.title, pitch.hook, genre)
  const n = (value: number | undefined, fallback: number) =>
    typeof value === 'number' && value >= 0 ? Math.round(value) : fallback
  const p = pitch.production
  return {
    ...base,
    slug: pitch.slug,
    rosterSize: n(pitch.cast.playable, base.rosterSize),
    followers: n(pitch.cast.followers, base.followers),
    figures: n(pitch.cast.npcs, base.figures),
    locations: n(p.maps, base.locations),
    encounters: n(p.encounter_scenes, base.encounters),
    endings: n(p.finale_scripts, base.endings),
    romances: p.romance_scenes ? base.romances : 0,
    designs: pitch.designs.map((d) => ({
      id: newDesignId(),
      kind: d.kind,
      title: d.title,
      note: '',
      prompt: d.prompt,
      source: `Pitch: ${pitch.title}`,
    })),
  }
}
