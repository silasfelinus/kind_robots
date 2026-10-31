import { defineEventHandler } from 'h3'
import prisma from '~/server/utils/prisma'
import { errorHandler } from '~/server/utils/error'
import {
  buildArtImageWhere,
  getArtImageAccessContext,
} from '~/server/utils/artImageAccess'
import { renderableArtPath } from '~/utils/artImageSrc'
import { COUCH_ONBOARDING_ART_IDS } from '~/utils/gameOfCaptains/onboardingArt'

export default defineEventHandler(async (event) => {
  try {
    const access = await getArtImageAccessContext(event)
    const images = await prisma.artImage.findMany({
      where: {
        AND: [
          { id: { in: Object.values(COUCH_ONBOARDING_ART_IDS) } },
          buildArtImageWhere(access),
        ],
      },
      select: { id: true, imagePath: true, path: true },
    })

    const byId = new Map(images.map((image) => [image.id, image]))
    const sources: Record<string, string> = {}

    for (const [key, id] of Object.entries(COUCH_ONBOARDING_ART_IDS)) {
      const image = byId.get(id)
      const src = renderableArtPath(image?.imagePath) ||
        renderableArtPath(image?.path)
      if (src) sources[key] = src
    }

    return { success: true, data: sources }
  } catch (error: unknown) {
    const handled = errorHandler(error)
    event.node.res.statusCode = handled.statusCode || 500
    return { success: false, data: {}, message: handled.message }
  }
})
