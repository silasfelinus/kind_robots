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
import { COUCH_ALIEN_REDO_CANDIDATES } from '~/utils/gameOfCaptains/alienRedoCandidates'

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
    // Manual ArtSlot promotion is valid only for a liked, selected redo
    // candidate from the verified ledger. Rejected originals remain excluded.
    const slots = await prisma.artSlot.findMany({
      where: {
        projectSlug: 'game-of-captains',
        slotKey: {
          in: COUCH_ALIEN_REDO_CANDIDATES.map(
            (item) => 'game-of-captains/' + item.key,
          ),
        },
        selectedArtImageId: { not: null },
      },
      select: {
        slotKey: true,
        selectedArtImageId: true,
        Candidates: {
          select: { artImageId: true, verdict: true },
        },
      },
    })
    const approvedRedo = Object.fromEntries(
      slots.flatMap((slot) => {
        const item = COUCH_ALIEN_REDO_CANDIDATES.find(
          (candidate) =>
            'game-of-captains/' + candidate.key === slot.slotKey &&
            candidate.artImageId === slot.selectedArtImageId,
        )
        return item &&
          slot.Candidates.some(
            (candidate) =>
              candidate.artImageId === item.artImageId &&
              candidate.verdict === 'liked',
          )
          ? [[item.key, item.artImageId]]
          : []
      }),
    )
    const entries = Object.entries({
      ...Object.fromEntries(
        jobEntries
          .filter(([, jobId]) => completed.has(jobId))
          .map(([key, jobId]) => [key, completed.get(jobId)!]),
      ),
      // A separately verified ArtImage may supersede an old ArtJob output.
      ...COUCH_ALIEN_ART_IDS,
      ...approvedRedo,
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
