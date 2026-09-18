// /server/utils/applyArchivePresetToPayload.ts
//
// Merges a validated ArchiveActionPreset's `modifiers` into a real ArtJob
// payload (art-archive/t-025, kaizen from t-014). artArchivePresetModifiers.ts
// deliberately shapes `modifiers` to mirror ArtJob payload field names --
// this is the function that actually performs that merge, giving t-015's
// curation board (and any future "apply preset" endpoint) a tested
// foundation to call instead of reimplementing it inline against a live
// ArtJob write path.
//
// No Prisma import: pure merge logic, unit-testable without a live
// DATABASE_URL, matching artArchivePresetModifiers.ts's own split. Modifiers
// are assumed already validated by validateArchivePresetModifiers -- this
// does not re-validate, it only merges.
import type { ArchivePresetActionType } from './artArchivePresetModifiers'
import type { ArtJobPayloadRecord } from './artJobPayload'

export type ArchivePresetModifiers = Record<string, unknown>

type ArtJobLoraEntry = {
  resourceId?: number
  name?: string
  strength?: number
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : []
}

function loraEntryFromModifiers(modifiers: ArchivePresetModifiers): ArtJobLoraEntry {
  const entry: ArtJobLoraEntry = {}
  if (typeof modifiers.name === 'string') entry.name = modifiers.name
  if (typeof modifiers.resourceId === 'number') entry.resourceId = modifiers.resourceId
  if (typeof modifiers.weight === 'number') entry.strength = modifiers.weight
  return entry
}

/**
 * Merges one preset's `modifiers` into `basePayload` per `actionType`,
 * returning a new payload -- `basePayload` is never mutated. Field names
 * match ArtJobPayloadRecord/ArtEnqueueRequest's own vocabulary (promptString,
 * negativePrompt, checkpoint, checkpointResourceId, loras, cfg, steps, seed,
 * sampler, width, height), so this is a direct merge, never a translation
 * step.
 */
export function applyArchivePresetToPayload(
  actionType: ArchivePresetActionType,
  modifiers: ArchivePresetModifiers,
  basePayload: ArtJobPayloadRecord,
): ArtJobPayloadRecord {
  const payload: ArtJobPayloadRecord = { ...basePayload }

  switch (actionType) {
    case 'ADD_LORA': {
      const existing = asArray(payload.loras) as ArtJobLoraEntry[]
      payload.loras = [...existing, loraEntryFromModifiers(modifiers)]
      return payload
    }

    case 'REPLACE_LORA': {
      payload.loras = [loraEntryFromModifiers(modifiers)]
      return payload
    }

    case 'REPLACE_CHECKPOINT': {
      if (typeof modifiers.checkpoint === 'string') {
        payload.checkpoint = modifiers.checkpoint
      }
      if (typeof modifiers.checkpointResourceId === 'number') {
        payload.checkpointResourceId = modifiers.checkpointResourceId
      }
      return payload
    }

    case 'APPEND_PROMPT': {
      if (typeof modifiers.promptString === 'string') {
        const existing = typeof payload.promptString === 'string' ? payload.promptString : ''
        payload.promptString = existing
          ? `${existing}, ${modifiers.promptString}`
          : modifiers.promptString
      }
      if (typeof modifiers.negativePrompt === 'string') {
        const existing = typeof payload.negativePrompt === 'string' ? payload.negativePrompt : ''
        payload.negativePrompt = existing
          ? `${existing}, ${modifiers.negativePrompt}`
          : modifiers.negativePrompt
      }
      return payload
    }

    case 'REPLACE_PROMPT': {
      if (typeof modifiers.promptString === 'string') payload.promptString = modifiers.promptString
      if (typeof modifiers.negativePrompt === 'string') payload.negativePrompt = modifiers.negativePrompt
      return payload
    }

    case 'CHANGE_SETTINGS': {
      for (const key of ['cfg', 'steps', 'seed', 'sampler', 'width', 'height'] as const) {
        if (key in modifiers) payload[key] = modifiers[key]
      }
      return payload
    }

    case 'ADDITIONAL_RENDER': {
      // Reuses the entry's existing evidence as-is -- no merge to perform.
      return payload
    }

    case 'REPLACE_SOURCE': {
      if (typeof modifiers.relativePath === 'string') payload.relativePath = modifiers.relativePath
      return payload
    }

    default: {
      const exhaustiveCheck: never = actionType
      void exhaustiveCheck
      return payload
    }
  }
}
