// /server/api/art/queue/[id].delete.ts
//
// Admin action: remove an ArtJob row outright.
//
// `cancel` cannot do this -- it refuses a DONE job by design, and a CANCELLED
// row still sits in the queue listing. The case this exists for is a job whose
// render no longer exists and never will: before 2026-09-17 an OVERWRITE
// completion snapshotted the previous render into an archive ArtImage that was
// empty by construction, then repointed the older job at it, so every retry
// left a duplicate card showing nothing. Silas, 2026-09-17: "I'd rather that
// then have to sift through duplicated jobs when looking through the queue."
//
// Deliberately narrow:
//   - a RUNNING job is refused; the relay holds a claim on it.
//   - the ArtImage is deleted ONLY when `deleteEmptyImage` is passed AND the
//     row really is empty AND nothing else references it. An image that still
//     serves bytes is never removed by a job deletion.
import { createError, defineEventHandler, getRouterParam, getQuery } from 'h3'
import prisma from '../../../utils/prisma'
import { errorHandler } from '../../../utils/error'
import { requireMachineUser } from '../../../utils/authGuard'

export default defineEventHandler(async (event) => {
  try {
    const auth = await requireMachineUser(event)

    if (!auth.isAdmin && !auth.isServerKey) {
      throw createError({
        statusCode: 403,
        message: 'Admin access required to delete jobs.',
      })
    }

    const id = Number(getRouterParam(event, 'id'))

    if (!Number.isInteger(id) || id <= 0) {
      throw createError({ statusCode: 400, message: 'Invalid job id.' })
    }

    const job = await prisma.artJob.findUnique({ where: { id } })

    if (!job) {
      throw createError({ statusCode: 404, message: `Job ${id} not found.` })
    }

    if (job.status === 'RUNNING') {
      throw createError({
        statusCode: 409,
        message: `Job ${id} is RUNNING and claimed by a relay. Cancel or requeue it first.`,
      })
    }

    const query = getQuery(event)
    const wantsImageDeleted =
      String(query.deleteEmptyImage ?? '').toLowerCase() === 'true'

    let deletedArtImageId: number | null = null

    if (wantsImageDeleted && job.artImageId) {
      const image = await prisma.artImage.findUnique({
        where: { id: job.artImageId },
        select: { id: true, imageData: true, imagePath: true, path: true },
      })

      /*
       * Only an image that holds nothing. `imagePath` is checked as well as
       * `imageData` because renders live on disk and leave the base64 column
       * NULL -- reading only `imageData` would call every live render empty.
       */
      const isEmpty = Boolean(image) && !image?.imageData && !image?.imagePath

      if (isEmpty) {
        // ArtJob.artImageId is a loose Int with no relation, so a second job
        // pointing here would be left dangling rather than cascaded.
        const otherReferences = await prisma.artJob.count({
          where: { artImageId: job.artImageId, id: { not: id } },
        })

        if (otherReferences === 0) {
          await prisma.artImage.delete({ where: { id: job.artImageId } })
          deletedArtImageId = job.artImageId
        }
      }
    }

    await prisma.artJob.delete({ where: { id } })

    return {
      success: true,
      message: deletedArtImageId
        ? `Job ${id} deleted, along with empty ArtImage ${deletedArtImageId}.`
        : `Job ${id} deleted.`,
      data: { deletedJobId: id, deletedArtImageId },
      statusCode: 200,
    }
  } catch (error: unknown) {
    const handled = errorHandler(error)
    event.node.res.statusCode = handled.statusCode || 500
    return {
      success: false,
      message: handled.message || `Failed to delete job.`,
      data: null,
      statusCode: handled.statusCode || 500,
    }
  }
})
