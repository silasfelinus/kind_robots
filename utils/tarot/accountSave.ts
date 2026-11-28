// /utils/tarot/accountSave.ts
//
// Kind Tarot reader progress: birth profiles, settings, studied majors and
// deck choice. The same shape is kept in browser storage (the guest and
// offline fallback) and, for signed-in players who leave account sync on, in
// ArcadeCabinetSave under the slug `kind-tarot` (main-game standard: saves
// follow the account across devices). The validator is shared so the server
// never stores anything the reader could not load.

export type BirthProfile = {
  id: string
  name: string
  date: string
  time: string | null
  cityId: string | null
  latitude: number
  longitude: number
  timeZone: string
}

export type TarotSettings = {
  musicOn: boolean
  musicVolume: number
  sfxOn: boolean
  sfxVolume: number
  textSize: 'sm' | 'md' | 'lg'
  revealSpeed: 'slow' | 'normal' | 'fast'
  reducedMotion: boolean
  highContrast: boolean
  /** Keep birth charts and progress in the signed-in account. */
  accountSync: boolean
}

export const DEFAULT_TAROT_SETTINGS: TarotSettings = {
  musicOn: false,
  musicVolume: 0.5,
  sfxOn: true,
  sfxVolume: 0.7,
  textSize: 'md',
  revealSpeed: 'normal',
  reducedMotion: false,
  highContrast: false,
  accountSync: true,
}

export const REVEAL_DELAY_MS: Record<TarotSettings['revealSpeed'], number> = {
  slow: 700,
  normal: 380,
  fast: 150,
}

export const TAROT_ACCOUNT_SLUG = 'kind-tarot'
export const TAROT_MAX_PROFILES = 24
export const TAROT_SAVE_MAX_BYTES = 32000

export type TarotAccountSave = {
  version: 1
  savedAt: string
  profiles: BirthProfile[]
  activeProfileId: string | null
  settings: TarotSettings
  majorsStudied: string[]
  deck: string | null
}

const DATE = /^\d{4}-\d{2}-\d{2}$/
const TIME = /^\d{1,2}:\d{2}$/
const SLUG = /^[a-z0-9-]{1,120}$/
const MAJOR = /^major-\d{2}$/

export function sanitizeSettings(value: unknown): TarotSettings {
  const raw = (value ?? {}) as Partial<TarotSettings>
  const d = DEFAULT_TAROT_SETTINGS
  const bool = (v: unknown, fallback: boolean) =>
    typeof v === 'boolean' ? v : fallback
  const volume = (v: unknown, fallback: number) =>
    typeof v === 'number' && Number.isFinite(v)
      ? Math.max(0, Math.min(1, v))
      : fallback
  const pick = <T extends string>(v: unknown, options: T[], fallback: T) =>
    options.includes(v as T) ? (v as T) : fallback
  return {
    musicOn: bool(raw.musicOn, d.musicOn),
    musicVolume: volume(raw.musicVolume, d.musicVolume),
    sfxOn: bool(raw.sfxOn, d.sfxOn),
    sfxVolume: volume(raw.sfxVolume, d.sfxVolume),
    textSize: pick(raw.textSize, ['sm', 'md', 'lg'], d.textSize),
    revealSpeed: pick(
      raw.revealSpeed,
      ['slow', 'normal', 'fast'],
      d.revealSpeed,
    ),
    reducedMotion: bool(raw.reducedMotion, d.reducedMotion),
    highContrast: bool(raw.highContrast, d.highContrast),
    accountSync: bool(raw.accountSync, d.accountSync),
  }
}

export function isBirthProfile(value: unknown): value is BirthProfile {
  const entry = value as BirthProfile
  return (
    typeof entry?.id === 'string' &&
    entry.id.length > 0 &&
    entry.id.length <= 40 &&
    typeof entry.name === 'string' &&
    entry.name.length <= 60 &&
    typeof entry.date === 'string' &&
    DATE.test(entry.date) &&
    (entry.time === null ||
      (typeof entry.time === 'string' && TIME.test(entry.time))) &&
    (entry.cityId === null ||
      (typeof entry.cityId === 'string' && SLUG.test(entry.cityId))) &&
    typeof entry.latitude === 'number' &&
    Math.abs(entry.latitude) <= 90 &&
    typeof entry.longitude === 'number' &&
    Math.abs(entry.longitude) <= 180 &&
    typeof entry.timeZone === 'string' &&
    entry.timeZone.length > 0 &&
    entry.timeZone.length <= 64
  )
}

export function emptyTarotSave(): TarotAccountSave {
  return {
    version: 1,
    savedAt: new Date(0).toISOString(),
    profiles: [],
    activeProfileId: null,
    settings: { ...DEFAULT_TAROT_SETTINGS },
    majorsStudied: [],
    deck: null,
  }
}

/** Normalize an untrusted save; throws on anything structurally wrong. */
export function parseTarotAccountSave(value: unknown): TarotAccountSave {
  const raw = (
    typeof value === 'string' ? JSON.parse(value) : value
  ) as Partial<TarotAccountSave> | null
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    throw new Error('Invalid tarot save.')
  }
  const profiles = Array.isArray(raw.profiles)
    ? raw.profiles.filter(isBirthProfile).slice(0, TAROT_MAX_PROFILES)
    : []
  const ids = new Set(profiles.map((profile) => profile.id))
  const savedAt =
    typeof raw.savedAt === 'string' && !Number.isNaN(Date.parse(raw.savedAt))
      ? new Date(raw.savedAt).toISOString()
      : new Date(0).toISOString()
  const save: TarotAccountSave = {
    version: 1,
    savedAt,
    profiles,
    activeProfileId:
      typeof raw.activeProfileId === 'string' && ids.has(raw.activeProfileId)
        ? raw.activeProfileId
        : (profiles[0]?.id ?? null),
    settings: sanitizeSettings(raw.settings),
    majorsStudied: Array.isArray(raw.majorsStudied)
      ? [
          ...new Set(
            raw.majorsStudied.filter(
              (key): key is string =>
                typeof key === 'string' && MAJOR.test(key),
            ),
          ),
        ].slice(0, 22)
      : [],
    deck: typeof raw.deck === 'string' && SLUG.test(raw.deck) ? raw.deck : null,
  }
  if (JSON.stringify(save).length > TAROT_SAVE_MAX_BYTES) {
    throw new Error('Tarot save is too large.')
  }
  return save
}

/** The newer of two saves by their savedAt stamp (ties keep the first). */
export function newerTarotSave(
  a: TarotAccountSave,
  b: TarotAccountSave,
): TarotAccountSave {
  return Date.parse(b.savedAt) > Date.parse(a.savedAt) ? b : a
}
