/** Reader-only preferences. These never change game state or saved endings. */
export type EcotoneTextSpeed = 'instant' | 'normal' | 'slow'
export type EcotoneDisplaySettings = {
  scale: number
  speed: EcotoneTextSpeed
}

const KEY = 'kr.ecotone.display.v1'
const SCALES = [1, 1.2, 1.4, 1.6] as const
const SPEEDS: EcotoneTextSpeed[] = ['instant', 'normal', 'slow']

export const DEFAULT_ECOTONE_DISPLAY: EcotoneDisplaySettings = {
  scale: 1.2,
  speed: 'instant',
}

export function normalizeEcotoneDisplay(
  input: unknown,
): EcotoneDisplaySettings {
  if (!input || typeof input !== 'object') return { ...DEFAULT_ECOTONE_DISPLAY }
  const value = input as Partial<EcotoneDisplaySettings>
  return {
    scale:
      typeof value.scale === 'number' &&
      SCALES.some((scale) => scale === value.scale)
        ? value.scale
        : DEFAULT_ECOTONE_DISPLAY.scale,
    speed: SPEEDS.some((speed) => speed === value.speed)
      ? value.speed!
      : DEFAULT_ECOTONE_DISPLAY.speed,
  }
}

export function loadEcotoneDisplay(): EcotoneDisplaySettings {
  if (!import.meta.client) return { ...DEFAULT_ECOTONE_DISPLAY }
  try {
    return normalizeEcotoneDisplay(
      JSON.parse(window.localStorage.getItem(KEY) ?? 'null'),
    )
  } catch {
    return { ...DEFAULT_ECOTONE_DISPLAY }
  }
}

export function saveEcotoneDisplay(settings: EcotoneDisplaySettings): void {
  if (!import.meta.client) return
  try {
    window.localStorage.setItem(
      KEY,
      JSON.stringify(normalizeEcotoneDisplay(settings)),
    )
  } catch {
    // Incognito / quota: settings still work in memory.
  }
}
