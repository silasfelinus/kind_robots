// The one settings sheet every playbook shares, generalized from Emperor of
// Dust's reading preferences. Games read these; they never add a second
// settings screen of their own.

export const KIT_SETTING_OPTIONS = {
  textSize: ['comfortable', 'large', 'extra-large'],
  font: ['serif', 'sans'],
  contrast: ['standard', 'high'],
  motion: ['system', 'reduced'],
  textSpeed: ['normal', 'fast', 'instant'],
  sound: ['on', 'off'],
  trailer: ['first-visit', 'always', 'never'],
  romance: ['on', 'off'],
} as const

export type KitSettingKey = keyof typeof KIT_SETTING_OPTIONS

export type KitSettings = {
  [K in KitSettingKey]: (typeof KIT_SETTING_OPTIONS)[K][number]
}

export const DEFAULT_KIT_SETTINGS: KitSettings = {
  textSize: 'comfortable',
  font: 'serif',
  contrast: 'standard',
  motion: 'system',
  textSpeed: 'normal',
  sound: 'on',
  trailer: 'first-visit',
  romance: 'on',
}

export const KIT_SETTING_LABELS: Record<
  KitSettingKey,
  { label: string; options: Record<string, string> }
> = {
  textSize: {
    label: 'Text size',
    options: {
      comfortable: 'Comfortable',
      large: 'Large',
      'extra-large': 'Extra large',
    },
  },
  font: { label: 'Reading font', options: { serif: 'Serif', sans: 'Sans' } },
  contrast: {
    label: 'Contrast',
    options: { standard: 'Standard', high: 'High' },
  },
  motion: {
    label: 'Motion',
    options: { system: 'Follow system', reduced: 'Reduced' },
  },
  textSpeed: {
    label: 'Text speed',
    options: { normal: 'Normal', fast: 'Fast', instant: 'Instant' },
  },
  sound: { label: 'Sound', options: { on: 'On', off: 'Off' } },
  trailer: {
    label: 'Title trailer',
    options: {
      'first-visit': 'First visit',
      always: 'Every visit',
      never: 'Never',
    },
  },
  romance: {
    label: 'Romance content',
    options: { on: 'Shown', off: 'Hidden' },
  },
}

export function isKitSetting<K extends KitSettingKey>(
  key: K,
  value: unknown,
): value is KitSettings[K] {
  return (KIT_SETTING_OPTIONS[key] as readonly unknown[]).includes(value)
}

/** Stored settings, keeping every valid field and defaulting the rest. */
export function parseKitSettings(raw: unknown): KitSettings {
  const result = { ...DEFAULT_KIT_SETTINGS }
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return result
  const record = raw as Record<string, unknown>
  for (const key of Object.keys(KIT_SETTING_OPTIONS) as KitSettingKey[]) {
    const value = record[key]
    if (isKitSetting(key, value))
      (result as Record<string, string>)[key] = value
  }
  return result
}

export type KitProgress = {
  /** Unlocked scrapbook moments, reveals and endings, each with when it first happened. */
  moments: Record<string, string>
  reveals: Record<string, string>
  endings: Record<string, string>
  trailerSeen: boolean
}

export function emptyKitProgress(): KitProgress {
  return { moments: {}, reveals: {}, endings: {}, trailerSeen: false }
}

function stampMap(raw: unknown): Record<string, string> {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {}
  return Object.fromEntries(
    Object.entries(raw as Record<string, unknown>).filter(
      (entry): entry is [string, string] => typeof entry[1] === 'string',
    ),
  )
}

export function parseKitProgress(raw: unknown): KitProgress {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw))
    return emptyKitProgress()
  const record = raw as Record<string, unknown>
  return {
    moments: stampMap(record.moments),
    reveals: stampMap(record.reveals),
    endings: stampMap(record.endings),
    trailerSeen: record.trailerSeen === true,
  }
}

export type KitSave = {
  version: 1
  settings: KitSettings
  progress: KitProgress
}

/** Reads one game's stored text. Unreadable text returns null so it is never overwritten. */
export function decodeKitSave(text: string | null): KitSave | null {
  if (!text)
    return {
      version: 1,
      settings: { ...DEFAULT_KIT_SETTINGS },
      progress: emptyKitProgress(),
    }
  try {
    const parsed: unknown = JSON.parse(text)
    if (!parsed || typeof parsed !== 'object') return null
    const record = parsed as Record<string, unknown>
    if (record.version !== 1) return null
    return {
      version: 1,
      settings: parseKitSettings(record.settings),
      progress: parseKitProgress(record.progress),
    }
  } catch {
    return null
  }
}

export const kitStorageKey = (gameId: string) => `kr-playbook-kit-${gameId}-v1`

/** Whether the title trailer should open on arrival. */
export function trailerDue(
  settings: KitSettings,
  progress: KitProgress,
): boolean {
  if (settings.trailer === 'never') return false
  if (settings.trailer === 'always') return true
  return !progress.trailerSeen
}
