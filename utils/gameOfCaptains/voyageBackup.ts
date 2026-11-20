import {
  normalizeCompletedVoyages,
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

export function mergeVoyageHistory(
  local: CompletedVoyage[],
  imported: CompletedVoyage[],
): CompletedVoyage[] {
  return normalizeCompletedVoyages([...local, ...imported])
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
