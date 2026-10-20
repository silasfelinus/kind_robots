import { createError, defineEventHandler, getQuery } from 'h3'
import prisma from '~/server/utils/prisma'
import { errorHandler } from '~/server/utils/error'
import { requireAdminApiUser } from '~/server/utils/authGuard'
import { galleryThumbnailUrl } from '~/server/utils/artGalleryArchiveMedia'

// Temporary checkpoint review (conductor weird-humboldt t-043): live status,
// image location and timings for a batch of ArtJobs. Render time runs from the
// relay claiming the job to its image being saved, so it includes model load
// (the first job on a lane pays it) and the upload. Image bytes are not sent:
// each image comes with a short-lived signed thumbnail URL (this endpoint is
// admin-only), and the page asks /api/art/image/:id for the full size.
const MAX_IDS = 300

function seconds(from?: Date | null, to?: Date | null): number | null {
  if (!from || !to) return null
  const value = (to.getTime() - from.getTime()) / 1000
  return value >= 0 ? Math.round(value * 10) / 10 : null
}

export default defineEventHandler(async (event) => {
  try {
    await requireAdminApiUser(event)
    const raw = String(getQuery(event).ids ?? '')
    const ids = [
      ...new Set(
        raw
          .split(',')
          .map((part) => Number(part.trim()))
          .filter((id) => Number.isInteger(id) && id > 0),
      ),
    ]
    if (!ids.length)
      throw createError({ statusCode: 400, message: 'Pass ArtJob ids.' })
    if (ids.length > MAX_IDS)
      throw createError({
        statusCode: 400,
        message: `At most ${MAX_IDS} jobs at once.`,
      })

    const jobs = await prisma.artJob.findMany({
      where: { id: { in: ids } },
      select: {
        id: true,
        status: true,
        engine: true,
        attempts: true,
        createdAt: true,
        claimedAt: true,
        updatedAt: true,
        artImageId: true,
        error: true,
      },
    })
    const imageIds = jobs
      .map((job) => job.artImageId)
      .filter((id): id is number => typeof id === 'number')
    const images = imageIds.length
      ? await prisma.artImage.findMany({
          where: { id: { in: imageIds } },
          select: {
            id: true,
            createdAt: true,
            checkpoint: true,
            seed: true,
            steps: true,
            fileName: true,
            fileType: true,
            imagePath: true,
            path: true,
          },
        })
      : []
    const imageById = new Map(images.map((image) => [image.id, image]))

    event.node.res.statusCode = 200
    return {
      success: true,
      message: `${jobs.length} jobs.`,
      data: jobs.map((job) => {
        const image = job.artImageId ? imageById.get(job.artImageId) : null
        const finishedAt =
          image?.createdAt ?? (job.status === 'DONE' ? job.updatedAt : null)
        return {
          id: job.id,
          status: job.status,
          engine: job.engine,
          attempts: job.attempts,
          error: job.error ? job.error.slice(0, 300) : null,
          queuedAt: job.createdAt.toISOString(),
          claimedAt: job.claimedAt?.toISOString() ?? null,
          finishedAt: finishedAt?.toISOString() ?? null,
          renderSeconds: seconds(job.claimedAt, finishedAt),
          waitSeconds: seconds(job.createdAt, job.claimedAt),
          image: image
            ? {
                id: image.id,
                thumbnailUrl: galleryThumbnailUrl(image.id),
                checkpoint: image.checkpoint,
                seed: image.seed,
                steps: image.steps,
                fileName: image.fileName,
                fileType: image.fileType,
                imagePath: image.imagePath,
                path: image.path,
              }
            : null,
        }
      }),
      statusCode: 200,
    }
  } catch (error: unknown) {
    const handled = errorHandler(error)
    const statusCode = handled.statusCode ?? 500
    event.node.res.statusCode = statusCode
    return { ...handled, statusCode }
  }
})
