import {
  createError,
  defineEventHandler,
  getRouterParam,
  sendRedirect,
  setHeader,
} from 'h3'
import prisma from '~/server/utils/prisma'
import {
  canReadArtImage,
  getMediaViewerAccessContext,
} from '~/server/utils/artImageAccess'
import { DEEPHEART_ART_IDS } from '~/utils/deepheart/renderedArt'

const approvedIds = new Set(Object.values(DEEPHEART_ART_IDS))
const IMAGE_TYPES: Record<string, string> = {
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  webp: 'image/webp',
  gif: 'image/gif',
  avif: 'image/avif',
}

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'))
  if (!Number.isInteger(id) || !approvedIds.has(id)) {
    throw createError({ statusCode: 404, statusMessage: 'Art not found' })
  }

  // The Deepheart preview is admin-only. Predictable ArtImage IDs must not
  // turn private assets into public media, and mature art stays separate.
  const access = await getMediaViewerAccessContext(event)
  if (!access.isAdmin) {
    throw createError({ statusCode: 404, statusMessage: 'Art not found' })
  }

  const image = await prisma.artImage.findUnique({
    where: { id },
    select: {
      userId: true,
      isActive: true,
      isPublic: true,
      isMature: true,
      imagePath: true,
      fileType: true,
    },
  })
  if (
    !image ||
    image.isActive === false ||
    image.isMature === true ||
    !canReadArtImage(image, access)
  ) {
    throw createError({ statusCode: 404, statusMessage: 'Art not found' })
  }

  setHeader(event, 'Cache-Control', 'private, max-age=3600')
  setHeader(event, 'X-Content-Type-Options', 'nosniff')
  if (image.imagePath?.startsWith('/images/')) {
    return sendRedirect(event, image.imagePath, 302)
  }
  // Avoid loading a potentially megabyte-sized imageData blob for every
  // path-backed portrait. The builder can show dozens of portraits at once.
  const binary = await prisma.artImage.findUnique({
    where: { id },
    select: { imageData: true },
  })
  if (!binary?.imageData) {
    throw createError({ statusCode: 404, statusMessage: 'Image not delivered' })
  }
  const type = IMAGE_TYPES[String(image.fileType || '').toLowerCase()]
  if (!type) {
    throw createError({ statusCode: 415, statusMessage: 'Invalid image format' })
  }
  setHeader(event, 'Content-Type', type)
  return Buffer.from(binary.imageData.replace(/^data:[^,]*,/, ''), 'base64')
})
