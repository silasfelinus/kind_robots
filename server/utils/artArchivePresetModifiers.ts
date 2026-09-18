// /server/utils/artArchivePresetModifiers.ts
//
// Validates the `modifiers` JSON fragment stored on an ArchiveActionPreset
// (art-archive/t-014), shaped by its `actionType`. Deliberately reuses
// ArtJob's own payload vocabulary (server/utils/artJobPayload.ts) -- a
// preset's modifiers are meant to be merged straight into a real ArtJob
// payload by whatever applies the preset (t-015's curation board), not a
// second, incompatible description of a generation request.
//
// No Prisma import: pure validation logic the admin endpoints and t-015's
// apply step both call, unit-testable without a live DATABASE_URL -- same
// reasoning artArchiveFileOps.ts's split documents.
export type ArchivePresetActionType =
  | 'ADD_LORA'
  | 'REPLACE_LORA'
  | 'REPLACE_CHECKPOINT'
  | 'APPEND_PROMPT'
  | 'REPLACE_PROMPT'
  | 'CHANGE_SETTINGS'
  | 'ADDITIONAL_RENDER'
  | 'REPLACE_SOURCE'

export const ARCHIVE_PRESET_ACTION_TYPES: ArchivePresetActionType[] = [
  'ADD_LORA',
  'REPLACE_LORA',
  'REPLACE_CHECKPOINT',
  'APPEND_PROMPT',
  'REPLACE_PROMPT',
  'CHANGE_SETTINGS',
  'ADDITIONAL_RENDER',
  'REPLACE_SOURCE',
]

export type ModifierValidationResult =
  | { valid: true }
  | { valid: false; errors: string[] }

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}

/**
 * Validates one field against a set of allowed keys/checks. Returns the
 * unknown-key and failed-check errors, if any -- callers accumulate these
 * across the whole modifiers object.
 */
function checkFields(
  modifiers: Record<string, unknown>,
  checks: Record<string, (value: unknown) => boolean>,
): string[] {
  const errors: string[] = []
  for (const key of Object.keys(modifiers)) {
    if (!(key in checks)) errors.push(`Unknown field "${key}" for this actionType.`)
  }
  for (const [key, check] of Object.entries(checks)) {
    if (key in modifiers && !check(modifiers[key])) {
      errors.push(`Field "${key}" has an invalid value.`)
    }
  }
  return errors
}

/**
 * Validates `modifiers` against the shape required by `actionType`. Every
 * shape mirrors a real ArtJob payload field name so applying a preset is a
 * direct merge, never a translation step.
 */
export function validateArchivePresetModifiers(
  actionType: ArchivePresetActionType,
  modifiers: unknown,
): ModifierValidationResult {
  if (!isPlainObject(modifiers)) {
    return { valid: false, errors: ['modifiers must be a JSON object.'] }
  }

  switch (actionType) {
    case 'ADD_LORA':
    case 'REPLACE_LORA': {
      const errors = checkFields(modifiers, {
        name: isNonEmptyString,
        weight: isFiniteNumber,
        resourceId: isFiniteNumber,
      })
      if (!isNonEmptyString(modifiers.name) && !isFiniteNumber(modifiers.resourceId)) {
        errors.push('Provide at least one of "name" or "resourceId".')
      }
      return errors.length ? { valid: false, errors } : { valid: true }
    }

    case 'REPLACE_CHECKPOINT': {
      const errors = checkFields(modifiers, {
        checkpoint: isNonEmptyString,
        checkpointResourceId: isFiniteNumber,
      })
      if (!isNonEmptyString(modifiers.checkpoint) && !isFiniteNumber(modifiers.checkpointResourceId)) {
        errors.push('Provide at least one of "checkpoint" or "checkpointResourceId".')
      }
      return errors.length ? { valid: false, errors } : { valid: true }
    }

    case 'APPEND_PROMPT':
    case 'REPLACE_PROMPT': {
      const errors = checkFields(modifiers, {
        promptString: isNonEmptyString,
        negativePrompt: (value) => typeof value === 'string',
      })
      if (!isNonEmptyString(modifiers.promptString)) {
        errors.push('Field "promptString" is required.')
      }
      return errors.length ? { valid: false, errors } : { valid: true }
    }

    case 'CHANGE_SETTINGS': {
      const errors = checkFields(modifiers, {
        cfg: isFiniteNumber,
        steps: isFiniteNumber,
        seed: isFiniteNumber,
        sampler: isNonEmptyString,
        width: isFiniteNumber,
        height: isFiniteNumber,
      })
      if (Object.keys(modifiers).length === 0) {
        errors.push('Provide at least one generation setting to change.')
      }
      return errors.length ? { valid: false, errors } : { valid: true }
    }

    case 'ADDITIONAL_RENDER': {
      // No required fields -- "create an additional render" reuses the
      // entry's existing evidence as-is. An optional note is still allowed
      // for admin context.
      const errors = checkFields(modifiers, { note: (value) => typeof value === 'string' })
      return errors.length ? { valid: false, errors } : { valid: true }
    }

    case 'REPLACE_SOURCE': {
      const errors = checkFields(modifiers, { relativePath: isNonEmptyString })
      if (!isNonEmptyString(modifiers.relativePath)) {
        errors.push('Field "relativePath" is required.')
      }
      return errors.length ? { valid: false, errors } : { valid: true }
    }

    default: {
      const exhaustiveCheck: never = actionType
      return { valid: false, errors: [`Unsupported actionType "${String(exhaustiveCheck)}".`] }
    }
  }
}
