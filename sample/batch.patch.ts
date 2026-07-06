// @ts-nocheck
/* eslint-disable */
// test-ignore

// server/api/samples/batch.patch.ts
//
// TEMPLATE: batch update for a fictional `Sample` model, modeled on
// server/api/scenarios/batch.patch.ts.
// Body shape: { "updates": [ { "id": number, ...sampleFields }, ... ] }
// Each entry is validated and updated independently inside its own
// try/catch; one failing entry never aborts the others. Returns a per-item
// results array with 200 (all ok) or 207 Multi-Status (partial).
// To copy for a new model: swap `sample` for your prisma model accessor and
// keep buildSampleUpdateInput in sync with your [id].patch.ts.
import { defineEventHandler, createError, readBody } from 'h3'
import prisma from '../../utils/prisma'
import { errorHandler } from '../../utils/error'
import { validateApiKey } from '../../utils/validateKey'
import { Prisma } from '~/prisma/generated/prisma/client'

type SamplePatchInput = {
  title?: unknown
  description?: unknown
  label?: unknown
  type?: unknown
  designer?: unknown
  isPublic?: unknown
  isMature?: unknown
  imageId?: unknown
}

type SampleBatchEntry = SamplePatchInput & { id?: unknown }

type SampleBatchBody = {
  updates?: unknown
}

type BatchResult = {
  id: number | null
  success: boolean
  message: string
  statusCode: number
  data?: unknown
}

// ── Normalizer helpers (same strict PATCH style as [id].patch.ts) ───────────

function normalizeRequiredString(
  value: unknown,
  field: string,
  maxLength = 191,
): string {
  if (typeof value !== 'string' || !value.trim()) {
    throw createError({
      statusCode: 400,
      message: `The "${field}" field must be a non-empty string when provided.`,
    })
  }

  const trimmed = value.trim()

  if (trimmed.length > maxLength) {
    throw createError({
      statusCode: 400,
      message: `The "${field}" field must be ${maxLength} characters or fewer.`,
    })
  }

  return trimmed
}

function normalizeNullableString(value: unknown, field: string): string | null {
  if (value === null) return null

  if (typeof value !== 'string') {
    throw createError({
      statusCode: 400,
      message: `The "${field}" field must be a string or null when provided.`,
    })
  }

  const trimmed = value.trim()
  return trimmed || null
}

function normalizeBoolean(value: unknown, field: string): boolean {
  if (typeof value === 'boolean') return value

  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase()

    if (normalized === 'true') return true
    if (normalized === 'false') return false
  }

  throw createError({
    statusCode: 400,
    message: `The "${field}" field must be a boolean when provided.`,
  })
}

function normalizeArtImageRelation(
  value: unknown,
): Prisma.ArtImageUpdateOneWithoutSamplesNestedInput {
  if (value === null || value === '') {
    return { disconnect: true }
  }

  const id = Number(value)

  if (!Number.isInteger(id) || id <= 0) {
    throw createError({
      statusCode: 400,
      message: 'imageId must be a positive integer or null when provided.',
    })
  }

  return { connect: { id } }
}

// Add your model's fields here — keep the `'field' in body` guards.
function buildSampleUpdateInput(
  body: SamplePatchInput,
): Prisma.SampleUpdateInput {
  const data: Prisma.SampleUpdateInput = {}

  if ('title' in body) data.title = normalizeRequiredString(body.title, 'title')
  if ('description' in body) {
    data.description = normalizeNullableString(body.description, 'description')
  }
  if ('label' in body) data.label = normalizeNullableString(body.label, 'label')
  if ('type' in body) data.type = normalizeNullableString(body.type, 'type')
  if ('designer' in body) {
    data.designer = normalizeNullableString(body.designer, 'designer')
  }
  if ('isPublic' in body) {
    data.isPublic = normalizeBoolean(body.isPublic, 'isPublic')
  }
  if ('isMature' in body) {
    data.isMature = normalizeBoolean(body.isMature, 'isMature')
  }
  if ('imageId' in body) {
    data.ArtImage = normalizeArtImageRelation(body.imageId)
  }

  return data
}

// One entry = one result. Errors are caught here so the batch keeps going.
async function processEntry(
  entry: SampleBatchEntry,
  user: { id: number; Role: string },
): Promise<BatchResult> {
  let id: number | null = null

  try {
    id = Number(entry.id)

    if (!Number.isInteger(id) || id <= 0) {
      throw createError({
        statusCode: 400,
        message: 'Invalid sample ID. It must be a positive integer.',
      })
    }

    const existingSample = await prisma.sample.findUnique({
      where: { id },
      select: { id: true, userId: true },
    })

    if (!existingSample) {
      throw createError({
        statusCode: 404,
        message: 'Sample not found.',
      })
    }

    // Per-entry ownership check with admin bypass — keep this when copying.
    const isAdmin = user.Role === 'ADMIN' || user.id === 1

    if (existingSample.userId !== user.id && !isAdmin) {
      throw createError({
        statusCode: 403,
        message: 'You do not have permission to update this sample.',
      })
    }

    // Strip the routing id before building the Prisma update input.
    const { id: _omit, ...fields } = entry
    void _omit

    if (Object.keys(fields).length === 0) {
      throw createError({
        statusCode: 400,
        message: 'No data provided for update.',
      })
    }

    const data = buildSampleUpdateInput(fields)

    if (Object.keys(data).length === 0) {
      throw createError({
        statusCode: 400,
        message: 'No valid sample fields provided for update.',
      })
    }

    const updatedSample = await prisma.sample.update({
      where: { id },
      data,
      include: {
        ArtImage: true,
        User: {
          select: { id: true, username: true },
        },
      },
    })

    return {
      id,
      success: true,
      message: 'Sample updated successfully.',
      statusCode: 200,
      data: updatedSample,
    }
  } catch (error: unknown) {
    const handledError = errorHandler(error)

    return {
      id,
      success: false,
      message:
        handledError.message ||
        `Failed to update sample with ID ${id ?? 'unknown'}.`,
      statusCode: handledError.statusCode || 500,
    }
  }
}

export default defineEventHandler(async (event) => {
  try {
    const { isValid, user } = await validateApiKey(event)

    if (!isValid || !user) {
      throw createError({
        statusCode: 401,
        message: 'Invalid or expired token.',
      })
    }

    const body = await readBody<SampleBatchBody>(event)

    if (!body || !Array.isArray(body.updates) || body.updates.length === 0) {
      throw createError({
        statusCode: 400,
        message:
          'Request body must include a non-empty "updates" array of sample objects.',
      })
    }

    const results: BatchResult[] = []

    for (const entry of body.updates as SampleBatchEntry[]) {
      if (!entry || typeof entry !== 'object') {
        results.push({
          id: null,
          success: false,
          message: 'Each update entry must be an object with an "id".',
          statusCode: 400,
        })
        continue
      }

      results.push(await processEntry(entry, user))
    }

    const updatedCount = results.filter((result) => result.success).length
    const failedCount = results.length - updatedCount

    // 200 if everything succeeded, 207 (Multi-Status) if partial.
    event.node.res.statusCode = failedCount === 0 ? 200 : 207

    return {
      success: failedCount === 0,
      message: `Batch complete: ${updatedCount} updated, ${failedCount} failed.`,
      data: results,
      statusCode: event.node.res.statusCode,
    }
  } catch (error: unknown) {
    const handledError = errorHandler(error)
    event.node.res.statusCode = handledError.statusCode || 500

    return {
      success: false,
      message: handledError.message || 'Failed to process sample batch.',
      statusCode: event.node.res.statusCode,
    }
  }
})
