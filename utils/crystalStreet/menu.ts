// Screens reachable from the Terrors on Crystal Street main menu.
export type MenuView = 'scrapbook' | 'settings' | 'theme' | 'achievements'

// Tabs inside the scrapbook show discoveries and anonymous locked slots.
export type ScrapbookTab =
  'weeks' | 'nightmares' | 'endings' | 'friends' | 'achievements'

/** Count only real catalog entries, not duplicate or obsolete saved IDs. */
export function discoveryProgress<T extends { id: string }>(
  catalog: readonly T[],
  knownIds: Iterable<string>,
) {
  const known = new Set(knownIds)
  const discovered = catalog.filter((entry) => known.has(entry.id))
  return {
    discovered,
    total: catalog.length,
    missing: catalog.length - discovered.length,
  }
}

// One stop on the screen dial across the top of the game.
export type DialItem = {
  id: string
  label: string
  icon?: string
  /** A character in place of an icon (the "?"). */
  glyph?: string
  /** A round portrait in place of an icon (your character). */
  image?: string
  /** Shown when the image is not painted yet. */
  fallback?: string
  badge?: string
  /** Fires without becoming the selected screen. */
  action?: boolean
}
