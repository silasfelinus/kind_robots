// /server/api/projects/[id]/art/replace.post.ts
import {
  createError,
  defineEventHandler,
  getHeader,
  readMultipartFormData,
} from 'h3'
import prisma from '~/server/utils/prisma'
import { errorHandler } from '~/server/utils/error'
import { requireApiUser } from '~/server/utils/authGuard'
import { uploadArtImage } from '~/server/utils/UploadArtImage'
import {
  assertProjectAccess,
  getProjectId,
  projectInclude,
} from '../../index'

const MAX_IMAGE_BYTES = 15 * 1024 * 1024
const MAX_REQUEST_BYTES = MAX_IMAGE_BYTES + 1024 * 1024
const IMAGE_TYPES: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpeg',
  'image/webp': 'webp',
}
const PROJECT_ART_FIELDS = new Set(['imagePath', 'cardPath', 'heroPath'])

type ProjectArtField = 'imagePath' | 'cardPath' | 'heroPath'

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

function imageIdFromApiPath(value: string | null): number | null {
  const match = value?.match(/\/api\/art\/images\/(\d+)\/file/)
  const id = Number(match?.[1])
  return Number.isInteger(id) && id > 0 ? id : null
}

function extensionFromPath(value: string): string {
  const match = value.match(/\.([a-z0-9]+)(?:[?#].*)?$/i)
  const extension = match?.[1]?.toLowerCase()
  return extension && ['png', 'jpeg', 'jpg', 'webp'].includes(extension)
    ? extension
    : 'webp'
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

    const id = getProjectId(event)
    const auth = await requireApiUser(event)
    const project = await prisma.project.findUnique({ where: { id } })
    if (!project) {
      throw createError({ statusCode: 404, message: 'Project not found.' })
    }
    assertProjectAccess(project, auth.user)

    const form = await readMultipartFormData(event)
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

    const field = formValue(form, 'field') as ProjectArtField
    if (!PROJECT_ART_FIELDS.has(field)) {
      throw createError({
        statusCode: 400,
        message: 'Choose Icon, Card, or Hero as the image target.',
      })
    }

    const preserveOriginal = parseBoolean(
      formValue(form, 'preserveOriginal'),
      true,
    )
    const slug = project.conductorSlug || project.slug || `project-${project.id}`
    const label = field === 'imagePath' ? 'icon' : field === 'cardPath' ? 'card' : 'hero'
    const currentPath = project[field]

    const uploaded = await uploadArtImage({
      uploadedFile: {
        data: imageFile.data,
        filename: imageFile.filename || `${slug}-${label}.${fileType}`,
      },
      userId: auth.user.id,
      galleryName: `project-${slug}`,
      fileType,
      fileName: `${slug}-${label}`,
      path: `project:${project.id}:${field}`,
      artPrompt: `Uploaded replacement ${label} for ${project.title}`,
      designer: auth.user.username || `User ${auth.user.id}`,
      isPublic: project.isPublic,
      isMature: project.isMature,
    })

    const newPath = `/api/art/images/${uploaded.id}/file?v=${encodeURIComponent(
      uploaded.updatedAt?.toISOString() || uploaded.createdAt.toISOString(),
    )}`

    const updated = await prisma.$transaction(async (tx) => {
      let oldImageId = imageIdFromApiPath(currentPath)
      if (!oldImageId && currentPath) {
        const existing = await tx.artImage.findFirst({
          where: {
            OR: [{ imagePath: currentPath }, { path: currentPath }],
          },
          select: { id: true },
        })
        oldImageId = existing?.id ?? null
      }

      if (preserveOriginal && currentPath) {
        if (!oldImageId) {
          const previous = await tx.artImage.create({
            data: {
              userId: project.userId || auth.user.id,
              fileName: `${slug}-${label}-previous`,
              fileType: extensionFromPath(currentPath),
              imagePath: currentPath,
              path: `project:${project.id}:${field}:previous`,
              artPrompt: `Previous ${label} retained from ${project.title}`,
              designer: project.designer || auth.user.username || 'Kind Robots',
              isPublic: project.isPublic,
              isMature: project.isMature,
              isActive: true,
            },
            select: { id: true },
          })
          oldImageId = previous.id
        }

        await tx.projectArtImage.upsert({
          where: {
            projectId_artImageId: { projectId: project.id, artImageId: oldImageId },
          },
          create: { projectId: project.id, artImageId: oldImageId },
          update: {},
        })
      } else if (oldImageId) {
        await tx.projectArtImage.deleteMany({
          where: { projectId: project.id, artImageId: oldImageId },
        })
      }

      await tx.projectArtImage.upsert({
        where: {
          projectId_artImageId: {
            projectId: project.id,
            artImageId: uploaded.id,
          },
        },
        create: { projectId: project.id, artImageId: uploaded.id },
        update: {},
      })

      await tx.project.update({
        where: { id: project.id },
        data: { [field]: newPath },
      })

      return tx.project.findUnique({
        where: { id: project.id },
        include: projectInclude,
      })
    })

    event.node.res.statusCode = 201
    return {
      success: true,
      message: preserveOriginal
        ? `${label} replaced; the previous image was kept as inspiration.`
        : `${label} replaced; the previous project reference was removed.`,
      data: updated,
      statusCode: 201,
    }
  } catch (error: unknown) {
    const handled = errorHandler(error)
    event.node.res.statusCode = handled.statusCode || 500
    return {
      success: false,
      message: handled.message || 'Failed to replace project art.',
      data: null,
      statusCode: handled.statusCode || 500,
    }
  }
})
