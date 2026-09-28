// /server/api/tzaddik/recheck.post.ts
//
// User-visible correction workflow: creates or reuses one in-flight recheck,
// immediately refreshes Wikipedia/Wikidata/Commons source fields, and records
// the exact before/after revision outcome. Explicit editor overrides live in
// separate columns and are never overwritten by this route.
import { createError, defineEventHandler, readBody } from 'h3'
import prisma from '../../utils/prisma'
import { errorHandler } from '../../utils/error'
import { requireApiUser } from '../../utils/authGuard'
import {
  fetchTzaddikSource,
  TzaddikSourceFetchError,
} from '../../utils/tzaddikSourceRefresh'

type RecheckBody = { candidateId?: unknown }

function toPositiveId(value: unknown): number | undefined {
  const parsed = Number(value)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : undefined
}

function dateValue(value: Date | null): string | null {
  return value ? value.toISOString() : null
}

export default defineEventHandler(async (event) => {
  try {
    const auth = await requireApiUser(event)
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
    })

    if (!candidate) {
      throw createError({
        statusCode: 404,
        message: 'Tzaddik candidate not found.',
      })
    }

    if (
      candidate.curationState !== 'APPROVED' &&
      candidate.submittedByUserId !== auth.user.id &&
      !auth.isAdmin
    ) {
      throw createError({
        statusCode: 404,
        message: 'Tzaddik candidate not found.',
      })
    }

    const existing = await prisma.tzaddikRecheckRequest.findFirst({
      where: { candidateId, status: { in: ['PENDING', 'CHECKING'] } },
      orderBy: { createdAt: 'desc' },
    })

    if (existing?.status === 'CHECKING') {
      event.node.res.statusCode = 200
      return {
        success: true,
        message: 'A recheck for this candidate is already running.',
        data: existing,
        statusCode: 200,
      }
    }

    const request =
      existing ??
      (await prisma.tzaddikRecheckRequest.create({
        data: {
          candidateId,
          requestedByUserId: auth.user.id,
          status: 'PENDING',
        },
      }))

    await prisma.tzaddikRecheckRequest.update({
      where: { id: request.id },
      data: {
        status: 'CHECKING',
        startedAt: new Date(),
        completedAt: null,
        sourceRevisionBefore: candidate.wikipediaRevisionId,
        sourceRevisionAfter: null,
        resultJson: null,
        error: null,
      },
    })

    try {
      const source = await fetchTzaddikSource(candidate.wikipediaUrl)
      const changedFields: string[] = []

      if (candidate.wikipediaPageId !== source.wikipediaPageId)
        changedFields.push('wikipediaPageId')
      if (candidate.wikipediaRevisionId !== source.wikipediaRevisionId)
        changedFields.push('wikipediaRevisionId')
      if (candidate.biography !== source.biography)
        changedFields.push('biography')
      if (candidate.lifeState !== source.lifeState)
        changedFields.push('lifeState')
      if (dateValue(candidate.deathDate) !== dateValue(source.deathDate))
        changedFields.push('deathDate')
      if (candidate.imageSourceUrl !== source.imageSourceUrl)
        changedFields.push('imageSourceUrl')
      if (candidate.imageFileUrl !== source.imageFileUrl)
        changedFields.push('imageFileUrl')
      if (candidate.imageLicense !== source.imageLicense)
        changedFields.push('imageLicense')
      if (candidate.imageAttribution !== source.imageAttribution)
        changedFields.push('imageAttribution')
      if (candidate.imageRevisionId !== source.imageRevisionId)
        changedFields.push('imageRevisionId')

      const conflictsWithOverride =
        (Boolean(candidate.biographyOverride) &&
          candidate.biography !== source.biography) ||
        (Boolean(candidate.imageUrlOverride) &&
          candidate.imageFileUrl !== source.imageFileUrl)

      await prisma.tzaddikCandidate.update({
        where: { id: candidateId },
        data: {
          lifeState: source.lifeState,
          deathDate: source.deathDate,
          biography: source.biography,
          wikipediaPageId: source.wikipediaPageId,
          wikipediaRevisionId: source.wikipediaRevisionId,
          sourceSnapshotJson: source.sourceSnapshotJson,
          sourceCheckedAt: source.sourceCheckedAt,
          imageSourceUrl: source.imageSourceUrl,
          imageFileUrl: source.imageFileUrl,
          imageLicense: source.imageLicense,
          imageAttribution: source.imageAttribution,
          imageRevisionId: source.imageRevisionId,
        },
      })

      const status = conflictsWithOverride
        ? 'NEEDS_REVIEW'
        : changedFields.length
          ? 'UPDATED'
          : 'NO_CHANGE'

      const completed = await prisma.tzaddikRecheckRequest.update({
        where: { id: request.id },
        data: {
          status,
          completedAt: new Date(),
          sourceRevisionAfter: source.wikipediaRevisionId,
          resultJson: JSON.stringify({
            changedFields,
            lifeStateBefore: candidate.lifeState,
            lifeStateAfter: source.lifeState,
            deathDateBefore: dateValue(candidate.deathDate),
            deathDateAfter: dateValue(source.deathDate),
            sourceCheckedAt: source.sourceCheckedAt.toISOString(),
            conflictsWithOverride,
          }),
          error: null,
        },
      })

      event.node.res.statusCode = existing ? 200 : 201
      return {
        success: true,
        message:
          status === 'NO_CHANGE'
            ? 'Source recheck completed with no changes.'
            : status === 'NEEDS_REVIEW'
              ? 'Source recheck completed; an editor override needs review.'
              : 'Source recheck updated the sourced profile.',
        data: completed,
        statusCode: event.node.res.statusCode,
      }
    } catch (error) {
      const message =
        error instanceof TzaddikSourceFetchError
          ? error.message
          : error instanceof Error
            ? error.message
            : 'Source refresh failed.'

      await prisma.tzaddikRecheckRequest.update({
        where: { id: request.id },
        data: {
          status: 'FAILED',
          completedAt: new Date(),
          error: message,
        },
      })

      throw createError({
        statusCode: 502,
        message,
      })
    }
  } catch (error) {
    const { message, statusCode } = errorHandler(error)
    event.node.res.statusCode = statusCode || 500

    return {
      success: false,
      message: message || 'Failed to recheck this candidate.',
      data: null,
      statusCode: statusCode || 500,
    }
  }
})
