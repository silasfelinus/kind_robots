// /server/api/stylist/client/[id]/photo.get.ts
import {
  createError,
  defineEventHandler,
  getRouterParam,
  setHeader,
} from 'h3'
import prisma from '../../../../utils/prisma'
import { errorHandler } from '../../../../utils/error'
import { requireApiUser } from '../../../../utils/authGuard'

const CONTENT_TYPES: Record<string, string> = {
  png: 'image/png',
  jpeg: 'image/jpeg',
  jpg: 'image/jpeg',
  webp: 'image/webp',
}

export default defineEventHandler(async (event) => {
  try {
    const auth = await requireApiUser(event)
    const clientId = Number(getRouterParam(event, 'id'))

    if (!Number.isInteger(clientId) || clientId <= 0) {
      throw createError({ statusCode: 400, message: 'Invalid client id.' })
    }

    const client = await prisma.stylistClient.findUnique({ where: { id: clientId } })

    if (!client || client.userId !== auth.user.id) {
      throw createError({ statusCode: 404, message: `Client ${clientId} not found.` })
    }

    const photo = await prisma.artImage.findFirst({
      where: {
        userId: auth.user.id,
        isPublic: false,
        path: `stylist-client:${clientId}:profile`,
      },
      select: { imageData: true, fileType: true, updatedAt: true, createdAt: true },
      orderBy: [{ updatedAt: 'desc' }, { createdAt: 'desc' }],
    })

    if (!photo?.imageData) {
      throw createError({ statusCode: 404, message: 'Client photo not found.' })
    }

    const fileType = String(photo.fileType || '').toLowerCase()
    setHeader(event, 'Content-Type', CONTENT_TYPES[fileType] || 'application/octet-stream')
    setHeader(event, 'Cache-Control', 'private, max-age=3600')

    return Buffer.from(photo.imageData, 'base64')
  } catch (error: unknown) {
    const handled = errorHandler(error)
    event.node.res.statusCode = handled.statusCode || 500

    return {
      success: false,
      statusCode: handled.statusCode || 500,
      message: handled.message || 'Failed to load the client photo.',
    }
  }
})