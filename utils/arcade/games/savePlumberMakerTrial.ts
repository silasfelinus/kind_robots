import { MAKER_REPLAY_MAX_FRAMES } from './savePlumberMakerReplay'

export const MAKER_TIME_KEY = 'kr:save-plumber:maker-times:v1'
export const MAKER_BEST_LIMIT = 64

export function formatMakerTime(frames: number): string {
  const safe = Number.isFinite(frames) ? Math.max(0, Math.floor(frames)) : 0
  const minutes = Math.floor(safe / 3600)
  const seconds = Math.floor((safe % 3600) / 60)
  const hundredths = Math.floor(((safe % 60) * 100) / 60)
  return (
    minutes +
    ':' +
    String(seconds).padStart(2, '0') +
    '.' +
    String(hundredths).padStart(2, '0')
  )
}

export function shouldSaveMakerTime(
  previous: number | undefined,
  frames: number,
): boolean {
  return (
    Number.isInteger(frames) &&
    frames > 0 &&
    frames <= MAKER_REPLAY_MAX_FRAMES &&
    (previous === undefined || frames < previous)
  )
}

export function readMakerTimes(raw: unknown): Record<string, number> {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {}
  return Object.fromEntries(
    Object.entries(raw)
      .filter(
        ([id, frames]) =>
          /^[a-z0-9]{1,12}$/.test(id) &&
          typeof frames === 'number' &&
          Number.isInteger(frames) &&
          frames > 0 &&
          frames <= MAKER_REPLAY_MAX_FRAMES,
      )
      .slice(0, MAKER_BEST_LIMIT),
  )
}
