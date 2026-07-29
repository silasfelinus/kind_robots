// /server/api/projects/[id]/art/prepare-generation.post.ts
import { createError, defineEventHandler, readBody } from 'h3'
import prisma from '~/server/utils/prisma'
import { errorHandler } from '~/server/utils/error'
import { requireApiUser } from '~/server/utils/authGuard'
import { assertProjectAccess, getProjectId } from '../../index'

const PROJECT_ART_FIELDS = new Set(['imagePath', 'cardPath', 'heroPath'])
type ProjectArtField = 'imagePath' | 'cardPath' | 'heroPath'

type PrepareGenerationBody = {
  field?: string
  preserveOriginal?: boolean
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

function fieldLabel(field: ProjectArtField): string {
  if (field === 'imagePath') return 'icon'
  if (field === 'cardPath') return 'card'
  return 'hero'
}

export default defineEventHandler(async (event) => {
  try {
    const id = getProjectId(event)
    const auth = await requireApiUser(event)
    const project = await prisma.project.findUnique({ where: { id } })
    if (!project) {
      throw createError({ statusCode: 404, message: 'Project not found.' })
    }
    assertProjectAccess(project, auth.user)

    const body = await readBody<PrepareGenerationBody>(event)
    const field = String(body?.field || '') as ProjectArtField
    if (!PROJECT_ART_FIELDS.has(field)) {
      throw createError({
        statusCode: 400,
        message: 'Choose Icon, Card, or Hero as the image target.',
      })
    }

    const preserveOriginal = body?.preserveOriginal !== false
    const currentPath = project[field]
    if (!currentPath) {
      return {
        success: true,
        message: 'No previous Project image needed preparation.',
        data: { preserved: false, removed: false },
        statusCode: 200,
      }
    }

    const slug = project.conductorSlug || project.slug || `project-${project.id}`
    const label = fieldLabel(field)

    const result = await prisma.$transaction(async (tx) => {
      let oldImageId = imageIdFromApiPath(currentPath)
      if (!oldImageId) {
        const existing = await tx.artImage.findFirst({
          where: { OR: [{ imagePath: currentPath }, { path: currentPath }] },
          select: { id: true },
        })
        oldImageId = existing?.id ?? null
      }

      if (preserveOriginal) {
        if (!oldImageId) {
          const previous = await tx.artImage.create({
            data: {
              userId: project.userId || auth.user.id,
              fileName: `${slug}-${label}-previous`,
              fileType: extensionFromPath(currentPath),
              imagePath: currentPath,
              path: `project:${project.id}:${field}:previous`,
              artPrompt: `Previous ${label} retained from ${project.title}`,
              designer:
                project.designer || auth.user.username || 'Kind Robots',
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
            projectId_artImageId: {
              projectId: project.id,
              artImageId: oldImageId,
            },
          },
          create: { projectId: project.id, artImageId: oldImageId },
          update: {},
        })
        return { preserved: true, removed: false, artImageId: oldImageId }
      }

      if (oldImageId) {
        await tx.projectArtImage.deleteMany({
          where: { projectId: project.id, artImageId: oldImageId },
        })
      }
      return { preserved: false, removed: Boolean(oldImageId), artImageId: oldImageId }
    })

    return {
      success: true,
      message: preserveOriginal
        ? `Previous ${label} kept as Project inspiration.`
        : `Previous ${label} will not be retained as Project inspiration.`,
      data: result,
      statusCode: 200,
    }
  } catch (error: unknown) {
    const handled = errorHandler(error)
    event.node.res.statusCode = handled.statusCode || 500
    return {
      success: false,
      message: handled.message || 'Failed to prepare Project art replacement.',
      data: null,
      statusCode: handled.statusCode || 500,
    }
  }
})
