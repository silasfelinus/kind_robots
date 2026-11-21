import { createHash } from 'node:crypto'
import { createError, defineEventHandler, readBody, setHeader } from 'h3'
import sharp from 'sharp'
import prisma from '~/server/utils/prisma'
import { errorHandler } from '~/server/utils/error'
import { requireAdminApiUser } from '~/server/utils/authGuard'
import { readArtImageBytes } from '~/server/utils/artImageBytes'
import { parseEmperorArtReviewTargets } from '~/utils/emperorOfDust/fortress/artDelivery'

type ReviewRequest = { targets?: unknown }
type ReviewResult = {
  asset: string
  artImageId: number
  artJobId?: number
  status: 'ready' | 'unavailable'
  reason?: string
  width?: number
  height?: number
  sha256?: string
  preview?: string
}

export default defineEventHandler(async (event) => {
  setHeader(event, 'Cache-Control', 'private, no-store, max-age=0')
  setHeader(event, 'Pragma', 'no-cache')
  setHeader(event, 'Vary', 'Authorization')
  try {
    await requireAdminApiUser(event)
    const body = await readBody<ReviewRequest>(event)
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      throw createError({ statusCode: 400, message: 'JSON object required.' })
    }

    let targets: ReturnType<typeof parseEmperorArtReviewTargets>
    try {
      targets = parseEmperorArtReviewTargets(body.targets)
    } catch (error) {
      throw createError({
        statusCode: 400,
        message:
          error instanceof Error ? error.message : 'Invalid review targets.',
      })
    }

    const ids = targets.map((target) => target.artImageId)
    const [jobs, images] = await Promise.all([
      prisma.artJob.findMany({
        where: {
          projectSlug: 'emperor-of-dust',
          status: 'DONE',
          artImageId: { in: ids },
        },
        select: { id: true, artImageId: true },
      }),
      prisma.artImage.findMany({
        where: {
          id: { in: ids },
          isActive: true,
          isMature: false,
        },
        select: { id: true },
      }),
    ])
    const eligible = new Set(images.map((image) => image.id))
    const jobByImage = new Map(
      jobs
        .filter((job) => job.artImageId !== null)
        .map((job) => [job.artImageId!, job.id]),
    )

    const results: ReviewResult[] = []
    for (const target of targets) {
      const result: ReviewResult = {
        ...target,
        status: 'unavailable',
      }
      results.push(result)
      const jobId = jobByImage.get(target.artImageId)
      if (!jobId || !eligible.has(target.artImageId)) {
        result.reason = 'No active non-mature DONE Emperor ArtJob source.'
        continue
      }
      result.artJobId = jobId

      const source = await readArtImageBytes(target.artImageId)
      if (!source) {
        result.reason = 'Original ArtImage bytes are unavailable.'
        continue
      }
      try {
        const original = Buffer.from(source.base64, 'base64')
        const metadata = await sharp(original).metadata()
        if (
          !metadata.width ||
          !metadata.height ||
          (metadata.pages ?? 1) > 1 ||
          metadata.width < (target.asset.startsWith('endings/') ? 960 : 400) ||
          metadata.height < (target.asset.startsWith('endings/') ? 500 : 250)
        ) {
          result.reason = 'Image source failed size or page-count checks.'
          continue
        }

        const thumbnail = await sharp(original)
          .rotate()
          .resize({
            width: 640,
            height: 400,
            fit: 'inside',
            withoutEnlargement: true,
          })
          .webp({ quality: 72 })
          .toBuffer()
        result.status = 'ready'
        result.width = metadata.width
        result.height = metadata.height
        result.sha256 = createHash('sha256').update(original).digest('hex')
        result.preview = 'data:image/webp;base64,' + thumbnail.toString('base64')
      } catch {
        result.reason = 'Original ArtImage bytes could not be decoded.'
      }
    }
    return {
      success: true,
      statusCode: 200,
      data: { results },
    }
  } catch (error) {
    const handled = errorHandler(error)
    event.node.res.statusCode = handled.statusCode || 500
    return {
      success: false,
      statusCode: event.node.res.statusCode,
      message: handled.message || 'Emperor art review failed.',
      data: null,
    }
  }
})
