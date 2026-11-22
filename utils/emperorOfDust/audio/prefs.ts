// utils/emperorOfDust/audio/prefs.ts
//
// Emperor of Dust sound settings (conductor emperor-of-dust t-073): a master,
// music and effects volume (0-1) and a mute switch. They ride inside the
// existing reading preferences (stores/emperorFortressStore.ts,
// 'kr-emperor-of-dust-reading-v1'), so a stored object from before t-073 simply
// lacks these keys and reads as the defaults. Pure, so the validation is
// testable in Node.

export type EmperorAudioPrefs = {
  /** Overall loudness, 0-1. */
  masterVolume: number
  /** The music bed, 0-1 (under the master). */
  musicVolume: number
  /** Effects and the wind, 0-1 (under the master). */
  sfxVolume: number
  /** Silences everything; the browser's audio is never started while muted. */
  muted: boolean
}

export type EmperorVolumeKey = 'masterVolume' | 'musicVolume' | 'sfxVolume'

/** Sound on, at a moderate level; nothing plays before the first gesture. */
export const DEFAULT_EMPEROR_AUDIO_PREFS: Readonly<EmperorAudioPrefs> = {
  masterVolume: 0.7,
  musicVolume: 0.6,
  sfxVolume: 0.8,
  muted: false,
}

export const EMPEROR_VOLUME_KEYS: readonly EmperorVolumeKey[] = [
  'masterVolume',
  'musicVolume',
  'sfxVolume',
]

export const EMPEROR_AUDIO_PREF_KEYS: readonly (keyof EmperorAudioPrefs)[] = [
  ...EMPEROR_VOLUME_KEYS,
  'muted',
]

export function isEmperorAudioPrefKey(
  key: string,
): key is keyof EmperorAudioPrefs {
  return (EMPEROR_AUDIO_PREF_KEYS as readonly string[]).includes(key)
}

/**
 * A volume as stored: finite numbers are clamped to 0-1 and rounded to two
 * places; anything else (a string, NaN, Infinity, null) is rejected.
 */
export function cleanEmperorVolume(value: unknown): number | undefined {
  if (typeof value !== 'number' || !Number.isFinite(value)) return undefined
  return Math.round(Math.min(1, Math.max(0, value)) * 100) / 100
}

/**
 * A single sound setting, validated: the cleaned value, or undefined when the
 * value is unusable for that key.
 */
export function cleanEmperorAudioPref<K extends keyof EmperorAudioPrefs>(
  key: K,
  value: unknown,
): EmperorAudioPrefs[K] | undefined {
  if (key === 'muted')
    return (typeof value === 'boolean' ? value : undefined) as
      EmperorAudioPrefs[K] | undefined
  if (!isEmperorAudioPrefKey(key)) return undefined
  return cleanEmperorVolume(value) as EmperorAudioPrefs[K] | undefined
}

/**
 * The sound settings out of a stored preferences record. Missing keys (prefs
 * saved before t-073) and bad values fall back to the defaults one by one, so
 * one damaged value never resets the others.
 */
export function readEmperorAudioPrefs(
  record: Readonly<Record<string, unknown>> | null | undefined,
): EmperorAudioPrefs {
  const result: EmperorAudioPrefs = { ...DEFAULT_EMPEROR_AUDIO_PREFS }
  if (!record || typeof record !== 'object') return result
  for (const key of EMPEROR_VOLUME_KEYS) {
    const value = cleanEmperorVolume(record[key])
    if (value !== undefined) result[key] = value
  }
  if (typeof record.muted === 'boolean') result.muted = record.muted
  return result
}

/** The gain each bus should have: 0 everywhere when muted. */
export function emperorAudioLevels(prefs: EmperorAudioPrefs): {
  master: number
  music: number
  sfx: number
} {
  if (prefs.muted) return { master: 0, music: 0, sfx: 0 }
  return {
    master: prefs.masterVolume,
    music: prefs.musicVolume,
    sfx: prefs.sfxVolume,
  }
}
