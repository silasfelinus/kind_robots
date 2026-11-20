import { defineEventHandler } from 'h3'
import prisma from '~/server/utils/prisma'
import { errorHandler } from '~/server/utils/error'
import { requireMachineUser } from '~/server/utils/authGuard'
import { assertCurator, registerCandidates } from '~/server/utils/artSlots'
import { REDSHIRT_ROUND3_CANDIDATES } from '~/utils/gameOfCaptains/redshirtRound3Candidates'

/**
 * Explicit curator action, idempotent. Reconciles ArtJobs into selectable
 * candidates; it never likes, selects, publishes or delivers private images.
 */
export default defineEventHandler(async (event) => {
  try {
    const auth = await requireMachineUser(event)
    assertCurator(auth)
    const jobIds = REDSHIRT_ROUND3_CANDIDATES.map((item) => item[1])
    const jobs = await prisma.artJob.findMany({
      where: { id: { in: jobIds } },
      select: { id: true, status: true, artImageId: true },
    })
    const byJob = new Map(jobs.map((job) => [job.id, job]))
    const expectedImages = REDSHIRT_ROUND3_CANDIDATES.map((item) => item[2])
    const images = await prisma.artImage.findMany({
      where: { id: { in: expectedImages }, isActive: true },
      select: { id: true },
    })
    const activeIds = new Set(images.map((image) => image.id))
    const verified = REDSHIRT_ROUND3_CANDIDATES.filter(
      ([, jobId, imageId]) => {
        const job = byJob.get(jobId)
        return (
          job?.status === 'DONE' &&
          job.artImageId === imageId &&
          activeIds.has(imageId)
        )
      },
    )
    const results = await registerCandidates(
      verified.map(([key, jobId, imageId]) => ({
        slotKey: 'game-of-captains/' + key,
        projectSlug: 'game-of-captains',
        label: key,
        artImageId: imageId,
        artJobId: jobId,
        source: 'conductor-ledger',
        sourceRef: 'projects/game-of-captains/art/REDSHIRTS-ROUND-3.yaml',
        selectIfEmpty: false,
      })),
      auth.user.id,
    )
    return {
      success: true,
      data: {
        expected: REDSHIRT_ROUND3_CANDIDATES.length,
        registered: results.filter((result) =>
          ['created', 'exists'].includes(result.status),
        ).length,
        pending: REDSHIRT_ROUND3_CANDIDATES.length - verified.length,
      },
    }
  } catch (error: unknown) {
    const handled = errorHandler(error)
    event.node.res.statusCode = handled.statusCode || 500
    return { success: false, message: handled.message }
  }
})
