import { createError } from 'h3'
import prisma from './prisma'

/** Reuse the same guards for individual and bulk retries. Never create a
 * second request or revive a record claimed by a worker in the meantime. */
export async function retryFailedDownloadRequest(id: number): Promise<void> {
  const existing = await prisma.downloadRequest.findUnique({
    where: { id },
    select: {
      id: true,
      status: true,
      resourceId: true,
      civitaiModelVersionId: true,
    },
  })
  if (!existing) {
    throw createError({ statusCode: 404, message: 'Download not found.' })
  }
  if (existing.status !== 'FAILED') {
    throw createError({
      statusCode: 409,
      message: 'Only failed downloads can be retried.',
    })
  }
  if (existing.resourceId) {
    throw createError({
      statusCode: 409,
      message: 'This download already has an imported Resource.',
    })
  }
  if (existing.civitaiModelVersionId) {
    const [owned, inFlight] = await Promise.all([
      prisma.resource.findFirst({
        where: { civitaiModelVersionId: existing.civitaiModelVersionId },
        select: { id: true },
      }),
      prisma.downloadRequest.findFirst({
        where: {
          id: { not: id },
          civitaiModelVersionId: existing.civitaiModelVersionId,
          status: { in: ['PENDING', 'CLAIMED'] },
        },
        select: { id: true },
      }),
    ])
    if (owned || inFlight) {
      throw createError({
        statusCode: 409,
        message: owned
          ? 'This model is already in Resources.'
          : 'Another download of this model is already queued.',
      })
    }
  }
  const updated = await prisma.downloadRequest.updateMany({
    where: { id, status: 'FAILED', resourceId: null },
    data: {
      status: 'PENDING',
      attempts: 0,
      claimedAt: null,
      claimedBy: null,
      error: null,
    },
  })
  if (updated.count !== 1) {
    throw createError({
      statusCode: 409,
      message: 'Download status changed; refresh the queue.',
    })
  }
}
