// /utils/routeSelection.ts
//
// Reading an object id out of the route query.
//
// character-manager.vue and bot-manager.vue each carried a private copy of this
// four-line function, which is how /characters?characterId=12 worked while
// /dreams?dream=12 silently did nothing. The home page's rails made that
// asymmetry load-bearing -- Silas, 2026-08-28: "These displays should always
// lead to something, not just static displays of images and text" -- so the
// helper moved here and the managers that were missing the behaviour gained it.

/**
 * A positive integer id from a route query value, or null.
 *
 * Vue Router hands back `string | string[] | null`, and a repeated query
 * parameter (?dream=1&dream=2) arrives as an array; the first entry wins rather
 * than the whole thing being rejected, so a duplicated link still opens
 * something sensible instead of nothing.
 */
export function querySelectionId(value: unknown): number | null {
  const raw = Array.isArray(value) ? value[0] : value
  const id = Number(raw)

  return Number.isInteger(id) && id > 0 ? id : null
}

/**
 * A slug from a route query value. Same array handling; empty strings are
 * treated as absent so `?facet=` behaves like no parameter at all.
 */
export function querySelectionSlug(value: unknown): string | null {
  const raw = Array.isArray(value) ? value[0] : value

  return typeof raw === 'string' && raw.trim() ? raw.trim() : null
}
