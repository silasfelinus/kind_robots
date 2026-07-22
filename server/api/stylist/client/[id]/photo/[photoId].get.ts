// /server/api/stylist/client/[id]/photo/[photoId].get.ts
import { createError, defineEventHandler, getRouterParam, setHeader } from 'h3'
import prisma from '../../../../../utils/prisma'
import { errorHandler } from '../../../../../utils/error'
import { requireApiUser } from '../../../../../utils/authGuard'

const CONTENT_TYPES: Record<string, string> = {
  png: 'image/png', jpeg: 'image/jpeg', jpg: 'image/jpeg', webp: 'image/webp',
}

export default defineEventHandler(async (event) => {
  try {
    const auth = await requireApiUser(event)
    const clientId = Number(getRouterParam(event, 'id'))
    const photoId = Number(getRouterParam(event, 'photoId'))
    if (!Number.isInteger(clientId) || !Number.isInteger(photoId)) {
      throw createError({ statusCode: 400, message: 'Invalid client or photo id.' })
    }
    const photo = await prisma.artImage.findFirst({
      where: {
        id: photoId,
        userId: auth.user.id,
        isPublic: false,
        path: { startsWith: `stylist-client:${clientId}:gallery:` },
      },
      select: { imageData: true, fileType: true },
    })
    if (!photo?.imageData) throw createError({ statusCode: 404, message: 'Client photo not found.' })
    setHeader(event, 'Content-Type', CONTENT_TYPES[String(photo.fileType || '').toLowerCase()] || 'application/octet-stream')
    setHeader(event, 'Cache-Control', 'private, max-age=3600')
    return Buffer.from(photo.imageData, 'base64')
  } catch (error: unknown) {
    const handled = errorHandler(error)
    event.node.res.statusCode = handled.statusCode || 500
    return { success: false, statusCode: handled.statusCode || 500, message: handled.message || 'Failed to load client photo.' }
  }
})