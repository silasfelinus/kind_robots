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
    const requestedNeedsReview =
      query.needsReview === 'true' || query.needsReview === '1'
    const requestedDiscovery =
      query.discovery === 'true' || query.discovery === '1'

    const auth = await getOptionalApiUser(event)
    const isAdmin = auth?.isAdmin ?? false

    // Admin-only machine-generated discovery pool. This is deliberately
    // separate from community PENDING submissions so the review queue does
    // not become a junk drawer containing two very different workflows.
    if (isAdmin && requestedDiscovery) {
      const candidates = await prisma.tzaddikCandidate.findMany({
        where: {
          curationState: 'PENDING',
          suggestedBy: 'daily-discovery',
        },
        include: { Tags: true },
        orderBy: [{ createdAt: 'desc' }, { displayName: 'asc' }],
      })

      event.node.res.statusCode = 200
      return {
        success: true,
        data: candidates,
        statusCode: 200,
      }
    }

    // Admin-only cross-candidate view (tzaddik-gallery/t-028): every
    // candidate whose *latest* recheck request is NEEDS_REVIEW (a Wikipedia
    // page-id change that recheck.post.ts deliberately did not auto-apply).
    // A non-admin's needsReview param is ignored rather than erroring, same
    // "quietly stay on the safe default" shape as curationState below.
    if (isAdmin && requestedNeedsReview) {
      const candidates = await prisma.tzaddikCandidate.findMany({
        where: { RecheckRequests: { some: { status: 'NEEDS_REVIEW' } } },
        include: {
          Tags: true,
          RecheckRequests: { orderBy: { createdAt: 'desc' }, take: 1 },
        },
        orderBy: { updatedAt: 'desc' },
      })

      event.node.res.statusCode = 200

      return {
        success: true,
        data: candidates.filter(
          (candidate) =>
            candidate.RecheckRequests[0]?.status === 'NEEDS_REVIEW',
        ),
        statusCode: 200,
      }
    }

    // Public gallery: only curated, admin-approved candidates are shown by
    // default. An admin may request PENDING/ARCHIVED instead (the review
    // queue) -- a non-admin's curationState param is ignored rather than
    // erroring, same "quietly stay on the safe default" shape as other
    // admin-gated query params in this codebase.
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