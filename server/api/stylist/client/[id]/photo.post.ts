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

function field(form: Awaited<ReturnType<typeof readMultipartFormData>>, name: string) {
  return form?.find((entry) => entry.name === name)?.data?.toString().trim() || ''
}

function slug(value: string, fallback: string): string {
  return (
    value
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 80) || fallback
  )
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

    const contentLength = Number(getHeader(event, 'content-length') || 0)
    if (Number.isFinite(contentLength) && contentLength > MAX_REQUEST_BYTES) {
      throw createError({
        statusCode: 413,
        message: 'Each client photo may be up to 15 MB.',
      })
    }

    const form = await readMultipartFormData(event)
    const imageFile = form?.find(
      (entry) => entry.name === 'file' || entry.name === 'image',
    )

    if (!imageFile?.data?.length) {
      throw createError({ statusCode: 400, message: 'No client photo received.' })
    }
    if (imageFile.data.length > MAX_IMAGE_BYTES) {
      throw createError({ statusCode: 413, message: 'Each client photo may be up to 15 MB.' })
    }

    const mimeType = String(imageFile.type || '').toLowerCase()
    const fileType = IMAGE_TYPES[mimeType as keyof typeof IMAGE_TYPES]
    if (!fileType) {
      throw createError({
        statusCode: 415,
        message: 'Only PNG, JPEG, and WebP client photos are supported.',
      })
    }

    const folder = slug(field(form, 'folder'), 'general')
    const kind = slug(field(form, 'kind'), 'style')
    const caption = field(form, 'caption').slice(0, 500)
    const requestedPrimary = ['true', '1', 'yes', 'on'].includes(
      field(form, 'isPrimary').toLowerCase(),
    )
    const galleryPrefix = `stylist-client:${clientId}:gallery:`
    const path = `${galleryPrefix}${folder}:${kind}:${Date.now()}`

    const existingCount = await prisma.artImage.count({
      where: { userId: auth.user.id, isPublic: false, path: { startsWith: galleryPrefix } },
    })
    const isPrimary = requestedPrimary || existingCount === 0

    const photo = await uploadArtImage({
      uploadedFile: {
        data: imageFile.data,
        filename: imageFile.filename || `${client.name}-${kind}.${fileType}`,
      },
      userId: auth.user.id,
      galleryName: 'stylist-client-private',
      fileType,
      fileName: `${client.name}-${kind}`,
      path,
      artPrompt: caption || null,
      genres: JSON.stringify({ folder, kind, isPrimary }),
      designer: auth.user.username || `User ${auth.user.id}`,
      isPublic: false,
      isMature: false,
    })

    if (isPrimary) {
      const others = await prisma.artImage.findMany({
        where: {
          userId: auth.user.id,
          isPublic: false,
          path: { startsWith: galleryPrefix },
          id: { not: photo.id },
        },
        select: { id: true, genres: true },
      })
      await Promise.all(
        others.map((other) => {
          let metadata: Record<string, unknown> = {}
          try {
            metadata = other.genres ? JSON.parse(other.genres) : {}
          } catch {
            metadata = {}
          }
          return prisma.artImage.update({
            where: { id: other.id },
            data: { genres: JSON.stringify({ ...metadata, isPrimary: false }) },
          })
        }),
      )
    }

    event.node.res.statusCode = 201
    return {
      success: true,
      message: `Photo added to ${client.name}'s gallery.`,
      statusCode: 201,
      data: { photoId: photo.id, isPrimary },
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