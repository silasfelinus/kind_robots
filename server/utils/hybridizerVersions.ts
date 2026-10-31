import { createError } from 'h3'
import prisma from '~/server/utils/prisma'
import { parseArtJobPayload } from '~/server/utils/artJobPayload'
import {
  hybridizerDeliverableUrl,
  hybridizerQueueState,
} from '~/server/utils/hybridizerArt'

export const HYBRIDIZER_MAX_VERSIONS = 12

type Fusion = {
  id: string
  isPublic: boolean
  creatorUserId: number
  artJobId: number | null
}

export function requireVisibleFusion(
  fusion: Fusion | null,
  userId?: number | null,
): asserts fusion is Fusion {
  if (!fusion || (!fusion.isPublic && fusion.creatorUserId !== userId))
    throw createError({ statusCode: 404, message: 'Fusion not available.' })
}

export function requireFusionEditor(
  fusion: Fusion,
  userId: number,
  isAdmin: boolean,
) {
  if (fusion.creatorUserId !== userId && !isAdmin)
    throw createError({
      statusCode: 403,
      message: 'Only the discovery creator can replace its artwork.',
    })
}

// Revision ArtJobs have their own indexed project slug, avoiding a payload
// LIKE scan across the entire render queue and leaving pair identity untouched.
export function versionProjectSlug(id: string) {
  if (!/^[a-f0-9]{64}$/.test(id))
    throw createError({
      statusCode: 400,
      message: 'Invalid fusion identifier.',
    })
  return 'hybridizer:' + id
}

export async function versionJobs(fusion: Fusion) {
  const revisions = await prisma.artJob.findMany({
    where: { projectSlug: versionProjectSlug(fusion.id) },
    orderBy: { id: 'asc' },
    take: HYBRIDIZER_MAX_VERSIONS,
  })
  const first = revisions[0]
  const raw = first ? parseArtJobPayload(first.payload) : null
  const meta = raw?.hybridizer
  const originalId =
    meta && typeof meta === 'object' && !Array.isArray(meta)
      ? Number((meta as Record<string, unknown>).originalJobId)
      : fusion.artJobId
  const legacy =
    Number.isInteger(originalId) && Number(originalId) > 0
      ? await prisma.artJob.findUnique({ where: { id: Number(originalId) } })
      : null
  // The legacy job only belongs to this fusion if the previous trusted
  // fusion pointer (or the first revision's stored provenance) named it.
  if (legacy && legacy.projectSlug !== 'hybridizer') return revisions
  return legacy ? [legacy, ...revisions] : revisions
}

export async function visibleVersionArt(
  artImageId: number | null,
  fusion: Fusion,
  viewerId?: number | null,
) {
  if (!artImageId) return null
  const image = await prisma.artImage.findUnique({
    where: { id: artImageId },
    select: {
      id: true,
      imagePath: true,
      isActive: true,
      isPublic: true,
      isMature: true,
      userId: true,
    },
  })
  if (
    !image ||
    image.isActive === false ||
    image.isMature === true ||
    (fusion.isPublic
      ? image.isPublic !== true
      : image.userId !== fusion.creatorUserId && image.userId !== viewerId)
  )
    return null
  const path = hybridizerDeliverableUrl(image.imagePath)
  return path ? { id: image.id, imagePath: path } : null
}

export async function versionSummaries(
  fusion: Fusion,
  viewerId?: number | null,
) {
  const jobs = await versionJobs(fusion)
  const entries = await Promise.all(
    jobs.map(async (job, index) => {
      const image =
        job.status === 'DONE'
          ? await visibleVersionArt(job.artImageId, fusion, viewerId)
          : null
      return {
        jobId: job.id,
        revision: index,
        createdAt: job.createdAt,
        status: hybridizerQueueState(job.status, image?.imagePath ?? null),
        imagePath: image?.imagePath ?? null,
        artImageId: image?.id ?? null,
        isPrimary: fusion.artJobId === job.id,
      }
    }),
  )
  return entries
}
