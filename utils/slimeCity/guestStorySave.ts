import { validSlimeCityStory, type SlimeCityStory } from './storySave'

/** Guest progress stays on this device, never mixed into an authenticated account. */
export const GUEST_SLIME_STORY_KEY = 'kr-slime-city-story-v1'

export function readGuestSlimeStory(
  storage: Pick<Storage, 'getItem'> | null = typeof localStorage === 'undefined'
    ? null
    : localStorage,
): SlimeCityStory | null {
  if (!storage) return null
  try {
    const raw = storage.getItem(GUEST_SLIME_STORY_KEY)
    if (!raw) return null
    const parsed: unknown = JSON.parse(raw)
    return validSlimeCityStory(parsed) ? parsed : null
  } catch {
    return null
  }
}

export function writeGuestSlimeStory(
  story: SlimeCityStory,
  storage: Pick<Storage, 'setItem'> | null = typeof localStorage === 'undefined'
    ? null
    : localStorage,
): boolean {
  if (!storage || !validSlimeCityStory(story)) return false
  try {
    storage.setItem(GUEST_SLIME_STORY_KEY, JSON.stringify(story))
    return true
  } catch {
    return false
  }
}

/** The exact word a player types before their guest journey is wiped. */
export const RESET_JOURNEY_PHRASE = 'RESET'

export function resetPhraseMatches(typed: string): boolean {
  return typed.trim().toUpperCase() === RESET_JOURNEY_PHRASE
}

/** Removes this device's guest journey. False when storage is unavailable. */
export function clearGuestSlimeStory(
  storage: Pick<Storage, 'removeItem'> | null = typeof localStorage ===
  'undefined'
    ? null
    : localStorage,
): boolean {
  if (!storage) return false
  try {
    storage.removeItem(GUEST_SLIME_STORY_KEY)
    return true
  } catch {
    return false
  }
}
