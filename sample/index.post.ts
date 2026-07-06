// @ts-nocheck
/* eslint-disable */
// test-ignore

// server/api/samples/index.post.ts
//
// TEMPLATE: create endpoint (single object OR array batch) for a fictional
// `Sample` model. To copy for a new model:
//   1. Swap `sample` for your prisma model accessor and `Sample` for its type.
//   2. Rewrite SamplePostInput + buildSampleCreateInput with your fields,
//      reusing the normalize* helpers below.
//   3. Adjust (or remove) the duplicate check in findExistingSample.
// Patterns kept on purpose:
//   - normalizer helpers that throw createError(400) on bad input
//     (see server/api/scenarios/index.post.ts)
//   - server-key / admin userId elevation
//     (see server/api/prompts/index.post.ts)
//   - created/skipped/failed tracking with 201 vs 207 vs 400
import { defineEventHandler, readBody, createError } from 'h3'
import prisma from '../../utils/prisma'
import { errorHandler } from '../../utils/error'
import { validateApiKey } from '../../utils/validateKey'
import type { Sample } from '~/prisma/generated/prisma/client'
import { Prisma } from '~/prisma/generated/prisma/client'

// Every field is `unknown` — the normalizers below are the single place
// where raw request values become trusted, typed values.
type SamplePostInput = {
  title?: unknown
  description?: unknown
  label?: unknown
  type?: unknown
  designer?: unknown
  isPublic?: unknown
  isMature?: unknown
  userId?: unknown // only honored for admin / server keys (see below)
  imageId?: unknown // optional ArtImage relation
}

type SkippedSample = {
  title: string
  reason: string
  existingId?: number
}

type FailedSample = {
  title: string
  message: string
}

// ── Normalizer helpers ───────────────────────────────────────────────────────
// Copy these as-is; they are the house style for validating request fields.

function normalizeRequiredString(
  value: unknown,
  field: string,
  maxLength = 191,
): string {
  if (typeof value !== 'string' || !value.trim()) {
    throw createError({
      statusCode: 400,
      message: `The "${field}" field is required and must be a string.`,
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

function normalizeNullableString(value: unknown): string | null | undefined {
  if (value === null) return null
  if (value === undefined) return undefined
  if (typeof value !== 'string') return undefined

  const trimmed = value.trim()
  return trimmed || null
}

function normalizeBoolean(value: unknown, fallback: boolean): boolean {
  if (typeof value === 'boolean') return value
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase()

    if (normalized === 'true') return true
    if (normalized === 'false') return false
  }

  return fallback
}

function normalizeOptionalId(value: unknown, field: string): number | undefined {
  if (value === null || value === undefined || value === '') return undefined

  const id = Number(value)

  if (!Number.isInteger(id) || id <= 0) {
    throw createError({
      statusCode: 400,
      message: `${field} must be a positive integer when provided.`,
    })
  }

  return id
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message
  return 'Unknown sample create error.'
}

// ── Create-input builder ─────────────────────────────────────────────────────
// Add your model's fields here. Relations connect via nested `connect`.

function buildSampleCreateInput(
  sampleData: SamplePostInput,
  ownerId: number,
): Prisma.SampleCreateInput {
  const title = normalizeRequiredString(sampleData.title, 'title')
  const imageId = normalizeOptionalId(sampleData.imageId, 'imageId')

  return {
    User: { connect: { id: ownerId } },
    title,
    description: normalizeNullableString(sampleData.description),
    label: normalizeNullableString(sampleData.label),
    type: normalizeNullableString(sampleData.type),
    designer: normalizeNullableString(sampleData.designer),
    isPublic: normalizeBoolean(sampleData.isPublic, true),
    isMature: normalizeBoolean(sampleData.isMature, false),
    ArtImage: imageId ? { connect: { id: imageId } } : undefined,
  }
}

// Duplicate guard: skip instead of erroring when the same user already has a
// row with this title. Adjust the uniqueness criteria to fit your model.
async function findExistingSample(title: string, userId: number) {
  return await prisma.sample.findFirst({
    where: { title, userId },
    select: { id: true, title: true },
  })
}

export default defineEventHandler(async (event) => {
  try {
    const { isValid, user, kind } = await validateApiKey(event)

    if (!isValid || !user) {
      throw createError({
        statusCode: 401,
        message: 'Invalid or expired token.',
      })
    }

    const body = await readBody<SamplePostInput | SamplePostInput[]>(event)

    if (!body) {
      throw createError({
        statusCode: 400,
        message: 'Request body is required.',
      })
    }

    const isBatch = Array.isArray(body)
    const sampleInputs = isBatch ? body : [body]

    if (!sampleInputs.length) {
      throw createError({
        statusCode: 400,
        message: 'Request body must include at least one sample.',
      })
    }

    // Elevation: admins (Role ADMIN or the id-1 system user) and server keys
    // may create rows on behalf of another userId. Everyone else may only
    // create rows they own. Keep this block when copying.
    const isAdmin = user.Role === 'ADMIN' || user.id === 1
    const isServerKey = kind === 'server'

    const resolveOwnerId = (requested: unknown): number => {
      const requestedUserId = normalizeOptionalId(requested, 'userId')

      if (!requestedUserId || requestedUserId === user.id) return user.id

      if (!isAdmin && !isServerKey) {
        throw createError({
          statusCode: 403,
          message: 'User ID does not match the authenticated user.',
        })
      }

      return requestedUserId
    }

    const created: Sample[] = []
    const skipped: SkippedSample[] = []
    const failed: FailedSample[] = []

    // Per-entry try/catch: one bad entry must not abort the whole batch.
    for (const sampleData of sampleInputs) {
      const fallbackTitle =
        typeof sampleData.title === 'string' && sampleData.title.trim()
          ? sampleData.title.trim()
          : 'Untitled sample'

      try {
        const ownerId = resolveOwnerId(sampleData.userId)
        const createInput = buildSampleCreateInput(sampleData, ownerId)
        const title = createInput.title

        const existingSample = await findExistingSample(title, ownerId)

        if (existingSample) {
          skipped.push({
            title,
            existingId: existingSample.id,
            reason: 'Sample with this title already exists for this user.',
          })
          continue
        }

        const createdSample = await prisma.sample.create({
          data: createInput,
          include: {
            ArtImage: true,
            User: {
              select: { id: true, username: true },
            },
          },
        })

        created.push(createdSample)
      } catch (error) {
        failed.push({
          title: fallbackTitle,
          message: getErrorMessage(error),
        })
      }
    }

    // Everything failed → 400. Partial failure → 207. Clean run → 201.
    if (failed.length && !created.length && !skipped.length) {
      event.node.res.statusCode = 400

      return {
        success: false,
        message: `No samples were created. ${failed.length} failed.`,
        data: { created, skipped, failed },
        statusCode: 400,
      }
    }

    event.node.res.statusCode = failed.length ? 207 : 201

    return {
      success: failed.length === 0,
      message: isBatch
        ? `${created.length} created, ${skipped.length} skipped, ${failed.length} failed.`
        : created.length
          ? 'Sample created successfully.'
          : skipped.length
            ? 'Sample already exists. Skipped duplicate.'
            : 'Sample failed to create.',
      data: isBatch
        ? { created, skipped, failed }
        : created[0] || skipped[0] || failed[0],
      statusCode: event.node.res.statusCode,
    }
  } catch (error: unknown) {
    const { message, statusCode } = errorHandler(error)
    const safeStatusCode = statusCode || 500

    event.node.res.statusCode = safeStatusCode

    return {
      success: false,
      message: message || 'Failed to create sample.',
      data: null,
      statusCode: safeStatusCode,
    }
  }
})
