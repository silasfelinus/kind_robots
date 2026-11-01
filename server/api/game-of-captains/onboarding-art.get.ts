import { defineEventHandler } from 'h3'
import prisma from '~/server/utils/prisma'
import { errorHandler } from '~/server/utils/error'
import {
  buildArtImageWhere,
  getArtImageAccessContext,
} from '~/server/utils/artImageAccess'
import { renderableArtPath } from '~/utils/artImageSrc'
import { galleryThumbnailUrl } from '~/server/utils/artGalleryArchiveMedia'
import { COUCH_ONBOARDING_ART_IDS } from '~/utils/gameOfCaptains/onboardingArt'
import { COUCH_VOYAGE_ART_IDS } from '~/utils/gameOfCaptains/voyagePaintings'
import { COUCH_EXPRESSION_ART_IDS } from '~/utils/gameOfCaptains/expressionPaintings'

const PAINTED_ART_IDS = {
  ...COUCH_ONBOARDING_ART_IDS,
  ...COUCH_VOYAGE_ART_IDS,
  ...COUCH_EXPRESSION_ART_IDS,
}

export default defineEventHandler(async (event) => {
  try {
    const access = await getArtImageAccessContext(event)
    const images = await prisma.artImage.findMany({
      where: {
        AND: [
          { id: { in: Object.values(PAINTED_ART_IDS) } },
          buildArtImageWhere(access),
        ],
      },
      select: { id: true, imagePath: true, path: true },
    })

    const byId = new Map(images.map((image) => [image.id, image]))
    const sources: Record<string, string> = {}

    for (const [key, id] of Object.entries(PAINTED_ART_IDS)) {
      const image = byId.get(id)
      if (!image) continue
      const src =
        renderableArtPath(image.imagePath) ||
        renderableArtPath(image.path) ||
        galleryThumbnailUrl(id)
      sources[key] = src
    }

    return { success: true, data: sources }
  } catch (error: unknown) {
    const handled = errorHandler(error)
    event.node.res.statusCode = handled.statusCode || 500
    return { success: false, data: {}, message: handled.message }
  }
})
