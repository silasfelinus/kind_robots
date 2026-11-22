import {
  normalizeCompletedVoyages,
  sameCompletedVoyageStory,
  type CompletedVoyage,
} from './completedVoyages'
import { restoreVoyage, type VoyageRun } from './rules'

export const VOYAGE_BACKUP_KIND = 'kind-robots-space-couch'
export const VOYAGE_BACKUP_VERSION = 1
export const VOYAGE_BACKUP_MAX_BYTES = 8 * 1024 * 1024

export type VoyageBackup = {
  kind: typeof VOYAGE_BACKUP_KIND
  version: typeof VOYAGE_BACKUP_VERSION
  exportedAt: string
  voyage: VoyageRun | null
  completedVoyages: CompletedVoyage[]
}

export function createVoyageBackup(
  voyage: VoyageRun | null,
  completedVoyages: CompletedVoyage[],
  now: Date = new Date(),
): string {
  const backup: VoyageBackup = {
    kind: VOYAGE_BACKUP_KIND,
    version: VOYAGE_BACKUP_VERSION,
    exportedAt: now.toISOString(),
    voyage,
    completedVoyages,
  }
  return JSON.stringify(backup, null, 2)
}

export function createBoundedVoyageBackup(
  voyage: VoyageRun | null,
  completedVoyages: CompletedVoyage[],
): string {
  const file = createVoyageBackup(voyage, completedVoyages)
  if (new TextEncoder().encode(file).byteLength > VOYAGE_BACKUP_MAX_BYTES)
    throw new Error('Voyage history exceeds the 8 MB portable-backup limit.')
  return file
}

export function parseVoyageBackup(source: string): VoyageBackup {
  // The bound is bytes, not UTF-16 code units. Otherwise emoji-rich
  // voyages could exceed the server's declared size limit.
  if (
    source.length > VOYAGE_BACKUP_MAX_BYTES ||
    new TextEncoder().encode(source).byteLength > VOYAGE_BACKUP_MAX_BYTES
  ) {
    throw new Error('Backup is too large (8 MB limit).')
  }
  let raw: unknown
  try {
    raw = JSON.parse(source)
  } catch {
    throw new Error('This file is not valid JSON.')
  }
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    throw new Error('This is not a Space Couch backup.')
  }
  const data = raw as Record<string, unknown>
  if (
    data.kind !== VOYAGE_BACKUP_KIND ||
    data.version !== VOYAGE_BACKUP_VERSION
  ) {
    throw new Error('Unsupported Space Couch backup format.')
  }
  if (!Array.isArray(data.completedVoyages)) {
    throw new Error('Backup is missing its completed voyage archive.')
  }
  const voyage = data.voyage === null ? null : restoreVoyage(data.voyage)
  if (data.voyage !== null && !voyage) {
    throw new Error('The saved voyage is invalid or incompatible.')
  }
  const completedVoyages = normalizeCompletedVoyages(data.completedVoyages)
  if (completedVoyages.length !== data.completedVoyages.length) {
    throw new Error('The finished-voyage archive is invalid or duplicated.')
  }
  if (typeof data.exportedAt !== 'string') {
    throw new Error('Backup is missing its export date.')
  }
  return {
    kind: VOYAGE_BACKUP_KIND,
    version: VOYAGE_BACKUP_VERSION,
    exportedAt: data.exportedAt,
    voyage,
    completedVoyages,
  }
}

/**
 * Two devices can finish different stories with the same seed, captain and
 * ending. Their first archive ID collides, but neither story may be discarded.
 * Keep existing local IDs stable; give the incoming distinct run a replay ID.
 */
export function mergeVoyageHistory(
  local: CompletedVoyage[],
  imported: CompletedVoyage[],
): CompletedVoyage[] {
  const merged = [...normalizeCompletedVoyages(local)]
  const ids = new Set(merged.map((entry) => entry.id))

  for (const entry of normalizeCompletedVoyages(imported)) {
    const baseId = entry.id.replace(/:replay-\d+$/, '')
    const siblings = merged.filter(
      (existing) =>
        existing.id === baseId || existing.id.startsWith(baseId + ':replay-'),
    )
    if (siblings.some((existing) => sameCompletedVoyageStory(existing, entry)))
      continue

    if (!ids.has(entry.id)) {
      merged.push(entry)
      ids.add(entry.id)
      continue
    }

    let suffix = 1
    while (ids.has(baseId + ':replay-' + suffix)) suffix++
    const rekeyed = { ...entry, id: baseId + ':replay-' + suffix }
    merged.push(rekeyed)
    ids.add(rekeyed.id)
  }

  return merged
}

/**
 * A voyage import changes two browser keys. Snapshot both before writing,
 * and undo every attempted write if storage fails, including a write that
 * changed its key before throwing.
 */
export function persistRestoredVoyage(
  storage: Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>,
  keys: { archive: string; active: string },
  completed: CompletedVoyage[],
  voyage: VoyageRun | null,
): { ok: boolean; rollbackFailed: boolean } {
  const writes: Array<[string, string]> = [
    [keys.archive, JSON.stringify(completed)],
  ]
  if (voyage) writes.push([keys.active, JSON.stringify(voyage)])
  let originals: Array<string | null>
  try {
    originals = writes.map(([key]) => storage.getItem(key))
  } catch {
    return { ok: false, rollbackFailed: false }
  }
  let attempted = 0
  try {
    for (const [key, value] of writes) {
      attempted++
      storage.setItem(key, value)
    }
    return { ok: true, rollbackFailed: false }
  } catch {
    let rollbackFailed = false
    for (let index = attempted - 1; index >= 0; index--) {
      const key = writes[index]![0]
      const original = originals[index]
      try {
        if (original === null) storage.removeItem(key)
        else storage.setItem(key, original!)
      } catch {
        rollbackFailed = true
      }
    }
    return { ok: false, rollbackFailed }
  }
}

/**
 * Reading a selected backup is asynchronous. A later selection, cancellation
 * or account restore must win even if the earlier file finishes reading last.
 */
export function createVoyageBackupStager() {
  let generation = 0
  return {
    invalidate() {
      generation++
    },
    async read(
      file: Pick<File, 'size' | 'text'>,
    ): Promise<VoyageBackup | null> {
      const request = ++generation
      try {
        if (file.size > VOYAGE_BACKUP_MAX_BYTES)
          throw new Error('Backup is too large (8 MB limit).')
        const source = await file.text()
        if (request !== generation) return null
        return parseVoyageBackup(source)
      } catch (error) {
        if (request !== generation) return null
        throw error
      }
    },
  }
}
