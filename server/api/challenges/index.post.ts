// /server/api/challenges/index.post.ts
import { createError, defineEventHandler, readBody } from 'h3'
import {
  ChallengeStatus,
  ChallengeType,
  Prisma,
} from '~/prisma/generated/prisma/client'
import prisma from '~/server/utils/prisma'
import { errorHandler } from '~/server/utils/error'
import { userIsAdmin } from '~/server/utils/authUser'
import { challengeMutationSelect } from '~/server/utils/challengeResource'
import { validateApiKey } from '~/server/utils/validateKey'

const challengeTypes = Object.values(ChallengeType)
const challengeStatuses = Object.values(ChallengeStatus)
const challengeCreateFields = new Set([
  'slug',
  'title',
  'challengeType',
  'difficulty',
  'promptText',
  'judgeNotes',
  'status',
  'isMature',
])

type ChallengeCreateBody = Record<string, unknown> & {
  slug?: unknown
  title?: unknown
  challengeType?: unknown
  difficulty?: unknown
  promptText?: unknown
  judgeNotes?: unknown
  status?: unknown
  isMature?: unknown
}

function assertSupportedFields(body: ChallengeCreateBody) {
  const unsupported = Object.keys(body).filter(
    (field) => !challengeCreateFields.has(field),
  )

  if (unsupported.length > 0) {
    throw createError({
      statusCode: 400,
      message: `Unsupported Challenge fields: ${unsupported.join(', ')}. Ownership, IDs, and timestamps are server-owned.`,
    })
  }
}

function requiredString(value: unknown, field: string, maxLength: number): string {
  if (typeof value !== 'string' || !value.trim()) {
    throw createError({
      statusCode: 400,
      message: `${field} is required.`,
    })
  }

  const normalized = value.trim()

  if (normalized.length > maxLength) {
    throw createError({
      statusCode: 400,
      message: `${field} must be ${maxLength} characters or fewer.`,
    })
  }

  return normalized
}

function optionalString(
  value: unknown,
  field: string,
  maxLength: number,
): string | null {
  if (value === undefined || value === null || value === '') return null

  if (typeof value !== 'string') {
    throw createError({ statusCode: 400, message: `${field} must be a string.` })
  }

  const normalized = value.trim()
  if (!normalized) return null

  if (normalized.length > maxLength) {
    throw createError({
      statusCode: 400,
      message: `${field} must be ${maxLength} characters or fewer.`,
    })
  }

  return normalized
}

function enumValue<T extends string>(
  value: unknown,
  allowed: readonly T[],
  field: string,
  fallback?: T,
): T {
  if (value === undefined || value === null || value === '') {
    if (fallback !== undefined) return fallback
    throw createError({ statusCode: 400, message: `${field} is required.` })
  }

  const normalized = String(value).trim().toUpperCase() as T

  if (!allowed.includes(normalized)) {
    throw createError({
      statusCode: 400,
      message: `${field} must be one of: ${allowed.join(', ')}.`,
    })
  }

  return normalized
}

function difficultyValue(value: unknown): number {
  if (value === undefined || value === null || value === '') return 1

  const number = Number(value)

  if (!Number.isInteger(number) || number < 1 || number > 5) {
    throw createError({
      statusCode: 400,
      message: 'difficulty must be an integer from 1 through 5.',
    })
  }

  return number
}

function booleanValue(value: unknown, field: string): boolean {
  if (value === undefined || value === null) return false

  if (typeof value !== 'boolean') {
    throw createError({ statusCode: 400, message: `${field} must be a boolean.` })
  }

  return value
}

function slugValue(value: unknown): string {
  const slug = requiredString(value, 'slug', 255)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

  if (!slug) {
    throw createError({
      statusCode: 400,
      message: 'slug must contain at least one letter or number.',
    })
  }

  return slug
}

export default defineEventHandler(async (event) => {
  try {
    const auth = await validateApiKey(event)

    if (!auth.isValid || !auth.user) {
      throw createError({ statusCode: 401, message: 'Authentication required.' })
    }

    if (!userIsAdmin(auth.user)) {
      throw createError({ statusCode: 403, message: 'Admin access required.' })
    }

    const body = await readBody<ChallengeCreateBody>(event)

    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      throw createError({ statusCode: 400, message: 'Request body is required.' })
    }

    assertSupportedFields(body)

    const challenge = await prisma.challenge.create({
      data: {
        slug: slugValue(body.slug),
        title: requiredString(body.title, 'title', 764),
        challengeType: enumValue(
          body.challengeType,
          challengeTypes,
          'challengeType',
        ),
        difficulty: difficultyValue(body.difficulty),
        promptText: requiredString(body.promptText, 'promptText', 50000),
        judgeNotes: optionalString(body.judgeNotes, 'judgeNotes', 50000),
        status: enumValue(
          body.status,
          challengeStatuses,
          'status',
          ChallengeStatus.OPEN,
        ),
        isMature: booleanValue(body.isMature, 'isMature'),
        userId: auth.user.id,
      },
      select: challengeMutationSelect,
    })

    event.node.res.statusCode = 201

    return {
      success: true,
      message: 'Challenge created successfully.',
      data: challenge,
      statusCode: 201,
    }
  } catch (error: unknown) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      event.node.res.statusCode = 409
      return {
        success: false,
        message: 'A Challenge with this slug already exists.',
        statusCode: 409,
      }
    }

    const handled = errorHandler(error)
    const statusCode = handled.statusCode ?? 500
    event.node.res.statusCode = statusCode

    return { ...handled, statusCode }
  }
})
