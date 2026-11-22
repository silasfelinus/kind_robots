import { MAX_SAVE_BYTES, serializedSaveBytes } from '../saves'

export const RAINBOW_SAVE_GAME = 'rainbow-bullet-hell-space-princess'
export const RAINBOW_SLOT_COUNT = 3

/**
 * Slot one keeps the original key, migrating existing flights without moving
 * or rewriting a checkpoint. The short suffixes fit Arcade's 40-char slug key.
 */
export function rainbowSlotKey(slot: number): string | null {
  if (!Number.isInteger(slot) || slot < 0 || slot >= RAINBOW_SLOT_COUNT)
    return null
  return slot === 0 ? RAINBOW_SAVE_GAME : `${RAINBOW_SAVE_GAME}-s${slot + 1}`
}

export function rainbowSlotSummary(
  save: { checkpoint: { act: number; frame: number }; medals: object } | null,
): string {
  if (!save) return 'New flight'
  const act = save.checkpoint?.act
  if (!Number.isInteger(act) || act < 1 || act > 12)
    return 'Flight needs recovery'
  const medals =
    save.medals &&
    typeof save.medals === 'object' &&
    !Array.isArray(save.medals)
      ? Object.keys(save.medals).length
      : 0
  return `Act ${act} · ${medals} medal${medals === 1 ? '' : 's'}`
}

export function rainbowSlotSaveFits(save: unknown): boolean {
  const bytes = serializedSaveBytes(save)
  return bytes !== null && bytes <= MAX_SAVE_BYTES
}
