import { defineEventHandler, getQuery } from 'h3'
import prisma from '~/server/utils/prisma'
import { errorHandler } from '~/server/utils/error'
import {
  buildArtImageWhere,
  getArtImageAccessContext,
} from '~/server/utils/artImageAccess'
import { renderableArtPath } from '~/utils/artImageSrc'
import { galleryThumbnailUrl } from '~/server/utils/artGalleryArchiveMedia'
import { COUCH_TRIO_ART_IDS } from '~/utils/gameOfCaptains/trioPaintings'

// Fetch only the current crew combination's completed plates. Never make the
// entire 1,100-image catalogue part of initial onboarding or expose unfiltered
// private ArtImage URLs to an arbitrary client.
export default defineEventHandler(async (event) => {
  try {
    const access = await getArtImageAccessContext(event)
    const raw = getQuery(event).trio
    const trio = typeof raw === 'string' ? raw : ''
    if (!/^[a-z]+-[a-z]+-[a-z]+$/.test(trio)) return { success: true, data: {} }

    const entries = Object.entries(COUCH_TRIO_ART_IDS).filter(([key]) =>
      key.startsWith(`trios/${trio}-`),
    )
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
