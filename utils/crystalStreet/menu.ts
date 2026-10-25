// Screens reachable from the Terrors on Crystal Street main menu.
export type MenuView = 'scrapbook' | 'settings' | 'theme'

// Tabs inside the scrapbook: each shows only what play has uncovered.
export type ScrapbookTab = 'weeks' | 'nightmares' | 'endings' | 'friends'

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
