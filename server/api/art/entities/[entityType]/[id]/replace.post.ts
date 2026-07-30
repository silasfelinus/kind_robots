// /server/api/art/entities/[entityType]/[id]/replace.post.ts
import {
  createError,
  defineEventHandler,
  getHeader,
  getRouterParam,
  readMultipartFormData,
} from 'h3'
import prisma from '~/server/utils/prisma'
import { errorHandler } from '~/server/utils/error'
import { requireApiUser } from '~/server/utils/authGuard'
import { uploadArtImage } from '~/server/utils/UploadArtImage'
import {
  applyEntityArtImage,
  listEntityArtHistory,
  resolveEntityArtTarget,
} from '~/server/utils/entityArt'

const MAX_IMAGE_BYTES = 15 * 1024 * 1024
const MAX_REQUEST_BYTES = MAX_IMAGE_BYTES + 1024 * 1024
const IMAGE_TYPES: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpeg',
  'image/webp': 'webp',
}

type MultipartForm = Awaited<ReturnType<typeof readMultipartFormData>>

function formValue(form: MultipartForm, name: string): string {
  return form?.find((entry) => entry.name === name)?.data?.toString().trim() || ''
}

function parseBoolean(value: string, fallback: boolean): boolean {
  if (!value) return fallback
  if (['true', '1', 'yes', 'on'].includes(value.toLowerCase())) return true
  if (['false', '0', 'no', 'off'].includes(value.toLowerCase())) return false
  throw createError({ statusCode: 400, message: 'Invalid boolean value.' })
}

export default defineEventHandler(async (event) => {
  try {
    const contentLength = Number(getHeader(event, 'content-length') || 0)
    if (Number.isFinite(contentLength) && contentLength > MAX_REQUEST_BYTES) {
      throw createError({
        statusCode: 413,
        message: 'Image upload is too large. Maximum image size is 15 MB.',
      })
    }

    const auth = await requireApiUser(event)
    const entityType = getRouterParam(event, 'entityType')
    const id = getRouterParam(event, 'id')
    const form = await readMultipartFormData(event)
    const field = formValue(form, 'field')
    const target = await resolveEntityArtTarget(
      prisma,
      entityType,
      id,
      field,
      auth,
    )
    const imageFile = form?.find(
      (entry) => entry.name === 'file' || entry.name === 'image',
    )
    if (!imageFile?.data?.length) {
      throw createError({ statusCode: 400, message: 'Choose an image to upload.' })
    }
    if (imageFile.data.length > MAX_IMAGE_BYTES) {
      throw createError({
        statusCode: 413,
        message: 'Image upload is too large. Maximum image size is 15 MB.',
      })
    }

    const mimeType = String(imageFile.type || '').toLowerCase()
    const fileType = IMAGE_TYPES[mimeType]
    if (!fileType) {
      throw createError({
        statusCode: 415,
        message: 'Only PNG, JPEG, and WebP images are supported.',
      })
    }

    const preserveOriginal = parseBoolean(
      formValue(form, 'preserveOriginal'),
      true,
    )
    const title =
      String(target.record.title || target.record.name || target.entityType).trim()
    const uploaded = await uploadArtImage({
      uploadedFile: {
        data: imageFile.data,
        filename:
          imageFile.filename ||
          `${target.entityType}-${target.entityId}-${target.field}.${fileType}`,
      },
      userId: auth.user.id,
      galleryName: `${target.entityType}-${target.entityId}`,
      fileType,
      fileName: `${target.entityType}-${target.entityId}-${target.field}`,
      path: `entity:${target.entityType}:${target.entityId}:upload:${target.field}`,
      artPrompt: `Uploaded ${target.config.label.toLowerCase()} replacement for ${title}`,
      designer: auth.user.username || `User ${auth.user.id}`,
      isPublic: target.record.isPublic ?? true,
      isMature: target.record.isMature ?? false,
    })

    const result = await prisma.$transaction((tx) =>
      applyEntityArtImage(tx, {
        entityType: target.entityType,
        entityId: target.entityId,
        field: target.field,
        artImageId: uploaded.id,
        preserveOriginal,
      }),
    )
    const history = await listEntityArtHistory(
      prisma,
      target.entityType,
      target.entityId,
    )

    event.node.res.statusCode = 201
    return {
      success: true,
      message: preserveOriginal
        ? `${target.config.label} replaced; the previous image was kept as inspiration.`
        : `${target.config.label} replaced without retaining the previous image.`,
      data: {
        entity: result.entity,
        history,
        artImageId: uploaded.id,
        archivedArtImageId: result.archivedArtImageId,
      },
      statusCode: 201,
    }
  } catch (error: unknown) {
    const handled = errorHandler(error)
    const statusCode = handled.statusCode || 500
    event.node.res.statusCode = statusCode
    return {
      success: false,
      message: handled.message || 'Failed to replace entity artwork.',
      data: null,
      statusCode,
    }
  }
})
