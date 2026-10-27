import { BRIAR_SAVE_VERSION, type BriarSave } from '../memoryDungeonWorld'
import type { DarkBriarProgress } from './darkBriar'
import type { DarkHouseProgress } from './darkHouse'
import type { MemoryRealitySave } from './campaignPersistence'
import type { CrossMapSealChronicle } from './crossMapSealChronicle'

export const MEMORY_SAVE_SLOT_COUNT = 3

export interface MemoryCheckpoint {
  version: 1
  savedAt: string
  briar: BriarSave
  dark: DarkBriarProgress
  house: DarkHouseProgress
  reality: MemoryRealitySave
  seals: CrossMapSealChronicle
}

export type MemorySaveSlots = (MemoryCheckpoint | null)[]

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function hasValidBriarCards(value: unknown, mapCards: boolean): boolean {
  return (
    Array.isArray(value) &&
    value.every(
      (card) =>
        isRecord(card) &&
        Number.isSafeInteger(card.id) &&
        Number.isSafeInteger(card.pairId) &&
        typeof card.image === 'string' &&
        card.image.length > 0 &&
        typeof card.flipped === 'boolean' &&
        typeof card.matched === 'boolean' &&
        (!mapCards || (typeof card.tile === 'string' && card.tile.length > 0)),
    )
  )
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string')
}

function hasValidDarkHouseProgress(value: Record<string, unknown>): boolean {
  if (
    typeof value.active !== 'boolean' ||
    typeof value.current !== 'string' ||
    !isStringArray(value.visited) ||
    !isRecord(value.decisions) ||
    !Object.values(value.decisions).every((choice) => typeof choice === 'string') ||
    !isRecord(value.trials) ||
    !isRecord(value.puzzles) ||
    !Number.isSafeInteger(value.spentEchoes) ||
    (value.spentEchoes as number) < 0 ||
    (value.ending !== null && typeof value.ending !== 'string') ||
    typeof value.status !== 'string'
  )
    return false

  return (
    Object.values(value.trials).every(
      (trial) =>
        isRecord(trial) &&
        isStringArray(trial.matched) &&
        isStringArray(trial.faceUp) &&
        Number.isSafeInteger(trial.failures) &&
        (trial.failures as number) >= 0 &&
        (trial.clue === null || typeof trial.clue === 'string') &&
        typeof trial.note === 'string',
    ) &&
    Object.values(value.puzzles).every(
      (puzzle) =>
        isRecord(puzzle) &&
        typeof puzzle.solved === 'boolean' &&
        isStringArray(puzzle.wrong) &&
        typeof puzzle.hint === 'boolean' &&
        typeof puzzle.note === 'string',
    )
  )
}

/** Reject incomplete/corrupt slots rather than replacing the current run with defaults. */
export function restoreMemoryCheckpoint(raw: unknown): MemoryCheckpoint | null {
  if (!isRecord(raw) || raw.version !== 1) return null
  if (
    typeof raw.savedAt !== 'string' ||
    !Number.isFinite(Date.parse(raw.savedAt)) ||
    !isRecord(raw.briar) ||
    !isRecord(raw.dark) ||
    !isRecord(raw.house) ||
    !isRecord(raw.reality) ||
    !isRecord(raw.seals)
  )
    return null
  if (
    raw.briar.version !== BRIAR_SAVE_VERSION ||
    raw.dark.version !== 3 ||
    raw.house.version !== 2 ||
    raw.reality.version !== 1 ||
    raw.seals.version !== 1 ||
    !Array.isArray(raw.briar.revealed) ||
    !Array.isArray(raw.dark.revealed) ||
    !hasValidDarkHouseProgress(raw.house) ||
    !isRecord(raw.reality.progress) ||
    !Array.isArray(raw.seals.seen)
  )
    return null
  if (
    !hasValidBriarCards(raw.briar.mapCards, true) ||
    !hasValidBriarCards(raw.briar.cards, false) ||
    !Array.isArray(raw.dark.mapCards) ||
    raw.dark.mapCards.some(
      (card) =>
        !isRecord(card) ||
        !Number.isSafeInteger(card.id) ||
        !Number.isSafeInteger(card.pairId) ||
        typeof card.tile !== 'string' ||
        typeof card.image !== 'string' ||
        typeof card.matched !== 'boolean',
    )
  )
    return null
  return raw as unknown as MemoryCheckpoint
}

export function restoreMemorySaveSlots(raw: unknown): MemorySaveSlots {
  const slots = Array.isArray(raw) ? raw : []
  return Array.from({ length: MEMORY_SAVE_SLOT_COUNT }, (_, index) =>
    restoreMemoryCheckpoint(slots[index]),
  )
}

/** A filled slot requires an explicit overwrite request, even from store callers. */
export function writeMemorySaveSlot(
  slots: MemorySaveSlots,
  index: number,
  checkpoint: MemoryCheckpoint,
  overwrite = false,
): MemorySaveSlots | null {
  if (
    !Number.isInteger(index) ||
    index < 0 ||
    index >= MEMORY_SAVE_SLOT_COUNT ||
    (slots[index] && !overwrite)
  )
    return null
  return slots.map((slot, position) => (position === index ? checkpoint : slot))
}
