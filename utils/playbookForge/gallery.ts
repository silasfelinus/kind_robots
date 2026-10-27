import type {
  NodeKind,
  Playbook,
  PlaybookNode,
  PlaybookOption,
} from '../playbook/types'
import {
  nodeArtPrompt,
  type ArtState,
  type Ledger,
  type LedgerSection,
  type LedgerUnit,
} from './ledger'

// The Forge gallery (Silas, 2026-10-27: "images representing each section …
// if followers are an important junction, I should see their page and a
// gallery of all entries, or acknowledgements of the missing, with options to
// submit for gen, and offer comments … more of a command center, with large
// image friendly interfaces, than a museum"). Pure helpers: the store and the
// components only arrange what these return.

export type GalleryTarget =
  { type: 'section'; id: NodeKind } | { type: 'person'; id: string }

/** Comments on a whole section or person share the beat notes table under these keys. */
export function targetNoteKey(target: GalleryTarget): string {
  return `${target.type}:${target.id}`
}

export function sameTarget(
  a: GalleryTarget | null,
  b: GalleryTarget | null,
): boolean {
  return !!a && !!b && a.type === b.type && a.id === b.id
}

export type GalleryEntry = {
  key: string
  title: string
  kind: NodeKind
  place: string
  imageUrl: string | null
  /** Ecotone draws scenes in code; shown when no painting exists. */
  scene: string | null
  art: string | null
  prompt: string | null
  state: ArtState
  /** False for beats that show no picture in the game (nothing to paint). */
  needsArt: boolean
  written: boolean
  /** Complete authored story and alternate outcomes, not merely the beat title. */
  body: string[]
  variations: PlaybookNode['variations']
  choices: PlaybookNode['choices']
  artVariants: NonNullable<PlaybookNode['artVariants']>
  /** Origin/power family for identity rosters; other casts remain one ensemble. */
  group: string
}

export type GalleryStatus =
  | 'painted'
  | 'no-picture'
  | 'not-wired'
  | 'rendering'
  | 'failed'
  | 'no-prompt'
  | 'unpainted'

export const STATUS_LABEL: Record<GalleryStatus, string> = {
  painted: 'Painted',
  'no-picture': 'No picture in the game',
  'not-wired': 'Rendered, not wired',
  rendering: 'Rendering',
  failed: 'Render failed',
  'no-prompt': 'No prompt yet',
  unpainted: 'Ready to render',
}

export function entryStatus(entry: GalleryEntry): GalleryStatus {
  if (entry.state === 'delivered')
    return entry.imageUrl || entry.scene || entry.needsArt
      ? 'painted'
      : 'no-picture'
  if (entry.state === 'rendered') return 'not-wired'
  if (entry.state === 'queued') return 'rendering'
  if (entry.state === 'failed') return 'failed'
  return entry.prompt ? 'unpainted' : 'no-prompt'
}

export function galleryEntry(
  node: PlaybookNode,
  unit?: LedgerUnit,
): GalleryEntry {
  return {
    key: node.key,
    title: node.title,
    kind: node.kind,
    place: node.place,
    imageUrl: node.artUrl,
    scene: node.scene ?? null,
    art: node.art,
    prompt: nodeArtPrompt(node),
    state:
      unit?.art ?? (node.artUrl || !node.needsArt ? 'delivered' : 'missing'),
    needsArt: node.needsArt || !!node.artUrl,
    written: unit?.written ?? node.body.some((line) => line.trim()),
    body: node.body,
    variations: node.variations,
    choices: node.choices,
    artVariants: node.artVariants ?? [],
    group:
      node.kind === 'follower' && node.lenses[0] === 'guest'
        ? 'Visitors'
        : node.kind === 'follower' && node.lenses[0]?.includes('-')
          ? node.lenses[0]
              .split('-')[0]!
              .replace(/^./, (letter) => letter.toUpperCase())
          : 'Cast',
  }
}

/** A person's beats: written for them, or their own follower beat. */
export function personKeys(
  book: Pick<Playbook, 'order' | 'nodes'>,
  person: PlaybookOption,
): string[] {
  return book.order.filter((key) => {
    const node = book.nodes[key]
    if (!node) return false
    if (node.companions.includes(person.id)) return true
    return (
      node.kind === 'follower' &&
      (key.split(':').pop() === person.id || node.title === person.label)
    )
  })
}

export type GalleryTile = {
  target: GalleryTarget
  label: string
  count: number
  painted: number
  cover: string | null
  scene: string | null
}

function tile(
  target: GalleryTarget,
  label: string,
  entries: GalleryEntry[],
): GalleryTile {
  // A person's own follower beat is their portrait; otherwise the first painting.
  const portrait =
    target.type === 'person'
      ? entries.find((e) => e.kind === 'follower' && e.imageUrl)
      : undefined
  const cover = portrait ?? entries.find((e) => e.imageUrl)
  return {
    target,
    label,
    count: entries.length,
    painted: entries.filter((e) => e.state === 'delivered').length,
    cover: cover?.imageUrl ?? null,
    scene: cover ? null : (entries.find((e) => e.scene)?.scene ?? null),
  }
}

export function unitIndex(ledger: Ledger | null): Map<string, LedgerUnit> {
  return new Map(
    (ledger?.sections ?? []).flatMap((s) => s.units.map((u) => [u.key, u])),
  )
}

export function targetKeys(
  book: Pick<Playbook, 'order' | 'nodes' | 'people'>,
  ledger: Ledger | null,
  target: GalleryTarget,
): string[] {
  if (target.type === 'section')
    return (
      ledger?.sections
        .find((s) => s.id === target.id)
        ?.units.map((u) => u.key) ??
      book.order.filter((key) => book.nodes[key]?.kind === target.id)
    )
  const person = book.people.find((p) => p.id === target.id)
  return person ? personKeys(book, person) : []
}

export function targetEntries(
  book: Pick<Playbook, 'order' | 'nodes' | 'people'>,
  ledger: Ledger | null,
  target: GalleryTarget,
): GalleryEntry[] {
  const units = unitIndex(ledger)
  return targetKeys(book, ledger, target).flatMap((key) => {
    const node = book.nodes[key]
    return node ? [galleryEntry(node, units.get(key))] : []
  })
}

export function galleryTiles(
  book: Pick<Playbook, 'order' | 'nodes' | 'people'>,
  ledger: Ledger | null,
): { sections: GalleryTile[]; people: GalleryTile[] } {
  const sections = (ledger?.sections ?? []).map((section) => {
    const target: GalleryTarget = { type: 'section', id: section.id }
    return tile(target, section.label, targetEntries(book, ledger, target))
  })
  const people = book.people.flatMap((person) => {
    const target: GalleryTarget = { type: 'person', id: person.id }
    const entries = targetEntries(book, ledger, target)
    return entries.length ? [tile(target, person.label, entries)] : []
  })
  return { sections, people }
}

export type GalleryFilter = 'all' | 'missing' | 'painted'

export function filterEntries(
  entries: GalleryEntry[],
  filter: GalleryFilter,
): GalleryEntry[] {
  if (filter === 'painted')
    return entries.filter((e) => e.state === 'delivered')
  if (filter === 'missing')
    return entries.filter((e) => e.state !== 'delivered')
  return entries
}

/**
 * A person's beats as one section, so "submit the missing" and "send the
 * writing" work for a follower exactly as they do for a ledger section.
 */
export function combinedSection(
  label: string,
  sections: LedgerSection[],
  keys: string[],
): LedgerSection | null {
  const want = new Set(keys)
  const parts = sections
    .map((s) => ({ s, units: s.units.filter((u) => want.has(u.key)) }))
    .filter((p) => p.units.length)
  const first = parts[0]
  if (!first) return null
  const share = (p: { s: LedgerSection; units: LedgerUnit[] }) =>
    p.units.length / Math.max(1, p.s.units.length)
  const sum = (
    pick: (p: { s: LedgerSection; units: LedgerUnit[] }) => number,
  ) => parts.reduce((n, p) => n + pick(p), 0)
  const units = parts.flatMap((p) => p.units)
  const art = { delivered: 0, rendered: 0, queued: 0, failed: 0, missing: 0 }
  for (const unit of units) art[unit.art] += 1
  return {
    id: first.s.id,
    label,
    units,
    art,
    unwritten: units.filter((u) => !u.written).length,
    outcomes: {
      written: units.reduce((n, u) => n + u.outcomes.written, 0),
      expected: units.reduce((n, u) => n + u.outcomes.expected, 0),
    },
    takenSeconds: units.reduce((n, u) => n + u.takenSeconds, 0),
    remainingSeconds: Math.round(sum((p) => p.s.remainingSeconds * share(p))),
    remainingWords: Math.round(sum((p) => p.s.remainingWords * share(p))),
    starred: units.every((u) => u.art === 'delivered' && u.written),
  }
}
