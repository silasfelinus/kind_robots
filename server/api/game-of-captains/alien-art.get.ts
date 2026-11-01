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

export default defineEventHandler(async (event) => {
  try {
    const access = await getArtImageAccessContext(event)
    const entries = Object.entries(COUCH_ALIEN_ART_IDS)
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
