// /server/api/tzaddik/index.get.ts
import { defineEventHandler, getQuery } from 'h3'
import { TzaddikLifeState } from '~/prisma/generated/prisma/client'
import prisma from '../../utils/prisma'
import { errorHandler } from '../../utils/error'

const LIFE_STATES = new Set(Object.values(TzaddikLifeState))

function parseLifeState(raw: unknown): TzaddikLifeState | undefined {
  if (typeof raw !== 'string') return undefined
  const upper = raw.toUpperCase()
  return LIFE_STATES.has(upper as TzaddikLifeState)
    ? (upper as TzaddikLifeState)
    : undefined
}

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event)
    const lifeState = parseLifeState(query.lifeState)

    // Public gallery: only curated, admin-approved candidates are shown.
    // Pending submissions and archived entries stay invisible until approved.
    const data = await prisma.tzaddikCandidate.findMany({
      where: {
        curationState: 'APPROVED',
        ...(lifeState ? { lifeState } : {}),
      },
      include: { Tags: true },
      orderBy: [{ displayName: 'asc' }],
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
