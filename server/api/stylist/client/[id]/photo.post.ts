// /server/api/stylist/client/[id]/photo.post.ts
import {
  createError,
  defineEventHandler,
  getHeader,
  getRouterParam,
  readMultipartFormData,
} from 'h3'
import prisma from '../../../../utils/prisma'
import { errorHandler } from '../../../../utils/error'
import { requireApiUser } from '../../../../utils/authGuard'
import { uploadArtImage } from '../../../../utils/UploadArtImage'

const MAX_IMAGE_BYTES = 15 * 1024 * 1024
const MAX_REQUEST_BYTES = MAX_IMAGE_BYTES + 1024 * 1024
const IMAGE_TYPES = {
  'image/png': 'png',
  'image/jpeg': 'jpeg',
  'image/webp': 'webp',
} as const

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

    const contentLength = Number(getHeader(event, 'content-length') || 0)
    if (Number.isFinite(contentLength) && contentLength > MAX_REQUEST_BYTES) {
      throw createError({
        statusCode: 413,
        message: 'Client photo is too large. Maximum image size is 15 MB.',
      })
    }

    const form = await readMultipartFormData(event)
    const imageFile = form?.find(
      (field) => field.name === 'file' || field.name === 'image',
    )

    if (!imageFile?.data?.length) {
      throw createError({ statusCode: 400, message: 'No client photo received.' })
    }

    if (imageFile.data.length > MAX_IMAGE_BYTES) {
      throw createError({
        statusCode: 413,
        message: 'Client photo is too large. Maximum image size is 15 MB.',
      })
    }

    const mimeType = String(imageFile.type || '').toLowerCase()
    const fileType = IMAGE_TYPES[mimeType as keyof typeof IMAGE_TYPES]

    if (!fileType) {
      throw createError({
        statusCode: 415,
        message: 'Only PNG, JPEG, and WebP client photos are supported.',
      })
    }

    const photoPath = `stylist-client:${clientId}:profile`
    const photo = await uploadArtImage({
      uploadedFile: {
        data: imageFile.data,
        filename: imageFile.filename || `${client.name}-photo.${fileType}`,
      },
      userId: auth.user.id,
      galleryName: 'stylist-client-private',
      fileType,
      fileName: `${client.name}-profile`,
      path: photoPath,
      designer: auth.user.username || `User ${auth.user.id}`,
      isPublic: false,
      isMature: false,
    })

    await prisma.artImage.deleteMany({
      where: {
        userId: auth.user.id,
        path: photoPath,
        id: { not: photo.id },
      },
    })

    event.node.res.statusCode = 201

    return {
      success: true,
      message: `Photo saved for ${client.name}.`,
      statusCode: 201,
      data: {
        photoId: photo.id,
        photoUrl: `/api/stylist/client/${clientId}/photo?v=${Date.now()}`,
      },
    }
  } catch (error: unknown) {
    const handled = errorHandler(error)
    event.node.res.statusCode = handled.statusCode || 500

    return {
      success: false,
      statusCode: handled.statusCode || 500,
      message: handled.message || 'Failed to save the client photo.',
    }
  }
})