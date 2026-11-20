import { defineEventHandler } from 'h3'
import prisma from '~/server/utils/prisma'
import { errorHandler } from '~/server/utils/error'
import { requireMachineUser } from '~/server/utils/authGuard'
import { assertCurator, registerCandidates } from '~/server/utils/artSlots'
import { COUCH_ALIEN_REDO_CANDIDATES } from '~/utils/gameOfCaptains/alienRedoCandidates'

// Curator-initiated registration only. Never selects, likes or publishes images.
export default defineEventHandler(async (event) => {
  try {
    const auth = await requireMachineUser(event)
    assertCurator(auth)
    const jobs = await prisma.artJob.findMany({
      where: {
        id: { in: COUCH_ALIEN_REDO_CANDIDATES.map((item) => item.jobId) },
      },
      select: { id: true, status: true, artImageId: true },
    })
    const byJob = new Map(jobs.map((job) => [job.id, job]))
    const images = await prisma.artImage.findMany({
      where: {
        id: {
          in: COUCH_ALIEN_REDO_CANDIDATES.map((item) => item.artImageId),
        },
        isActive: true,
      },
      select: { id: true },
    })
    const active = new Set(images.map((image) => image.id))
    const verified = COUCH_ALIEN_REDO_CANDIDATES.filter((item) => {
      const job = byJob.get(item.jobId)
      return (
        job?.status === 'DONE' &&
        job.artImageId === item.artImageId &&
        active.has(item.artImageId)
      )
    })
    const results = await registerCandidates(
      verified.map((item) => ({
        slotKey: 'game-of-captains/' + item.key,
        projectSlug: 'game-of-captains',
        label: item.key,
        artImageId: item.artImageId,
        artJobId: item.jobId,
        source: 'conductor-ledger',
        sourceRef:
          'projects/game-of-captains/art/GAME-OF-CAPTAINS-CURATION-REDO-1.yaml',
        selectIfEmpty: false,
      })),
      auth.user.id,
    )
    return {
      success: true,
      data: {
        expected: COUCH_ALIEN_REDO_CANDIDATES.length,
        registered: results.filter((result) =>
          ['created', 'exists'].includes(result.status),
        ).length,
        pending: COUCH_ALIEN_REDO_CANDIDATES.length - verified.length,
      },
    }
  } catch (error: unknown) {
    const handled = errorHandler(error)
    event.node.res.statusCode = handled.statusCode || 500
    return { success: false, message: handled.message }
  }
})
