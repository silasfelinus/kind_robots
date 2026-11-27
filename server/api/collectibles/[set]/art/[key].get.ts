// GET /api/collectibles/:set/art/:key -- catalog art for one item.
//
// Collectible art renders as public ArtImages (the Conductor ledger sets
// is_public), so the shared media rule decides who sees it: public, active,
// and mature only for viewers who opted in. A plain <img> sends no header,
// so the viewer comes from the kind-session cookie.
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
    select: {
      userId: true,
      isActive: true,
      isPublic: true,
      isMature: true,
      imagePath: true,
      fileType: true,
    },
  })
  if (!image || image.isActive === false) throw notFound()
  const access = await getMediaViewerAccessContext(event)
  if (!canReadArtImage(image, access)) throw notFound()

  setHeader(
    event,
    'Cache-Control',
    image.isPublic && !image.isMature
      ? 'public, max-age=86400'
      : 'private, max-age=300',
  )
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
