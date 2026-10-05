// /server/api/art/queue/recent-images.get.ts
//
// The caller's own recently finished ArtJobs that produced a still image --
// the "pick from recent art" menu in the video generator. Deliberately its own
// route rather than the queue listing: that one returns every user's jobs to
// an admin and carries each job's full workflow payload, which is megabytes
// for a strip of thumbnails. This returns only what a picker card needs.
import { defineEventHandler, getQuery } from 'h3'
import prisma from '../../../utils/prisma'
import { errorHandler } from '../../../utils/error'
import { requireMachineUser } from '../../../utils/authGuard'
import { attachGalleryArchiveMediaPaths } from '../../../utils/artGalleryArchiveMedia'
import { resolveArtImageSource } from '~/utils/artImageSource'
import type { RecentArtJobImage } from '~/utils/recentArtImages'

const DEFAULT_LIMIT = 24
const MAX_LIMIT = 60

function readLimit(value: unknown): number {
  const parsed = Number(value)
  if (!Number.isInteger(parsed) || parsed <= 0) return DEFAULT_LIMIT
  return Math.min(parsed, MAX_LIMIT)
}

function readBoolean(value: unknown): boolean {
  return value === true || value === 'true' || value === '1'
}

export default defineEventHandler(async (event) => {
  try {
    const auth = await requireMachineUser(event)
    const query = getQuery(event)
    const limit = readLimit(query.limit)
    const includeMature = readBoolean(query.showMature)

    const jobs = await prisma.artJob.findMany({
      where: {
        userId: auth.user.id,
        status: 'DONE',
        artImageId: { not: null },
      },
      orderBy: [{ updatedAt: 'desc' }, { id: 'desc' }],
      take: limit * 2,
      select: { id: true, createdAt: true, updatedAt: true, artImageId: true },
    })

    const imageIds = [
      ...new Set(
        jobs
          .map((job) => job.artImageId)
          .filter((id): id is number => typeof id === 'number'),
      ),
    ]

    const images = await prisma.artImage.findMany({
      where: {
        id: { in: imageIds },
        userId: auth.user.id,
        ...(includeMature ? {} : { isMature: { not: true } }),
      },
      select: {
        id: true,
        designer: true,
        promptString: true,
        isMature: true,
        isPublic: true,
        imagePath: true,
        path: true,
        thumbnailPath: true,
        fileName: true,
        fileType: true,
      },
    })
    attachGalleryArchiveMediaPaths(
      images as Parameters<typeof attachGalleryArchiveMediaPaths>[0],
      'thumbnail',
    )
    const imageById = new Map(images.map((image) => [image.id, image]))

    const seen = new Set<number>()
    const data: RecentArtJobImage[] = []
    for (const job of jobs) {
      const image = job.artImageId ? imageById.get(job.artImageId) : undefined
      if (!image || seen.has(image.id)) continue
      if (resolveArtImageSource(image).kind !== 'image') continue
      seen.add(image.id)
      data.push({
        jobId: job.id,
        artImageId: image.id,
        finishedAt: (job.updatedAt ?? job.createdAt).toISOString(),
        promptString: image.promptString,
        isMature: image.isMature === true,
        isPublic: image.isPublic !== false,
        imagePath: image.imagePath,
        path: image.path,
        thumbnailPath: image.thumbnailPath,
        fileName: image.fileName,
        fileType: image.fileType,
      })
      if (data.length >= limit) break
    }

    return {
      success: true,
      message: `${data.length} recent art image(s).`,
      data,
    }
  } catch (error: unknown) {
    const handled = errorHandler(error)
    event.node.res.statusCode = handled.statusCode || 500
    return {
      success: false,
      message: handled.message || 'Failed to load recent art.',
      data: [],
    }
  }
})
