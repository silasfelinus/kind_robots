// utils/rulerHooked/save.ts
//
// Offline multi-slot SaveStore (data-model.md §2). The app has no IndexedDB and
// no persistence plugin, so — per the recon — this uses the same SSR-guarded
// localStorage idiom as stores/compositionStore.ts, behind the spec's SaveStore
// interface. Saves are small JSON, so localStorage is ample for the PoC; a
// packaged app can swap the adapter without touching callers.

import type { RunSave, SaveIndex, SaveSlotMeta } from '~/types/ruler-hooked'
import { HERO_RULER_PRESET_ID } from '~/utils/rulerHooked/rulerPresets'
import { RULER_HOOKED_CONTENT } from '~/utils/rulerHooked/content'
import {
  rememberReign,
  type RoyalScrapbook,
} from '~/utils/rulerHooked/scrapbook'
import { deletePortrait } from '~/utils/rulerHooked/portraitStore'
import {
  mergeRoyalScrapbooks,
  royalBackup,
  type RoyalBackup,
} from '~/utils/rulerHooked/accountBackup'

const SCRAPBOOK_KEY = 'rulerHooked:scrapbook:v1'
const INDEX_KEY = 'rulerHooked:index'
const slotKey = (saveId: string) => `rulerHooked:save:${saveId}`
let accountScope: number | null = null

export function setRoyalSaveScope(owner: number | null): void {
  if (hasWindow()) accountScope = owner
}

export function royalScopedKey(key: string, owner: number | null): string {
  return owner === null ? key : `rulerHooked:account:${owner}:${key}`
}

export function guestRoyalBackup(): RoyalBackup {
  const previous = accountScope
  try {
    setRoyalSaveScope(null)
    return deviceRoyalBackup()
  } finally {
    setRoyalSaveScope(previous)
  }
}
// v5 (t-021): ruler.cosmetics widened from an untyped bag to RulerCosmetics
// with a required-in-practice presetId. Old saves (schemaVersion <= 4) never
// wrote presetId, so migrateSave() below fills it in with the hero preset
// rather than leaving the ruler region with nothing to resolve to.
// v6 (t-028): added `openingSeen` for the once-per-reign opening. Old saves
// never wrote it either, so migrateSave() defaults it to false -- a
// pre-existing reign gets the introduction once too, same as a new one.
export const SAVE_SCHEMA_VERSION = 6

// Checked per-call (not captured at module load) so SSR — and headless tests
// that install a window shim after import — behave correctly.
const hasWindow = (): boolean => typeof window !== 'undefined'

function safeGet(key: string): string | null {
  if (!hasWindow()) return null
  try {
    return window.localStorage.getItem(royalScopedKey(key, accountScope))
  } catch {
    return null
  }
}
function safeSet(key: string, value: string): void {
  if (!hasWindow()) return
  try {
    window.localStorage.setItem(royalScopedKey(key, accountScope), value)
  } catch {
    /* quota / privacy mode — non-fatal for a game */
  }
}
function safeRemove(key: string): void {
  if (!hasWindow()) return
  try {
    window.localStorage.removeItem(royalScopedKey(key, accountScope))
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

/** Add fields introduced after the original PoC without invalidating old slots. */
function migrateSave(save: RunSave): RunSave {
  if (!save.fishopedia) save.fishopedia = {}
  if (!save.ruler.cosmetics) save.ruler.cosmetics = {}
  if (!save.ruler.cosmetics.presetId) {
    save.ruler.cosmetics.presetId = HERO_RULER_PRESET_ID
  }
  if (typeof save.openingSeen !== 'boolean') {
    save.openingSeen = false
  }
  save.schemaVersion = SAVE_SCHEMA_VERSION
  return save
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
  const index = parse<SaveIndex>(safeGet(INDEX_KEY)) ?? {
    schemaVersion: SAVE_SCHEMA_VERSION,
    activeSaveId: null,
    slots: [],
  }
  index.schemaVersion = SAVE_SCHEMA_VERSION
  return index
}

export function loadScrapbook(): RoyalScrapbook {
  const raw = parse<RoyalScrapbook>(safeGet(SCRAPBOOK_KEY))
  let archive: RoyalScrapbook = {}
  if (raw && !Array.isArray(raw)) {
    for (const [id, entry] of Object.entries(raw)) {
      if (
        entry &&
        entry.saveId === id &&
        typeof entry.name === 'string' &&
        Number.isFinite(entry.turnCount) &&
        Array.isArray(entry.endingKeys) &&
        Array.isArray(entry.characters) &&
        entry.fish &&
        typeof entry.fish === 'object'
      )
        archive[id] = entry
    }
  }
  for (const slot of loadIndex().slots) {
    const save = loadSave(slot.saveId)
    if (save) archive = rememberReign(archive, save, RULER_HOOKED_CONTENT)
  }
  const encoded = JSON.stringify(archive)
  if (safeGet(SCRAPBOOK_KEY) !== encoded) safeSet(SCRAPBOOK_KEY, encoded)
  return archive
}

function writeIndex(index: SaveIndex): void {
  index.schemaVersion = SAVE_SCHEMA_VERSION
  safeSet(INDEX_KEY, JSON.stringify(index))
}

export function loadSave(saveId: string): RunSave | null {
  const save = parse<RunSave>(safeGet(slotKey(saveId)))
  return save ? migrateSave(save) : null
}

/** Write a save body and upsert its slot into the index (last-writer-wins). */
export function writeSave(save: RunSave, stamp: string): void {
  migrateSave(save)
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

export function renameSlot(saveId: string, name: string, stamp?: string): void {
  const save = loadSave(saveId)
  if (!save) return
  save.name = name
  if (stamp) save.updatedAt = stamp
  safeSet(slotKey(saveId), JSON.stringify(save))
  const index = loadIndex()
  const slot = index.slots.find((s) => s.saveId === saveId)
  if (slot) {
    slot.name = name
    slot.updatedAt = save.updatedAt
    writeIndex(index)
  }
}

export function deleteSlot(saveId: string): void {
  loadScrapbook()
  const existing = loadSave(saveId)
  const portraitId = existing?.ruler.cosmetics?.customPortraitId
  safeRemove(slotKey(saveId))
  if (portraitId) void deletePortrait(portraitId) // best-effort, fire-and-forget
  const index = loadIndex()
  index.slots = index.slots.filter((s) => s.saveId !== saveId)
  if (index.activeSaveId === saveId) {
    index.activeSaveId = index.slots[0]?.saveId ?? null
  }
  writeIndex(index)
}

export function deviceRoyalBackup(): RoyalBackup {
  const reigns = loadIndex()
    .slots.map((slot) => loadSave(slot.saveId))
    .filter((save): save is RunSave => save !== null)
  return royalBackup(reigns, loadScrapbook())
}

export function restoreRoyalBackup(backup: RoyalBackup): void {
  const activeId = loadIndex().activeSaveId
  const archive = mergeRoyalScrapbooks(loadScrapbook(), backup.scrapbook)
  for (const incoming of backup.reigns) {
    const local = loadSave(incoming.saveId)
    if (local && Date.parse(local.updatedAt) >= Date.parse(incoming.updatedAt))
      continue
    const reign = JSON.parse(JSON.stringify(incoming)) as RunSave
    const portrait = local?.ruler.cosmetics?.customPortraitId
    if (portrait) {
      reign.ruler.cosmetics = {
        ...reign.ruler.cosmetics,
        customPortraitId: portrait,
      }
    }
    writeSave(reign, reign.updatedAt)
  }
  setActive(activeId)
  safeSet(SCRAPBOOK_KEY, JSON.stringify(archive))
  loadScrapbook()
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
