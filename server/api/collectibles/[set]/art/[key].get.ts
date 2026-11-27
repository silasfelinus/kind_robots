// GET /api/collectibles/:set/art/:key -- public catalog art for one item.
import {
  createError,
  defineEventHandler,
  getRouterParam,
  sendRedirect,
  setHeader,
} from 'h3'
import prisma from '~/server/utils/prisma'
import { setFromEvent } from '~/server/utils/collectibles'

const IMAGE_TYPES: Record<string, string> = {
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  webp: 'image/webp',
}

const notFound = () =>
  createError({ statusCode: 404, statusMessage: 'Art not found' })

export default defineEventHandler(async (event) => {
  const set = setFromEvent(event)
  const itemKey = getRouterParam(event, 'key') ?? ''
  const art = await prisma.collectibleArt.findUnique({
    where: { setSlug_itemKey: { setSlug: set.slug, itemKey } },
    select: { artImageId: true },
  })
  if (!art) throw notFound()
  const image = await prisma.artImage.findUnique({
    where: { id: art.artImageId },
    select: { isActive: true, isMature: true, imagePath: true, fileType: true },
  })
  if (!image || image.isActive === false || image.isMature === true) {
    throw notFound()
  }
  setHeader(event, 'Cache-Control', 'public, max-age=86400')
  setHeader(event, 'X-Content-Type-Options', 'nosniff')
  if (image.imagePath?.startsWith('/images/')) {
    return sendRedirect(event, image.imagePath, 302)
  }
  const binary = await prisma.artImage.findUnique({
    where: { id: art.artImageId },
    select: { imageData: true },
  })
  const type = IMAGE_TYPES[String(image.fileType || '').toLowerCase()]
  if (!binary?.imageData || !type) throw notFound()
  setHeader(event, 'Content-Type', type)
  return Buffer.from(binary.imageData.replace(/^data:[^,]*,/, ''), 'base64')
})
