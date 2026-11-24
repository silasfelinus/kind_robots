export type RoyalReadingSize = 'standard' | 'large' | 'extra-large'

export interface RoyalDisplayPrefs {
  readingSize: RoyalReadingSize
  reducedMotion: boolean
  highContrast: boolean
}

export const ROYAL_DISPLAY_DEFAULTS: Readonly<RoyalDisplayPrefs> = {
  readingSize: 'standard',
  reducedMotion: false,
  highContrast: false,
}

export function cleanRoyalDisplayPrefs(value: unknown): RoyalDisplayPrefs {
  const input =
    value && typeof value === 'object'
      ? (value as Partial<RoyalDisplayPrefs>)
      : {}
  return {
    readingSize:
      input.readingSize === 'large' || input.readingSize === 'extra-large'
        ? input.readingSize
        : 'standard',
    reducedMotion: input.reducedMotion === true,
    highContrast: input.highContrast === true,
  }
}

export function decodeRoyalDisplayPrefs(raw: string | null): RoyalDisplayPrefs {
  try {
    return cleanRoyalDisplayPrefs(raw === null ? null : JSON.parse(raw))
  } catch {
    return { ...ROYAL_DISPLAY_DEFAULTS }
  }
}
