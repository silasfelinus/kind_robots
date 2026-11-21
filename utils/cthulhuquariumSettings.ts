// utils/cthulhuquariumSettings.ts
//
// The Cthulhuquarium settings panel's values (conductor cthulhuquarium/t-100):
// kept per browser by the story helper, read defensively so an old or broken
// localStorage entry can never set an impossible value. Pure; names are
// namespaced because Nuxt auto-imports utils/.

export type CthulhuquariumTextSpeed = 'slow' | 'normal' | 'fast' | 'instant'
export type CthulhuquariumMotionSetting = 'system' | 'reduced' | 'full'

export interface CthulhuquariumSettings {
  volume: number
  textSpeed: CthulhuquariumTextSpeed
  largeText: boolean
  highContrast: boolean
  motion: CthulhuquariumMotionSetting
}

export const CTHULHUQUARIUM_DEFAULT_SETTINGS: CthulhuquariumSettings = {
  volume: 0.5,
  textSpeed: 'normal',
  largeText: false,
  highContrast: false,
  motion: 'system',
}

/** A stored value, read defensively: anything unknown falls back to default. */
export function readCthulhuquariumSettings(
  raw: string | null,
): CthulhuquariumSettings {
  let parsed: Partial<CthulhuquariumSettings> = {}
  try {
    parsed = raw ? (JSON.parse(raw) as Partial<CthulhuquariumSettings>) : {}
  } catch {
    parsed = {}
  }
  const volume = Number(parsed.volume)
  return {
    volume: Number.isFinite(volume)
      ? Math.min(1, Math.max(0, volume))
      : CTHULHUQUARIUM_DEFAULT_SETTINGS.volume,
    textSpeed: (['slow', 'normal', 'fast', 'instant'] as const).includes(
      parsed.textSpeed as CthulhuquariumTextSpeed,
    )
      ? (parsed.textSpeed as CthulhuquariumTextSpeed)
      : CTHULHUQUARIUM_DEFAULT_SETTINGS.textSpeed,
    largeText: parsed.largeText === true,
    highContrast: parsed.highContrast === true,
    motion: (['system', 'reduced', 'full'] as const).includes(
      parsed.motion as CthulhuquariumMotionSetting,
    )
      ? (parsed.motion as CthulhuquariumMotionSetting)
      : CTHULHUQUARIUM_DEFAULT_SETTINGS.motion,
  }
}
