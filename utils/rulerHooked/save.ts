// utils/rulerHooked/save.ts
//
// Offline multi-slot SaveStore (data-model.md §2). The app has no IndexedDB and
// no persistence plugin, so — per the recon — this uses the same SSR-guarded
// localStorage idiom as stores/compositionStore.ts, behind the spec's SaveStore
// interface. Saves are small JSON, so localStorage is ample for the PoC; a
// packaged app can swap the adapter without touching callers.

import type { RunSave, SaveIndex, SaveSlotMeta } from '~/types/ruler-hooked'

const INDEX_KEY = 'rulerHooked:index'
const slotKey = (saveId: string) => `rulerHooked:save:${saveId}`
export const SAVE_SCHEMA_VERSION = 3

// Checked per-call (not captured at module load) so SSR — and headless tests
// that install a window shim after import — behave correctly.
const hasWindow = (): boolean => typeof window !== 'undefined'

function safeGet(key: string): string | null {
  if (!hasWindow()) return null
  try {
    return window.localStorage.getItem(key)
  } catch {
    return null
  }
}
function safeSet(key: string, value: string): void {
  if (!hasWindow()) return
  try {
    window.localStorage.setItem(key, value)
  } catch {
    /* quota / privacy mode — non-fatal for a game */
  }
}
function safeRemove(key: string): void {
  if (!hasWindow()) return
  try {
    window.localStorage.removeItem(key)
  } catch {
    /* ignore */
  }
}
function parse<T>(raw: string | null): T | null {
  if (!raw) return null
  try {
    const v = JSON.parse(raw)
    return v && typeof v === 'object' ? (v as T) : null
  } catch {
    return null
  }
}

function metaOf(save: RunSave): SaveSlotMeta {
  return {
    saveId: save.saveId,
    name: save.name,
    rulerName: save.ruler.name,
    createdAt: save.createdAt,
    updatedAt: save.updatedAt,
    turnCount: save.turnCount,
    status: save.status,
    kingdomHealth: save.kingdomHealth,
  }
}

export function loadIndex(): SaveIndex {
  return (
    parse<SaveIndex>(safeGet(INDEX_KEY)) ?? {
      schemaVersion: SAVE_SCHEMA_VERSION,
      activeSaveId: null,
      slots: [],
    }
  )
}

function writeIndex(index: SaveIndex): void {
  safeSet(INDEX_KEY, JSON.stringify(index))
}

export function loadSave(saveId: string): RunSave | null {
  return parse<RunSave>(safeGet(slotKey(saveId)))
}

/** Write a save body and upsert its slot into the index (last-writer-wins). */
export function writeSave(save: RunSave, stamp: string): void {
  save.updatedAt = stamp
  safeSet(slotKey(save.saveId), JSON.stringify(save))
  const index = loadIndex()
  const meta = metaOf(save)
  const i = index.slots.findIndex((s) => s.saveId === save.saveId)
  if (i >= 0) index.slots[i] = meta
  else index.slots.push(meta)
  index.activeSaveId = save.saveId
  writeIndex(index)
}

export function renameSlot(saveId: string, name: string): void {
  const save = loadSave(saveId)
  if (!save) return
  save.name = name
  safeSet(slotKey(saveId), JSON.stringify(save))
  const index = loadIndex()
  const slot = index.slots.find((s) => s.saveId === saveId)
  if (slot) {
    slot.name = name
    writeIndex(index)
  }
}

export function deleteSlot(saveId: string): void {
  safeRemove(slotKey(saveId))
  const index = loadIndex()
  index.slots = index.slots.filter((s) => s.saveId !== saveId)
  if (index.activeSaveId === saveId) {
    index.activeSaveId = index.slots[0]?.saveId ?? null
  }
  writeIndex(index)
}

export function setActive(saveId: string | null): void {
  const index = loadIndex()
  index.activeSaveId = saveId
  writeIndex(index)
}

/** A short, seed-worthy id without Date.now/Math.random (both unavailable in the
 *  engine's determinism contract) — derives from a caller-supplied stamp+salt. */
export function makeSaveId(stamp: string, salt: string): string {
  let h = 0x811c9dc5
  const s = `${stamp}:${salt}`
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return 'sv_' + (h >>> 0).toString(36)
}
