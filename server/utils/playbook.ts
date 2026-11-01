import { createError } from 'h3'
import {
  buildPlaybook,
  isPlaybookGame,
  sanitizePlaybookEdit,
  type PlaybookGame,
} from '../../utils/playbook/games'
import type { Playbook } from '../../utils/playbook/types'
import {
  isEmptyEdit,
  isNewBeatKey,
  type CardEdit,
} from '../../utils/playbook/edits'

// Playbook Manager server helpers (conductor weird-humboldt t-033, t-036). Node keys
// come from the authored playbook, so a row can only ever point at a real beat.

export const PLAYBOOK_NOTE_KINDS = [
  'comment',
  'flag',
  'image',
  'art-request',
] as const
export type PlaybookNoteKind = (typeof PLAYBOOK_NOTE_KINDS)[number]

export function resolvePlaybookGame(raw: unknown): PlaybookGame {
  const slug = String(raw ?? '').trim()
  if (!isPlaybookGame(slug))
    throw createError({ statusCode: 404, message: 'Unknown playbook.' })
  return slug
}

export function playbookFor(game: PlaybookGame): Playbook {
  return buildPlaybook(game)
}

export function resolvePlaybookNode(
  game: PlaybookGame,
  raw: unknown,
  { editable = false }: { editable?: boolean } = {},
): string {
  const key = String(raw ?? '').trim()
  // A Studio "+ New beat" has no authored node yet; its row is the content.
  if (editable && game === 'ecotone' && isNewBeatKey(key)) return key
  const node = playbookFor(game).nodes[key]
  if (!node)
    throw createError({ statusCode: 404, message: 'Unknown playbook beat.' })
  if (editable && !node.editable)
    throw createError({
      statusCode: 400,
      message: 'This beat is assembled from other beats; edit those instead.',
    })
  return key
}

/**
 * Where a note may sit: a beat, or (for the Forge gallery's section and
 * follower comments) a whole section of one kind (`section:<kind>`) or one
 * person (`person:<id>`). Both are checked against the authored playbook.
 */
export function resolvePlaybookNoteTarget(
  game: PlaybookGame,
  raw: unknown,
): string {
  const key = String(raw ?? '').trim()
  const [scope, id = ''] = key.split(/:(.*)/s)
  if (scope === 'section' || scope === 'person') {
    const book = playbookFor(game)
    const known =
      scope === 'section'
        ? Object.values(book.nodes).some((node) => node.kind === id)
        : book.people.some((person) => person.id === id)
    if (!known)
      throw createError({
        statusCode: 404,
        message: `Unknown playbook ${scope}.`,
      })
    return key
  }
  return resolvePlaybookNode(game, raw)
}

export function normalizePlaybookEdit(
  game: PlaybookGame,
  raw: unknown,
): {
  content: CardEdit
  serialized: string
} {
  const content = sanitizePlaybookEdit(game, raw)
  return { content, serialized: JSON.stringify(content) }
}

export function parseStoredEdit(game: PlaybookGame, content: string): CardEdit {
  try {
    return sanitizePlaybookEdit(game, JSON.parse(content))
  } catch {
    return {}
  }
}

export { isEmptyEdit }

function optionalId(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null
  const n = Number(value)
  if (!Number.isInteger(n) || n <= 0)
    throw createError({ statusCode: 400, message: 'Ids must be positive.' })
  return n
}

export function normalizePlaybookNote(raw: unknown): {
  kind: PlaybookNoteKind
  body: string
  choiceId: string | null
  artJobId: number | null
  artImageId: number | null
} {
  const source =
    raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {}
  const kind = String(source.kind ?? 'comment') as PlaybookNoteKind
  if (!PLAYBOOK_NOTE_KINDS.includes(kind))
    throw createError({ statusCode: 400, message: 'Unknown note kind.' })
  const body = typeof source.body === 'string' ? source.body.trim() : ''
  const artJobId = optionalId(source.artJobId)
  const artImageId = optionalId(source.artImageId)
  if (!body && !artJobId && !artImageId)
    throw createError({ statusCode: 400, message: 'A note needs some text.' })
  if (kind === 'image' && !artImageId)
    throw createError({
      statusCode: 400,
      message: 'Submitting an image needs its ArtImage id.',
    })
  if (kind === 'art-request' && !artJobId)
    throw createError({
      statusCode: 400,
      message: 'An art request needs its ArtJob id.',
    })
  const choiceId =
    typeof source.choiceId === 'string' &&
    /^[A-Za-z0-9.:_-]{1,64}$/.test(source.choiceId)
      ? source.choiceId
      : null
  return {
    kind,
    body: body.slice(0, 4000),
    choiceId,
    artJobId,
    artImageId,
  }
}

type EditRow = {
  gameSlug: string
  nodeKey: string
  content: string
  live: boolean
  updatedAt: Date
  updatedById: number | null
}

type NoteRow = {
  id: number
  nodeKey: string
  kind: string
  body: string
  choiceId: string | null
  artJobId: number | null
  artImageId: number | null
  authorId: number
  resolved: boolean
  createdAt: Date
}

export function serializePlaybookEdit(row: EditRow) {
  return {
    nodeKey: row.nodeKey,
    content: isPlaybookGame(row.gameSlug)
      ? parseStoredEdit(row.gameSlug, row.content)
      : {},
    live: row.live,
    updatedAt: row.updatedAt.toISOString(),
    updatedById: row.updatedById,
  }
}

export function serializePlaybookNote(row: NoteRow) {
  return {
    id: row.id,
    nodeKey: row.nodeKey,
    kind: row.kind,
    body: row.body,
    choiceId: row.choiceId,
    artJobId: row.artJobId,
    artImageId: row.artImageId,
    authorId: row.authorId,
    resolved: row.resolved,
    createdAt: row.createdAt.toISOString(),
  }
}
