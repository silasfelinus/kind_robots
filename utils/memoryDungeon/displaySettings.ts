/**
 * Memory Dungeon reading and comfort settings (main-game standard, conductor
 * memory-dungeon/t-068 settings gap). Saved per browser, apart from the
 * expedition, so changing them never touches progress or checkpoints.
 */
export const MEMORY_DISPLAY_KEY = 'kr-memory-dungeon-display-v1'

export const MEMORY_TEXT_SIZES = [
  { id: 'normal', label: 'Standard' },
  { id: 'large', label: 'Large' },
  { id: 'larger', label: 'Largest' },
] as const

export type MemoryTextSize = (typeof MEMORY_TEXT_SIZES)[number]['id']

export interface MemoryDisplaySettings {
  textSize: MemoryTextSize
  reducedMotion: boolean
  highContrast: boolean
}

export const MEMORY_DISPLAY_DEFAULTS: Readonly<MemoryDisplaySettings> =
  Object.freeze({
    textSize: 'normal',
    reducedMotion: false,
    highContrast: false,
  })

/** Accept only known values; anything else falls back to the default. */
export function sanitizeMemoryDisplay(raw: unknown): MemoryDisplaySettings {
  const value =
    raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {}
  const textSize = MEMORY_TEXT_SIZES.some((size) => size.id === value.textSize)
    ? (value.textSize as MemoryTextSize)
    : MEMORY_DISPLAY_DEFAULTS.textSize
  return {
    textSize,
    reducedMotion: value.reducedMotion === true,
    highContrast: value.highContrast === true,
  }
}

type DisplayStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>

export function loadMemoryDisplay(
  storage: DisplayStorage | null | undefined,
): MemoryDisplaySettings {
  try {
    const stored = storage?.getItem(MEMORY_DISPLAY_KEY)
    return sanitizeMemoryDisplay(stored ? JSON.parse(stored) : null)
  } catch {
    return { ...MEMORY_DISPLAY_DEFAULTS }
  }
}

export function saveMemoryDisplay(
  storage: DisplayStorage | null | undefined,
  settings: MemoryDisplaySettings,
): void {
  try {
    const clean = sanitizeMemoryDisplay(settings)
    if (
      clean.textSize === MEMORY_DISPLAY_DEFAULTS.textSize &&
      !clean.reducedMotion &&
      !clean.highContrast
    )
      storage?.removeItem(MEMORY_DISPLAY_KEY)
    else storage?.setItem(MEMORY_DISPLAY_KEY, JSON.stringify(clean))
  } catch {
    // Private windows can refuse storage; the choice still applies this visit.
  }
}

/** Root classes applied to the in-game console; styles in memory-dungeon.css. */
export function memoryDisplayClasses(
  settings: MemoryDisplaySettings,
): string[] {
  const classes: string[] = []
  if (settings.textSize !== 'normal')
    classes.push(`md-text-${settings.textSize}`)
  if (settings.reducedMotion) classes.push('md-reduce-motion')
  if (settings.highContrast) classes.push('md-high-contrast')
  return classes
}
