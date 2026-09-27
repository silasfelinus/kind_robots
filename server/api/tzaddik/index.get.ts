// /server/api/tzaddik/index.get.ts
import { defineEventHandler, getQuery } from 'h3'
import {
  TzaddikCurationState,
  TzaddikLifeState,
} from '~/prisma/generated/prisma/client'
import prisma from '../../utils/prisma'
import { errorHandler } from '../../utils/error'
import { getOptionalApiUser } from '../../utils/authGuard'

const LIFE_STATES = new Set(Object.values(TzaddikLifeState))
const CURATION_STATES = new Set(Object.values(TzaddikCurationState))

function parseLifeState(raw: unknown): TzaddikLifeState | undefined {
  if (typeof raw !== 'string') return undefined
  const upper = raw.toUpperCase()
  return LIFE_STATES.has(upper as TzaddikLifeState)
    ? (upper as TzaddikLifeState)
    : undefined
}

function parseCurationState(raw: unknown): TzaddikCurationState | undefined {
  if (typeof raw !== 'string') return undefined
  const upper = raw.toUpperCase()
  return CURATION_STATES.has(upper as TzaddikCurationState)
    ? (upper as TzaddikCurationState)
    : undefined
}

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event)
    const lifeState = parseLifeState(query.lifeState)
    const requestedCurationState = parseCurationState(query.curationState)

    // Public gallery: only curated, admin-approved candidates are shown by
    // default. An admin may request PENDING/ARCHIVED instead (the review
    // queue) -- a non-admin's curationState param is ignored rather than
    // erroring, same "quietly stay on the safe default" shape as other
    // admin-gated query params in this codebase.
    const auth = await getOptionalApiUser(event)
    const isAdmin = auth?.isAdmin ?? false
    const curationState =
      isAdmin && requestedCurationState ? requestedCurationState : 'APPROVED'

    const data = await prisma.tzaddikCandidate.findMany({
      where: {
        curationState,
        ...(lifeState ? { lifeState } : {}),
      },
      include: { Tags: true },
      orderBy:
        curationState === 'APPROVED'
          ? [{ displayName: 'asc' }]
          : [{ createdAt: 'desc' }],
    })

    event.node.res.statusCode = 200

    return {
      success: true,
      data,
      statusCode: 200,
    }
  } catch (error: unknown) {
    const { message, statusCode } = errorHandler(error)
    event.node.res.statusCode = statusCode || 500

    return {
      success: false,
      message: message || 'Failed to fetch Tzaddik candidates.',
      statusCode: event.node.res.statusCode,
    }
  }
})
