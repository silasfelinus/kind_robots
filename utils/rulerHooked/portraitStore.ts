// utils/rulerHooked/portraitStore.ts
//
// Local-only storage for a player-supplied custom ruler portrait
// (ruler-hooked/t-021: "the player supplies their own ruler picture from
// their own device... your picture, your name, your title is a complete
// custom ruler with no runtime AI, no registration problem, and no network").
//
// IndexedDB, not localStorage: the save documents themselves stay in
// localStorage (save.ts) — small, synchronous, well within its ~5MB quota —
// but a portrait image is 80-200KB+ even downscaled, and the brief guarantees
// multiple named saves, so base64-in-localStorage does not scale past a
// handful of custom-portrait saves (t-021's own storage caveat). IndexedDB
// holds the blob; the save only carries a `customPortraitId` key, and a
// missing/unreadable blob degrades to the preset picker (never a hole).
//
// Everything here is SSR-guarded (checked per-call, not captured at module
// load) the same way save.ts guards `window`/`localStorage`, and every
// operation degrades to a no-op/null rather than throwing — a portrait is a
// nice-to-have cosmetic, never something that should be able to break a save.

const DB_NAME = 'rulerHookedPortraits'
const DB_VERSION = 1
const STORE = 'portraits'

/** Cap the imported image to this longest edge (px) before storing. */
const MAX_DIMENSION = 512
/** Re-encoded quality for the downscaled JPEG/WebP re-encode. */
const REENCODE_QUALITY = 0.85

/** Deterministic id from a caller-supplied seed (same fnv1a shape as
 *  save.ts's makeSaveId) — no Date.now()/crypto dependency in the engine. */
export function makePortraitId(seed: string): string {
  let h = 0x811c9dc5
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return 'portrait_' + (h >>> 0).toString(36)
}

const hasIndexedDb = (): boolean =>
  typeof window !== 'undefined' && typeof window.indexedDB !== 'undefined'

function openDb(): Promise<IDBDatabase | null> {
  if (!hasIndexedDb()) return Promise.resolve(null)
  return new Promise((resolve) => {
    try {
      const req = window.indexedDB.open(DB_NAME, DB_VERSION)
      req.onupgradeneeded = () => {
        if (!req.result.objectStoreNames.contains(STORE)) {
          req.result.createObjectStore(STORE)
        }
      }
      req.onsuccess = () => resolve(req.result)
      req.onerror = () => resolve(null) // quota / privacy mode — non-fatal
    } catch {
      resolve(null)
    }
  })
}

/**
 * Downscale + re-encode an image file to keep the stored blob small
 * (t-021: "cap or downscale on import... do not let a custom portrait be the
 * thing that makes save #12 fail to write"). Falls back to the original file
 * if decoding/canvas re-encode isn't available (e.g. a non-image mimetype
 * slipped past the file-input's `accept` filter, or a headless test env).
 */
async function downscale(file: File): Promise<Blob> {
  if (
    typeof createImageBitmap !== 'function' ||
    typeof document === 'undefined'
  ) {
    return file
  }
  try {
    const bitmap = await createImageBitmap(file)
    const scale = Math.min(
      1,
      MAX_DIMENSION / Math.max(bitmap.width, bitmap.height),
    )
    const w = Math.max(1, Math.round(bitmap.width * scale))
    const h = Math.max(1, Math.round(bitmap.height * scale))
    const canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext('2d')
    if (!ctx) return file
    ctx.drawImage(bitmap, 0, 0, w, h)
    bitmap.close?.()
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, 'image/webp', REENCODE_QUALITY),
    )
    return blob ?? file
  } catch {
    return file // decode failed — store the original rather than lose it
  }
}

/**
 * Import a player-picked file: downscale it, store it under a fresh id, and
 * return that id for the save's `ruler.cosmetics.customPortraitId`. Returns
 * null if IndexedDB is unavailable or the write failed — callers should fall
 * back to the preset picker rather than block save creation on this.
 */
export async function putPortrait(
  file: File,
  id: string,
): Promise<string | null> {
  const db = await openDb()
  if (!db) return null
  const blob = await downscale(file)
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORE, 'readwrite')
      tx.objectStore(STORE).put(blob, id)
      tx.oncomplete = () => resolve(id)
      tx.onerror = () => resolve(null)
    } catch {
      resolve(null)
    }
  })
}

/** Fetch a stored portrait as an object URL, or null if missing/unavailable.
 *  Callers own the URL and must revokeObjectURL it when done (e.g. on unmount
 *  or when swapping portraits) — this module never revokes URLs itself since
 *  it doesn't know how long the caller needs it displayed. */
export async function getPortraitUrl(id: string): Promise<string | null> {
  const db = await openDb()
  if (!db) return null
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORE, 'readonly')
      const req = tx.objectStore(STORE).get(id)
      req.onsuccess = () => {
        const blob = req.result as Blob | undefined
        resolve(blob ? URL.createObjectURL(blob) : null)
      }
      req.onerror = () => resolve(null)
    } catch {
      resolve(null)
    }
  })
}

/** Best-effort delete (save.ts's deleteSlot calls this when a save carrying a
 *  custom portrait is removed, so orphaned blobs don't accumulate). */
export async function deletePortrait(id: string): Promise<void> {
  const db = await openDb()
  if (!db) return
  await new Promise<void>((resolve) => {
    try {
      const tx = db.transaction(STORE, 'readwrite')
      tx.objectStore(STORE).delete(id)
      tx.oncomplete = () => resolve()
      tx.onerror = () => resolve()
    } catch {
      resolve()
    }
  })
}
