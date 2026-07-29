// /server/api/art/images/[id]/file.get.ts
import {
  createError,
  defineEventHandler,
  getHeader,
  getRouterParam,
  sendRedirect,
  setHeader,
} from 'h3'
import prisma from '~/server/utils/prisma'
import { errorHandler } from '~/server/utils/error'
import { validateApiKey } from '~/server/utils/validateKey'

const CONTENT_TYPES: Record<string, string> = {
  png: 'image/png',
  jpeg: 'image/jpeg',
  jpg: 'image/jpeg',
  webp: 'image/webp',
}

export default defineEventHandler(async (event) => {
  try {
    const id = Number(getRouterParam(event, 'id'))
    if (!Number.isInteger(id) || id <= 0) {
      throw createError({ statusCode: 400, message: 'Invalid ArtImage ID.' })
    }

    const image = await prisma.artImage.findUnique({
      where: { id },
      select: {
        id: true,
        userId: true,
        imageData: true,
        imagePath: true,
        fileType: true,
        isPublic: true,
        isMature: true,
        isActive: true,
        updatedAt: true,
      },
    })

    if (!image || image.isActive === false) {
      throw createError({ statusCode: 404, message: 'Art image not found.' })
    }

    let mayView = image.isPublic === true && image.isMature !== true
    if (!mayView && getHeader(event, 'authorization')?.startsWith('Bearer ')) {
      try {
        const auth = await validateApiKey(event)
        mayView = Boolean(
          auth.isValid &&
            auth.user &&
            (auth.user.Role === 'ADMIN' || auth.user.id === image.userId),
        )
      } catch {
        mayView = false
      }
    }

    if (!mayView) {
      throw createError({ statusCode: 403, message: 'You cannot view this image.' })
    }

    if (image.imagePath && !image.imagePath.includes(`/api/art/images/${id}/file`)) {
      return sendRedirect(event, image.imagePath, 302)
    }

    if (!image.imageData) {
      throw createError({ statusCode: 404, message: 'Image bytes are unavailable.' })
    }

    const fileType = String(image.fileType || '').toLowerCase()
    setHeader(
      event,
      'Content-Type',
      CONTENT_TYPES[fileType] || 'application/octet-stream',
    )
    setHeader(
      event,
      'Cache-Control',
      image.isPublic
        ? 'public, max-age=31536000, immutable'
        : 'private, max-age=3600',
    )
    setHeader(event, 'X-Content-Type-Options', 'nosniff')
    return Buffer.from(image.imageData, 'base64')
  } catch (error: unknown) {
    const handled = errorHandler(error)
    event.node.res.statusCode = handled.statusCode || 500
    return {
      success: false,
      statusCode: handled.statusCode || 500,
      message: handled.message || 'Failed to load art image.',
    }
  }
})
