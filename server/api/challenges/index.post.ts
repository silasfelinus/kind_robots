// /server/api/challenges/index.post.ts
import { createError, defineEventHandler, readBody } from 'h3'
import prisma from '~/server/utils/prisma'
import { errorHandler } from '~/server/utils/error'
import { userIsAdmin } from '~/server/utils/authUser'
import { validateApiKey } from '~/server/utils/validateKey'

const challengeTypes = new Set([
  'ART',
  'TEXT',
  'CHARACTER',
  'SCENARIO',
  'REASONING',
])
const challengeStatuses = new Set(['OPEN', 'JUDGING', 'CLOSED'])

type ChallengeCreateBody = {
  slug?: unknown
  title?: unknown
  challengeType?: unknown
  difficulty?: unknown
  promptText?: unknown
  judgeNotes?: unknown
  status?: unknown
  isMature?: unknown
  userId?: unknown
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

function enumValue(
  value: unknown,
  allowed: Set<string>,
  field: string,
  fallback?: string,
): string {
  if (value === undefined || value === null || value === '') {
    if (fallback) return fallback
    throw createError({ statusCode: 400, message: `${field} is required.` })
  }

  const normalized = String(value).trim().toUpperCase()

  if (!allowed.has(normalized)) {
    throw createError({ statusCode: 400, message: `Invalid ${field}.` })
  }

  return normalized
}

function optionalPositiveInteger(value: unknown, fallback: number): number {
  if (value === undefined || value === null || value === '') return fallback

  const number = Number(value)

  if (!Number.isInteger(number) || number < 1 || number > 5) {
    throw createError({
      statusCode: 400,
      message: 'difficulty must be an integer from 1 through 5.',
    })
  }

  return number
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

    if (!body) {
      throw createError({ statusCode: 400, message: 'Request body is required.' })
    }

    const requestedUserId = Number(body.userId)
    const userId =
      Number.isInteger(requestedUserId) && requestedUserId > 0
        ? requestedUserId
        : auth.user.id

    const challenge = await prisma.challenge.create({
      data: {
        slug: requiredString(body.slug, 'slug', 255)
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-+|-+$/g, ''),
        title: requiredString(body.title, 'title', 764),
        challengeType: enumValue(
          body.challengeType,
          challengeTypes,
          'challengeType',
        ) as never,
        difficulty: optionalPositiveInteger(body.difficulty, 1),
        promptText: requiredString(body.promptText, 'promptText', 50000),
        judgeNotes:
          typeof body.judgeNotes === 'string' && body.judgeNotes.trim()
            ? body.judgeNotes.trim()
            : null,
        status: enumValue(
          body.status,
          challengeStatuses,
          'status',
          'OPEN',
        ) as never,
        isMature: body.isMature === true,
        User: { connect: { id: userId } },
      },
    })

    event.node.res.statusCode = 201

    return {
      success: true,
      message: 'Challenge created successfully.',
      data: challenge,
      statusCode: 201,
    }
  } catch (error: unknown) {
    const handled = errorHandler(error)
    const statusCode = handled.statusCode ?? 500
    event.node.res.statusCode = statusCode

    return { ...handled, statusCode }
  }
})
