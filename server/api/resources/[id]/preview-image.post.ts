// /server/api/resources/[id]/preview-image.post.ts
import {
  createError,
  defineEventHandler,
  getRouterParam,
  readBody,
} from 'h3'
import prisma from '~/server/utils/prisma'
import { errorHandler } from '~/server/utils/error'
import { requireMachineUser } from '~/server/utils/authGuard'
import { resourceGallerySelect } from '../gallery'

type PreviewUploadBody = {
  imageData?: unknown
  fileName?: unknown
  fileType?: unknown
}

const ALLOWED_FILE_TYPES = new Set(['png', 'jpeg', 'jpg', 'webp', 'avif'])
const MAX_IMAGE_DATA_CHARS = 30_000_000

function requiredText(
  value: unknown,
  fieldName: string,
  maxLength: number,
): string {
  if (typeof value !== 'string' || !value.trim()) {
    throw createError({
      statusCode: 400,
      message: `${fieldName} is required.`,
    })
  }

  const text = value.trim()
  if (text.length > maxLength) {
    throw createError({
      statusCode: 400,
      message: `${fieldName} must be ${maxLength} characters or fewer.`,
    })
  }

  return text
}

function inferFileType(fileName: string): string {
  return fileName.split('?')[0]?.split('.').pop()?.toLowerCase() || 'png'
}

export default defineEventHandler(async (event) => {
  try {
    const resourceId = Number(getRouterParam(event, 'id'))

    if (!Number.isInteger(resourceId) || resourceId <= 0) {
      throw createError({ statusCode: 400, message: 'Invalid Resource ID.' })
    }

    const auth = await requireMachineUser(event)
    const body = await readBody<PreviewUploadBody>(event)
    const resource = await prisma.resource.findUnique({
      where: { id: resourceId },
      select: {
        id: true,
        name: true,
        customLabel: true,
        userId: true,
        isMature: true,
        isPublic: true,
      },
    })

    if (!resource) {
      throw createError({ statusCode: 404, message: 'Resource not found.' })
    }

    if (!auth.isAdmin && resource.userId !== auth.user.id) {
      throw createError({
        statusCode: 403,
        message: 'Only the Resource owner or an admin can replace its preview.',
      })
    }

    const imageData = requiredText(
      body?.imageData,
      'imageData',
      MAX_IMAGE_DATA_CHARS,
    )
    const fileName = requiredText(
      body?.fileName || `resource-${resourceId}-preview.png`,
      'fileName',
      255,
    )
    const requestedFileType =
      typeof body?.fileType === 'string' && body.fileType.trim()
        ? body.fileType.trim().toLowerCase()
        : inferFileType(fileName)
    const fileType = requestedFileType === 'jpg' ? 'jpeg' : requestedFileType

    if (!ALLOWED_FILE_TYPES.has(requestedFileType)) {
      throw createError({
        statusCode: 400,
        message: `Unsupported preview file type: ${requestedFileType}.`,
      })
    }

    const result = await prisma.$transaction(async (tx) => {
      const artImage = await tx.artImage.create({
        data: {
          imageData,
          fileName,
          fileType,
          promptString: `Preview for ${resource.customLabel || resource.name}`,
          artPrompt: `Preview for ${resource.customLabel || resource.name}`,
          designer:
            auth.user.designerName || auth.user.username || `User ${auth.user.id}`,
          isPublic: resource.isPublic,
          isMature: resource.isMature,
          isActive: true,
          User: { connect: { id: auth.user.id } },
        },
        select: { id: true },
      })

      const updated = await tx.resource.update({
        where: { id: resourceId },
        data: {
          artImageId: artImage.id,
          imagePath: null,
        },
        select: resourceGallerySelect,
      })

      return { artImageId: artImage.id, resource: updated }
    })

    event.node.res.statusCode = 201
    return {
      success: true,
      message: 'Resource preview uploaded and attached.',
      data: result,
      statusCode: 201,
    }
  } catch (error: unknown) {
    const handled = errorHandler(error)
    const statusCode = handled.statusCode || 500
    event.node.res.statusCode = statusCode

    return {
      success: false,
      message: handled.message || 'Failed to upload Resource preview.',
      data: null,
      statusCode,
    }
  }
})
