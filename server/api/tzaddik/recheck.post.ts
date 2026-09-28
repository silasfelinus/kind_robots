// /server/api/tzaddik/recheck.post.ts
//
// "Request recheck" control (tzaddik-gallery/t-005, wired live in t-019): lets
// a signed-in user ask for a candidate's sourced facts to be re-verified
// against Wikipedia. Writes a TzaddikRecheckRequest row and, if nothing is
// already in flight and the cooldown has passed, runs the actual Wikipedia/
// Wikidata/Commons refresh synchronously via fetchTzaddikSource
// (server/utils/tzaddikSourceRefresh.ts) before responding.
import { createError, defineEventHandler, readBody } from 'h3'
import prisma from '../../utils/prisma'
import { errorHandler } from '../../utils/error'
import { validateApiKey } from '../../utils/validateKey'
import {
  fetchTzaddikSource,
  type TzaddikSourceResult,
} from '../../utils/tzaddikSourceRefresh'
import type {
  TzaddikRecheckRequest,
  TzaddikRecheckStatus,
} from '~/prisma/generated/prisma/client'

type RecheckBody = { candidateId?: unknown }

// Repeated requests right after a completed check just return the same
// result rather than hammering Wikipedia/Wikidata/Commons again.
const RECHECK_COOLDOWN_MS = 60 * 60 * 1000

type CandidateSnapshot = {
  id: number
  wikipediaUrl: string
  wikipediaPageId: string | null
  wikipediaRevisionId: string | null
  lifeState: string
  deathDate: Date | null
  biography: string | null
  imageSourceUrl: string | null
  imageFileUrl: string | null
  imageLicense: string | null
  imageAttribution: string | null
  imageRevisionId: string | null
}

type DiffEntry = { field: string; before: string | null; after: string | null }

function toPositiveId(value: unknown): number | undefined {
  const parsed = Number(value)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : undefined
}

function diffField(
  field: string,
  before: string | null,
  after: string | null,
): DiffEntry | null {
  return before === after ? null : { field, before, after }
}

function isoDay(date: Date | null): string | null {
  return date ? date.toISOString().slice(0, 10) : null
}

function buildDiff(
  candidate: CandidateSnapshot,
  fetched: TzaddikSourceResult,
): DiffEntry[] {
  return [
    diffField('lifeState', candidate.lifeState, fetched.lifeState),
    diffField(
      'deathDate',
      isoDay(candidate.deathDate),
      isoDay(fetched.deathDate),
    ),
    diffField('biography', candidate.biography, fetched.biography),
    diffField(
      'imageSourceUrl',
      candidate.imageSourceUrl,
      fetched.imageSourceUrl,
    ),
    diffField('imageLicense', candidate.imageLicense, fetched.imageLicense),
    diffField(
      'imageAttribution',
      candidate.imageAttribution,
      fetched.imageAttribution,
    ),
    diffField(
      'imageRevisionId',
      candidate.imageRevisionId,
      fetched.imageRevisionId,
    ),
  ].filter((entry): entry is DiffEntry => entry !== null)
}

// Runs the actual refresh for a just-created PENDING request and returns the
// request in its terminal state. Never touches the *Override columns -- those
// are a separate, editor-only layer that sourced-field refreshes must not
// silently clobber.
async function processRecheck(
  requestId: number,
  candidate: CandidateSnapshot,
): Promise<TzaddikRecheckRequest> {
  await prisma.tzaddikRecheckRequest.update({
    where: { id: requestId },
    data: { status: 'CHECKING', startedAt: new Date() },
  })

  try {
    const fetched = await fetchTzaddikSource(candidate.wikipediaUrl)

    // A changed Wikipedia page id (not just a new revision of the same page)
    // means the article this candidate points at may have redirected or been
    // merged elsewhere -- treat that as an identity question for an editor,
    // never as a bundle of safe field updates to auto-apply.
    const identityChanged =
      Boolean(candidate.wikipediaPageId) &&
      Boolean(fetched.wikipediaPageId) &&
      candidate.wikipediaPageId !== fetched.wikipediaPageId

    const revisionUnchanged =
      Boolean(candidate.wikipediaRevisionId) &&
      candidate.wikipediaRevisionId === fetched.wikipediaRevisionId

    if (revisionUnchanged && !identityChanged) {
      return await prisma.tzaddikRecheckRequest.update({
        where: { id: requestId },
        data: {
          status: 'NO_CHANGE',
          completedAt: new Date(),
          sourceRevisionBefore: candidate.wikipediaRevisionId,
          sourceRevisionAfter: fetched.wikipediaRevisionId,
          resultJson: JSON.stringify({
            reason: 'Wikipedia revision unchanged.',
          }),
        },
      })
    }

    const diff = buildDiff(candidate, fetched)

    if (identityChanged) {
      return await prisma.tzaddikRecheckRequest.update({
        where: { id: requestId },
        data: {
          status: 'NEEDS_REVIEW',
          completedAt: new Date(),
          sourceRevisionBefore: candidate.wikipediaRevisionId,
          sourceRevisionAfter: fetched.wikipediaRevisionId,
          resultJson: JSON.stringify({
            reason:
              'Wikipedia page id changed -- possible redirect or article identity change. Not auto-applied; an editor should verify the source before overriding.',
            previousPageId: candidate.wikipediaPageId,
            newPageId: fetched.wikipediaPageId,
            diff,
          }),
        },
      })
    }

    // Safe, source-derived change: apply it. Living/deceased status moves
    // automatically because it's verified from Wikidata's own date-of-death
    // claim, not inferred -- the task's own contract calls this out as the
    // one field that must move rather than sit in review.
    await prisma.tzaddikCandidate.update({
      where: { id: candidate.id },
      data: {
        lifeState: fetched.lifeState,
        deathDate: fetched.deathDate,
        biography: fetched.biography ?? candidate.biography,
        wikipediaPageId: fetched.wikipediaPageId,
        wikipediaRevisionId: fetched.wikipediaRevisionId,
        imageSourceUrl: fetched.imageSourceUrl,
        imageFileUrl: fetched.imageFileUrl,
        imageLicense: fetched.imageLicense,
        imageAttribution: fetched.imageAttribution,
        imageRevisionId: fetched.imageRevisionId,
        sourceSnapshotJson: fetched.sourceSnapshotJson,
        sourceCheckedAt: fetched.sourceCheckedAt,
      },
    })

    return await prisma.tzaddikRecheckRequest.update({
      where: { id: requestId },
      data: {
        status: diff.length > 0 ? 'UPDATED' : 'NO_CHANGE',
        completedAt: new Date(),
        sourceRevisionBefore: candidate.wikipediaRevisionId,
        sourceRevisionAfter: fetched.wikipediaRevisionId,
        resultJson: JSON.stringify({ diff }),
      },
    })
  } catch (error) {
    return await prisma.tzaddikRecheckRequest.update({
      where: { id: requestId },
      data: {
        status: 'FAILED',
        completedAt: new Date(),
        error: error instanceof Error ? error.message : String(error),
      },
    })
  }
}

const RECHECK_MESSAGES: Record<TzaddikRecheckStatus, string> = {
  PENDING: 'Recheck requested.',
  CHECKING: 'Recheck requested.',
  NO_CHANGE: 'Rechecked -- no change from Wikipedia.',
  UPDATED: 'Rechecked -- sourced fields refreshed from Wikipedia.',
  NEEDS_REVIEW:
    'Rechecked -- possible article identity change needs editor review.',
  FAILED: 'Recheck failed -- see the request for details.',
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

    const body = await readBody<RecheckBody>(event)
    const candidateId = toPositiveId(body?.candidateId)

    if (!candidateId) {
      throw createError({
        statusCode: 400,
        message: '"candidateId" is required.',
      })
    }

    const candidate = await prisma.tzaddikCandidate.findUnique({
      where: { id: candidateId },
      select: {
        id: true,
        curationState: true,
        submittedByUserId: true,
        wikipediaUrl: true,
        wikipediaPageId: true,
        wikipediaRevisionId: true,
        lifeState: true,
        deathDate: true,
        biography: true,
        imageSourceUrl: true,
        imageFileUrl: true,
        imageLicense: true,
        imageAttribution: true,
        imageRevisionId: true,
      },
    })

    if (!candidate) {
      throw createError({
        statusCode: 404,
        message: 'Tzaddik candidate not found.',
      })
    }

    // Same visibility as the detail route: a candidate not yet public is
    // rechecked only by whoever submitted it (or an admin).
    if (
      candidate.curationState !== 'APPROVED' &&
      candidate.submittedByUserId !== user.id
    ) {
      throw createError({
        statusCode: 404,
        message: 'Tzaddik candidate not found.',
      })
    }

    // Dedupe: one in-flight recheck per candidate at a time.
    const inFlight = await prisma.tzaddikRecheckRequest.findFirst({
      where: { candidateId, status: { in: ['PENDING', 'CHECKING'] } },
      orderBy: { createdAt: 'desc' },
    })

    if (inFlight) {
      event.node.res.statusCode = 200
      return {
        success: true,
        message: 'A recheck for this candidate is already pending.',
        data: inFlight,
        statusCode: 200,
      }
    }

    // Cooldown: a candidate rechecked recently returns that same result
    // rather than fetching Wikipedia again.
    const lastCompleted = await prisma.tzaddikRecheckRequest.findFirst({
      where: { candidateId, status: { notIn: ['PENDING', 'CHECKING'] } },
      orderBy: { completedAt: 'desc' },
    })

    if (
      lastCompleted?.completedAt &&
      Date.now() - lastCompleted.completedAt.getTime() < RECHECK_COOLDOWN_MS
    ) {
      event.node.res.statusCode = 200
      return {
        success: true,
        message: 'This candidate was rechecked recently. Try again later.',
        data: lastCompleted,
        statusCode: 200,
      }
    }

    const request = await prisma.tzaddikRecheckRequest.create({
      data: {
        candidateId,
        requestedByUserId: user.id,
        status: 'PENDING',
      },
    })

    const result = await processRecheck(request.id, candidate)

    event.node.res.statusCode = 201
    return {
      success: true,
      message: RECHECK_MESSAGES[result.status],
      data: result,
      statusCode: 201,
    }
  } catch (error) {
    const { message, statusCode } = errorHandler(error)
    event.node.res.statusCode = statusCode || 500

    return {
      success: false,
      message: message || 'Failed to request a recheck.',
      data: null,
      statusCode: statusCode || 500,
    }
  }
})
