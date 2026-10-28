import { BRIAR_SAVE_VERSION, type BriarSave } from '../memoryDungeonWorld'
import { BRIAR_CROSS_MAP_KEYS } from '../memoryDungeonWaves'
import type { DarkBriarProgress } from './darkBriar'
import type { DarkHouseProgress } from './darkHouse'
import {
  restoreMemoryRealitySave,
  type MemoryRealitySave,
} from './campaignPersistence'
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

export interface MemoryCheckpointPreview {
  location: string
  progress: string
}

/** Describe the saved reality, not the currently active expedition. */
export function memoryCheckpointPreview(
  checkpoint: MemoryCheckpoint,
): MemoryCheckpointPreview {
  const mirrored = checkpoint.reality.active === 'e02'
  const map = mirrored ? checkpoint.dark : checkpoint.briar
  const location = mirrored
    ? checkpoint.house.active
      ? `Unremembered House · ${checkpoint.house.current}`
      : `Other Marches · ${checkpoint.dark.player}`
    : checkpoint.briar.room === 'house' && checkpoint.briar.house
      ? `House That Remembers · ${checkpoint.briar.house.current}`
      : checkpoint.briar.room === 'memory'
        ? `Briar Marches · Memory duel near ${checkpoint.briar.player}`
        : `Briar Marches · ${checkpoint.briar.player}`
  const progress = [
    `${map.revealed.length}/60 revealed`,
    `round ${map.waveIndex + 1}/4`,
    `${map.attempts} attempts`,
    ...(mirrored ? [] : [`${checkpoint.briar.hearts} hearts`]),
  ].join(' · ')
  return { location, progress }
}

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
    !Object.values(value.decisions).every(
      (choice) => typeof choice === 'string',
    ) ||
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

function hasValidMemoryReality(value: Record<string, unknown>): boolean {
  if (
    (value.active !== 'e01' && value.active !== 'e02') ||
    !isRecord(value.progress)
  )
    return false

  const progress = value.progress
  if (
    !isStringArray(progress.completed) ||
    !isStringArray(progress.rememberedAnchors) ||
    typeof progress.finaleCommitted !== 'boolean'
  )
    return false

  const completed = progress.completed
  const rememberedAnchors = progress.rememberedAnchors
  const restored = restoreMemoryRealitySave(value)
  return (
    restored.active === value.active &&
    restored.progress.finaleCommitted === progress.finaleCommitted &&
    restored.progress.completed.length === completed.length &&
    restored.progress.completed.every((id) => completed.includes(id)) &&
    restored.progress.rememberedAnchors.length === rememberedAnchors.length &&
    restored.progress.rememberedAnchors.every((id) =>
      rememberedAnchors.includes(id),
    )
  )
}

function hasValidCrossMapSeals(value: Record<string, unknown>): boolean {
  const fields = [
    'seen',
    'inspected',
    'mirrorSeen',
    'counterpartSeen',
    'matched',
    'resolved',
  ] as const
  const allowed = new Set<string>(BRIAR_CROSS_MAP_KEYS)
  for (const field of fields) {
    const keys = value[field]
    if (
      !Array.isArray(keys) ||
      keys.some((key) => typeof key !== 'string' || !allowed.has(key)) ||
      new Set(keys).size !== keys.length
    )
      return false
  }

  const seen = value.seen as string[]
  const inspected = value.inspected as string[]
  const mirrorSeen = value.mirrorSeen as string[]
  const counterpartSeen = value.counterpartSeen as string[]
  const matched = value.matched as string[]
  const resolved = value.resolved as string[]
  return (
    inspected.every((key) => seen.includes(key)) &&
    mirrorSeen.every((key) => seen.includes(key)) &&
    matched.every(
      (key) => inspected.includes(key) && counterpartSeen.includes(key),
    ) &&
    resolved.every((key) => matched.includes(key))
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
    !hasValidMemoryReality(raw.reality) ||
    !hasValidCrossMapSeals(raw.seals)
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
