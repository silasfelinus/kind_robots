export type ShiftingLandsPresentationPreferences = {
  reducedMotion: boolean
  soundEnabled: boolean
}

// Display choices are NOT game actions. Keep storage outside the illustrated
// board, which must remain free of direct browser-storage and network access.
export const PRESENTATION_KEY = 'kr.shiftingLands.presentation.v1'

export function readShiftingLandsPresentation(): ShiftingLandsPresentationPreferences {
  if (typeof window === 'undefined')
    return { reducedMotion: true, soundEnabled: false }
  let reducedMotion = false
  try {
    reducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches
    const stored = window.localStorage.getItem(PRESENTATION_KEY)
    if (!stored) return { reducedMotion, soundEnabled: false }
    const parsed = JSON.parse(
      stored,
    ) as Partial<ShiftingLandsPresentationPreferences>
    return {
      reducedMotion:
        typeof parsed.reducedMotion === 'boolean'
          ? parsed.reducedMotion
          : reducedMotion,
      soundEnabled:
        typeof parsed.soundEnabled === 'boolean' ? parsed.soundEnabled : false,
    }
  } catch {
    return { reducedMotion, soundEnabled: false }
  }
}

export function writeShiftingLandsPresentation(
  preferences: ShiftingLandsPresentationPreferences,
): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(
      PRESENTATION_KEY,
      JSON.stringify({
        reducedMotion: preferences.reducedMotion,
        soundEnabled: preferences.soundEnabled,
      }),
    )
  } catch {
    // Browser storage permissions cannot affect gameplay or replay.
  }
}
