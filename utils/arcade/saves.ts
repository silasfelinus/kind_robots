// /utils/arcade/saves.ts
//
// Saved progress (conductor kr-arcade t-020): a long cabinet (Zuzu: Ghost Trail's six-stage campaign)
// may keep where a player got to, so leaving the arcade doesn't throw away an hour of trail. The game
// owns what a save means and validates it on the way back in; the arcade store only keeps each game's
// latest save on this device, by slug. These helpers are the store's pure half.

export const SAVES_KEY = 'kr-arcade-saves'

/** Saved progress by game slug, as kept in this browser (each game's own JSON shape). */
export type SaveRecord = Record<string, unknown>

const SLUG = /^[a-z0-9-]{1,40}$/
/** A save is a small resume point, never a replay log. */
export const MAX_SAVE_BYTES = 8_192

/** Whatever was stored, reduced to slugs mapped to small JSON values. */
export function sanitizeSaves(raw: unknown): SaveRecord {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {}
  const record: SaveRecord = {}
  for (const [game, save] of Object.entries(raw)) {
    if (!SLUG.test(game) || save === null || save === undefined) continue
    if (JSON.stringify(save).length > MAX_SAVE_BYTES) continue
    record[game] = save
  }
  return record
}

/** `record` with the game's save replaced (null clears it). */
export function withSave(
  record: SaveRecord,
  game: string,
  save: unknown,
): SaveRecord {
  if (!SLUG.test(game)) return record
  const others = Object.fromEntries(
    Object.entries(record).filter(([slug]) => slug !== game),
  )
  if (save === null || save === undefined) return others
  if (JSON.stringify(save).length > MAX_SAVE_BYTES) return record
  return { ...others, [game]: save }
}
