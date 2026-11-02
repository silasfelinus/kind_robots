import { defineEventHandler } from 'h3'
import prisma from '~/server/utils/prisma'
import { errorHandler } from '~/server/utils/error'
import {
  buildArtImageWhere,
  getArtImageAccessContext,
} from '~/server/utils/artImageAccess'
import { renderableArtPath } from '~/utils/artImageSrc'
import { galleryThumbnailUrl } from '~/server/utils/artGalleryArchiveMedia'
import { COUCH_ALIEN_ART_IDS } from '~/utils/gameOfCaptains/alienPaintings'
import { COUCH_ALIEN_ART_JOB_IDS } from '~/utils/gameOfCaptains/alienArtJobs'

export default defineEventHandler(async (event) => {
  try {
    const access = await getArtImageAccessContext(event)
    // ArtJob creation does not imply a finished image. A DONE result must
    // carry an ArtImage ID, and the image itself still needs viewer access.
    const jobEntries = Object.entries(COUCH_ALIEN_ART_JOB_IDS)
    const jobs = await prisma.artJob.findMany({
      where: {
        id: { in: jobEntries.map(([, jobId]) => jobId) },
        status: 'DONE',
      },
      select: { id: true, artImageId: true },
    })
    const completed = new Map(
      jobs
        .filter((job): job is typeof job & { artImageId: number } =>
          Number.isInteger(job.artImageId),
        )
        .map((job) => [job.id, job.artImageId]),
    )
    const entries = Object.entries({
      ...Object.fromEntries(
        jobEntries
          .filter(([, jobId]) => completed.has(jobId))
          .map(([key, jobId]) => [key, completed.get(jobId)!]),
      ),
      // A separately verified ArtImage may supersede an old ArtJob output.
      ...COUCH_ALIEN_ART_IDS,
    })
    if (!entries.length) return { success: true, data: {} }
    const images = await prisma.artImage.findMany({
      where: {
        AND: [
          { id: { in: entries.map(([, id]) => id) } },
          buildArtImageWhere(access),
        ],
      },
      select: { id: true, imagePath: true, path: true },
    })
    const byId = new Map(images.map((image) => [image.id, image]))
    const sources: Record<string, string> = {}
    for (const [key, id] of entries) {
      const image = byId.get(id)
      if (!image) continue
      sources[key] =
        renderableArtPath(image.imagePath) ||
        renderableArtPath(image.path) ||
        galleryThumbnailUrl(id)
    }
    return { success: true, data: sources }
  } catch (error: unknown) {
    const handled = errorHandler(error)
    event.node.res.statusCode = handled.statusCode || 500
    return { success: false, data: {}, message: handled.message }
  }
})
