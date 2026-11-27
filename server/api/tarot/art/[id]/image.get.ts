// GET /api/tarot/art/:id/image
//
// Serves one TarotArt render. Admins see every variant (cookie auth, because
// a plain <img> cannot send the API header). Everyone else sees only the
// approved default face of a card, or the chosen back, of a deck marked
// public for the /play/tarot reader. Unapproved art stays private.
import {
  createError,
  defineEventHandler,
  getRouterParam,
  sendRedirect,
  setHeader,
} from 'h3'
import prisma from '~/server/utils/prisma'
import { getMediaViewerAccessContext } from '~/server/utils/artImageAccess'

const IMAGE_TYPES: Record<string, string> = {
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  webp: 'image/webp',
  gif: 'image/gif',
  avif: 'image/avif',
}

const notFound = () =>
  createError({ statusCode: 404, statusMessage: 'Art not found' })

async function isPubliclyApproved(art: {
  id: number
  side: string
  cardId: number | null
  Deck: { isPublic: boolean; backArtId: number | null }
}) {
  if (!art.Deck.isPublic) return false
  if (art.side === 'BACK') return art.Deck.backArtId === art.id
  if (!art.cardId) return false
  const card = await prisma.tarotCard.findUnique({
    where: { id: art.cardId },
    select: { selectedArtId: true, status: true },
  })
  return card?.selectedArtId === art.id && card.status === 'APPROVED'
}

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'))
  if (!Number.isSafeInteger(id) || id < 1) throw notFound()
  const art = await prisma.tarotArt.findUnique({
    where: { id },
    select: {
      id: true,
      side: true,
      cardId: true,
      artImageId: true,
      Deck: { select: { isPublic: true, backArtId: true } },
    },
  })
  if (!art?.artImageId) throw notFound()

  const access = await getMediaViewerAccessContext(event)
  const visible = access.isAdmin || (await isPubliclyApproved(art))
  if (!visible) throw notFound()

  const image = await prisma.artImage.findUnique({
    where: { id: art.artImageId },
    select: { isActive: true, isMature: true, imagePath: true, fileType: true },
  })
  if (!image || image.isActive === false) throw notFound()
  if (image.isMature === true && !access.isAdmin) throw notFound()

  setHeader(
    event,
    'Cache-Control',
    access.isAdmin ? 'private, max-age=300' : 'public, max-age=3600',
  )
  setHeader(event, 'X-Content-Type-Options', 'nosniff')
  if (image.imagePath?.startsWith('/images/')) {
    return sendRedirect(event, image.imagePath, 302)
  }
  const binary = await prisma.artImage.findUnique({
    where: { id: art.artImageId },
    select: { imageData: true },
  })
  if (!binary?.imageData) {
    throw createError({ statusCode: 404, statusMessage: 'Image not delivered' })
  }
  const type = IMAGE_TYPES[String(image.fileType || '').toLowerCase()]
  if (!type) {
    throw createError({
      statusCode: 415,
      statusMessage: 'Invalid image format',
    })
  }
  setHeader(event, 'Content-Type', type)
  return Buffer.from(binary.imageData.replace(/^data:[^,]*,/, ''), 'base64')
})
