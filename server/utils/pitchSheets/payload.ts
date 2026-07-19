// /server/utils/pitchSheets/payload.ts
import { createError } from 'h3'
import type { Prisma } from '~/prisma/generated/prisma/client'

export const PITCHSHEET_EXTRA_DATA_LIMIT = 50_000

const allowedKeys = [
  'layoutKey',
  'title',
  'subtitle',
  'hook',
  'pitch',
  'highlight1Label',
  'highlight1Value',
  'highlight1Icon',
  'highlight2Label',
  'highlight2Value',
  'highlight2Icon',
  'highlight3Label',
  'highlight3Value',
  'highlight3Icon',
  'detail1Label',
  'detail1Body',
  'detail2Label',
  'detail2Body',
  'detail3Label',
  'detail3Body',
  'imagePath',
  'artImageId',
  'icon',
  'colorTheme',
  'extraData',
  'isPublic',
  'isActive',
  'isMature',
  'designer',
] as const

type AllowedKey = (typeof allowedKeys)[number]

export type PitchSheetPayload = Pick<Prisma.PitchSheetUncheckedCreateInput, AllowedKey>

export function sanitizePitchSheetPayload(
  body: Record<string, unknown>,
): Partial<PitchSheetPayload> {
  return allowedKeys.reduce<Partial<PitchSheetPayload>>((clean, key) => {
    if (Object.prototype.hasOwnProperty.call(body, key)) {
      ;(clean as Record<string, unknown>)[key] = body[key]
    }
    return clean
  }, {})
}

const allowedKeySet = new Set<string>(allowedKeys)

// The current SheetCreate/UpdatePayload is a broad Partial<PitchSheet>, so a
// round-tripped row can carry these server-owned fields. They are validated and
// ignored (never persisted — they are absent from allowedKeys) rather than
// rejected, while genuinely unknown fields are rejected.
const compatibilityKeys = [
  'id',
  'userId',
  'createdAt',
  'updatedAt',
  'dreamId',
  'projectId',
] as const

const compatibilityKeySet = new Set<string>(compatibilityKeys)

const booleanKeys = ['isPublic', 'isActive', 'isMature'] as const

// Rejects unknown/system fields (silent-strip → explicit reject) and validates the
// two previously-unchecked pass-through fields: artImageId and the extraData blob.
export function assertPitchSheetMutationInput(
  body: unknown,
  context: string,
): asserts body is Record<string, unknown> {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw createError({
      statusCode: 400,
      message: `${context} must be a JSON object.`,
    })
  }

  const input = body as Record<string, unknown>

  const unsupported = Object.keys(input).filter(
    (key) => !allowedKeySet.has(key) && !compatibilityKeySet.has(key),
  )

  if (unsupported.length) {
    throw createError({
      statusCode: 400,
      message: `Unsupported PitchSheet fields in ${context}: ${unsupported.join(', ')}. IDs, timestamps, identity, and system fields are server-owned.`,
    })
  }

  if (
    Object.prototype.hasOwnProperty.call(input, 'artImageId') &&
    input.artImageId !== null &&
    input.artImageId !== undefined
  ) {
    const parsed = Number(input.artImageId)
    if (!Number.isInteger(parsed) || parsed <= 0) {
      throw createError({
        statusCode: 400,
        message: 'PitchSheet field "artImageId" must be a positive integer or null.',
      })
    }
  }

  if (
    Object.prototype.hasOwnProperty.call(input, 'extraData') &&
    input.extraData !== null &&
    input.extraData !== undefined
  ) {
    if (typeof input.extraData !== 'string') {
      throw createError({
        statusCode: 400,
        message: 'PitchSheet field "extraData" must be a serialized JSON string or null.',
      })
    }

    if (input.extraData.length > PITCHSHEET_EXTRA_DATA_LIMIT) {
      throw createError({
        statusCode: 400,
        message: `PitchSheet "extraData" may not exceed ${PITCHSHEET_EXTRA_DATA_LIMIT} characters.`,
      })
    }
  }

  for (const key of booleanKeys) {
    if (
      Object.prototype.hasOwnProperty.call(input, key) &&
      input[key] !== undefined &&
      typeof input[key] !== 'boolean'
    ) {
      throw createError({
        statusCode: 400,
        message: `PitchSheet field "${key}" must be a boolean.`,
      })
    }
  }
}
