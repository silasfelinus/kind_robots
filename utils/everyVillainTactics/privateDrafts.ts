import {
  emptyLibrary,
  forkDraft,
  importStage,
  restoreDraftVersion,
  sanitizeLibrary,
  upsertDraft,
  MAX_DRAFTS,
  MAX_DRAFT_HISTORY,
  type DraftLibrary,
} from './stageShare'

export const PRIVATE_DRAFT_SLUG = 'every-villain-tactics-drafts'
export const MAX_PRIVATE_DRAFT_BYTES = 1_048_576

export type PrivateDraftArchive = {
  library: DraftLibrary
  revision: number | null
}

export type PrivateDraftCommand =
  | { operation: 'save'; name: string; code: string }
  | { operation: 'fork'; source: string; name: string }
  | { operation: 'restore'; name: string; version: number }

export function parsePrivateDraftLibrary(payload: string): DraftLibrary {
  if (new TextEncoder().encode(payload).byteLength > MAX_PRIVATE_DRAFT_BYTES)
    throw new Error('Private draft shelf is too large.')
  const raw = JSON.parse(payload) as DraftLibrary
  if (
    raw?.version !== 1 ||
    !Array.isArray(raw.drafts) ||
    raw.drafts.length > MAX_DRAFTS
  )
    throw new Error('Invalid private draft shelf.')
  const clean = sanitizeLibrary(raw)
  if (
    clean.drafts.length !== raw.drafts.length ||
    raw.drafts.some(
      (entry, index) =>
        (entry.history?.length ?? 0) > MAX_DRAFT_HISTORY ||
        (entry.history?.length ?? 0) !==
          (clean.drafts[index]?.history?.length ?? 0),
    )
  )
    throw new Error('Private draft shelf contains an invalid snapshot.')
  return clean
}

const validName = (value: unknown): value is string =>
  typeof value === 'string' &&
  value.length <= 60 &&
  value.trim().length > 0

export function applyPrivateDraftCommand(
  library: DraftLibrary,
  raw: unknown,
  now: string,
) {
  const invalid = { ok: false as const, reason: 'Invalid draft command.' }
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return invalid
  const command = raw as Record<string, unknown>
  if (!validName(command.name)) return invalid
  const name = command.name.trim()
  if (command.operation === 'save' && typeof command.code === 'string') {
    const imported = importStage(command.code)
    if (!imported.ok) return imported
    return upsertDraft(library, name, imported.stage, now)
  }
  if (command.operation === 'fork' && validName(command.source))
    return forkDraft(library, command.source.trim(), name, now)
  if (
    command.operation === 'restore' &&
    typeof command.version === 'number' &&
    Number.isSafeInteger(command.version) &&
    command.version >= 1
  )
    return restoreDraftVersion(library, name, command.version, now)
  return invalid
}

export const newPrivateDraftArchive = (): PrivateDraftArchive => ({
  library: emptyLibrary(),
  revision: null,
})
