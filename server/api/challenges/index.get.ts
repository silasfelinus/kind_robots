// /server/api/challenges/index.get.ts
import { createError, defineEventHandler, getQuery } from 'h3'
import prisma from '~/server/utils/prisma'
import { errorHandler } from '~/server/utils/error'
import { getOptionalApiUser } from '@/server/utils/authGuard'
import { visibilityWhere } from '@/server/utils/contentAccess'

const challengeTypes = new Set([
  'ART',
  'TEXT',
  'CHARACTER',
  'SCENARIO',
  'REASONING',
])
const challengeStatuses = new Set(['OPEN', 'JUDGING', 'CLOSED'])

function normalizeFilter(
  value: unknown,
  allowed: Set<string>,
  field: string,
): string | undefined {
  if (value === undefined || value === null || value === '') return undefined

  const normalized = String(value).trim().toUpperCase()

  if (!allowed.has(normalized)) {
    throw createError({
      statusCode: 400,
      message: `Invalid ${field} filter.`,
    })
  }

  return normalized
}

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event)
    const challengeType = normalizeFilter(
      query.type,
      challengeTypes,
      'challenge type',
    )
    const status = normalizeFilter(
      query.status,
      challengeStatuses,
      'challenge status',
    )

    // Challenge carries isMature but no isPublic, so only the maturity half
    // applies -- and it is excluded outright for a restricted account.
    const auth = await getOptionalApiUser(event)
    const challenges = await prisma.challenge.findMany({
      where: {
        AND: [
          {
            challengeType: challengeType as never,
            status: (status ?? 'OPEN') as never,
          },
          await visibilityWhere(auth?.user, { isMature: true }, auth?.isAdmin),
        ],
      },
      include: {
        _count: {
          select: { Submissions: true },
        },
      },
      orderBy: [{ createdAt: 'desc' }, { title: 'asc' }],
    })

    event.node.res.statusCode = 200

    return {
      success: true,
      message: 'Challenges fetched successfully.',
      data: challenges.map(({ _count, ...challenge }) => ({
        ...challenge,
        submissionCount: _count.Submissions,
      })),
      statusCode: 200,
    }
  } catch (error: unknown) {
    const handled = errorHandler(error)
    const statusCode = handled.statusCode ?? 500
    event.node.res.statusCode = statusCode

    return { ...handled, statusCode }
  }
})
