/** Device-only display preference. Never store account progression here. */
const KEY = 'kr-slime-city-clash-format-v1'
export type SavedClashFormat = 'solo' | 'alliance'

export function readClashFormatPreference(): SavedClashFormat | null {
  if (typeof window === 'undefined') return null
  try {
    const value = window.localStorage.getItem(KEY)
    return value === 'solo' || value === 'alliance' ? value : null
  } catch {
    return null
  }
}

export function writeClashFormatPreference(format: SavedClashFormat): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(KEY, format)
  } catch {
    // Storage can be disabled; the in-memory selection still works.
  }
}
