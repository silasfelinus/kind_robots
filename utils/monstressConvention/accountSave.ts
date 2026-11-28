/**
 * MONSTRIQUE account saves: one revisioned copy per account and edition in
 * the shared ArcadeCabinetSave table (`monstrique-general`,
 * `monstrique-mature`). The server picks the slot from the verified session,
 * so a general session can never read or write the mature copy. Browser
 * storage remains the offline and guest fallback.
 */
import {
  decodeKitSave,
  type KitProgress,
  type KitSave,
} from '../playbookKit/settings'
import { restoreCase, type CaseState } from './prologue'
import type { MonstriqueAudience } from './edition'
import { mergeRuns, parseRuns, type CaseRun } from './runHistory'

export const ACCOUNT_SAVE_LIMIT = 512 * 1024

export interface MonstriqueAccountSave {
  version: 1
  savedAt: string
  case: CaseState
  kit: KitSave | null
  /**
   * Finished-case files for this edition. Optional on the wire: saves written
   * before case files existed load with an empty history.
   */
  runs: CaseRun[]
}

export const accountSaveSlot = (edition: MonstriqueAudience): string =>
  'monstrique-' + edition

/** Items and flags that only the mature edition can produce. */
const MATURE_ONLY_ITEMS = new Set(['garlic-protection'])
const MATURE_ONLY_FLAGS = new Set(['ghost-kiss', 'bought-protection'])

export function generalSafeCase(state: CaseState): boolean {
  return (
    !state.inventory.some((item) => MATURE_ONLY_ITEMS.has(item)) &&
    !state.flags.some((flag) => MATURE_ONLY_FLAGS.has(flag))
  )
}

function validTime(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    value.length <= 40 &&
    Number.isFinite(Date.parse(value))
  )
}

/** Validates an untrusted account save; null when unusable or oversized. */
export function parseAccountSave(
  value: unknown,
  edition: MonstriqueAudience,
): MonstriqueAccountSave | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  let text: string
  try {
    text = JSON.stringify(value)
  } catch {
    return null
  }
  if (text.length > ACCOUNT_SAVE_LIMIT) return null
  const raw = value as Record<string, unknown>
  if (raw.version !== 1 || !validTime(raw.savedAt)) return null
  const restored = restoreCase(raw.case)
  if (!restored) return null
  if (edition === 'general' && !generalSafeCase(restored)) return null
  let kit: KitSave | null = null
  if (raw.kit !== null && raw.kit !== undefined) {
    kit = decodeKitSave(JSON.stringify(raw.kit))
    if (!kit) return null
  }
  return {
    version: 1,
    savedAt: new Date(raw.savedAt).toISOString(),
    case: restored,
    kit,
    runs: parseRuns(raw.runs, edition),
  }
}

export type SyncDecision = 'same' | 'upload' | 'adopt-remote' | 'keep-local'

/**
 * Newest wins. A device with no case of its own always takes the account
 * copy; an account with no copy always receives the device's case.
 */
export function chooseSync(
  local: { case: CaseState; savedAt: string | null; saved: boolean },
  remote: MonstriqueAccountSave | null,
): SyncDecision {
  if (!remote) return local.saved ? 'upload' : 'same'
  if (JSON.stringify(local.case) === JSON.stringify(remote.case)) return 'same'
  if (!local.saved || !local.savedAt) return 'adopt-remote'
  return Date.parse(remote.savedAt) > Date.parse(local.savedAt)
    ? 'adopt-remote'
    : 'keep-local'
}

function mergeStamps(
  a: Record<string, string>,
  b: Record<string, string>,
): Record<string, string> {
  const merged: Record<string, string> = { ...a }
  for (const [id, stamp] of Object.entries(b)) {
    const mine = merged[id]
    merged[id] = mine !== undefined && mine <= stamp ? mine : stamp
  }
  return merged
}

/** Unlocks are permanent: merging keeps every moment, reveal and ending. */
export function mergeKitProgress(a: KitProgress, b: KitProgress): KitProgress {
  return {
    moments: mergeStamps(a.moments, b.moments),
    reveals: mergeStamps(a.reveals, b.reveals),
    endings: mergeStamps(a.endings, b.endings),
    trailerSeen: a.trailerSeen || b.trailerSeen,
  }
}

/** Case files merge like unlocks; true when the account copy needs them. */
export function mergeAccountRuns(
  local: CaseRun[],
  remote: MonstriqueAccountSave | null,
): { runs: CaseRun[]; upload: boolean } {
  const runs = mergeRuns(local, remote?.runs ?? [])
  return {
    runs,
    upload: JSON.stringify(runs) !== JSON.stringify(remote?.runs ?? []),
  }
}
