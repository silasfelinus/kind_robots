// /server/api/conductor/project-art-complete.post.ts
import { createError, defineEventHandler, readBody } from 'h3'
import type { Prisma } from '~/prisma/generated/prisma/client'
import prisma from '~/server/utils/prisma'
import { errorHandler } from '~/server/utils/error'
import { requireMachineUser } from '~/server/utils/authGuard'
import { normalizeKindRobotsImagePath } from '~/server/utils/artJobNormalization'

const KIND_ROBOTS_REPO = 'silasfelinus/kind_robots'
const CONDUCTOR_REPO = 'silasfelinus/conductor'
const PROJECT_FIELDS = new Set(['imagePath', 'cardPath', 'heroPath'])

type ProjectArtCompleteBody = {
  projectId?: number | null
  projectSlug?: string | null
  projectField?: string | null
  variant?: string | null
  targetRepo?: string | null
  imagePath?: string | null
  sourceUrl?: string | null
  artImageId?: number | null
}

function clean(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

function projectField(
  body: ProjectArtCompleteBody,
): 'imagePath' | 'cardPath' | 'heroPath' {
  const explicit = clean(body.projectField)
  if (PROJECT_FIELDS.has(explicit)) {
    return explicit as 'imagePath' | 'cardPath' | 'heroPath'
  }

  const variant = clean(body.variant).toLowerCase()
  if (variant === 'icon') return 'imagePath'
  if (variant === 'card') return 'cardPath'
  if (variant === 'hero') return 'heroPath'
  throw createError({
    statusCode: 400,
    message: 'Invalid project cover field.',
  })
}

function assetPath(body: ProjectArtCompleteBody): string {
  const targetRepo = clean(body.targetRepo)
  const imagePath = clean(body.imagePath)
  const sourceUrl = clean(body.sourceUrl)

  if (targetRepo === KIND_ROBOTS_REPO) {
    return `/${normalizeKindRobotsImagePath(imagePath).replace(/^public\//, '')}`
  }

  if (targetRepo === CONDUCTOR_REPO) {
    if (sourceUrl) return sourceUrl
    const path = imagePath.replace(/^\/+/, '')
    return `https://raw.githubusercontent.com/silasfelinus/conductor/main/${path}`
  }

  const value = sourceUrl || imagePath
  if (!value) {
    throw createError({
      statusCode: 400,
      message: 'Missing completed image path.',
    })
  }
  return value
}

export default defineEventHandler(async (event) => {
  try {
    const auth = await requireMachineUser(event)
    if (!auth.isAdmin && !auth.isServerKey) {
      throw createError({ statusCode: 403, message: 'Admin access required.' })
    }

    const body = (await readBody<ProjectArtCompleteBody>(event)) || {}
    const id = Number(body.projectId)
    const slug = clean(body.projectSlug)
    const artImageId = Number(body.artImageId)

    if ((!Number.isInteger(id) || id <= 0) && !slug) {
      throw createError({
        statusCode: 400,
        message: 'Missing project identity.',
      })
    }
    if (!Number.isInteger(artImageId) || artImageId <= 0) {
      throw createError({ statusCode: 400, message: 'Invalid ArtImage id.' })
    }

    const project = await prisma.project.findFirst({
      where:
        Number.isInteger(id) && id > 0
          ? { id }
          : { OR: [{ slug }, { conductorSlug: slug }] },
    })
    if (!project) {
      throw createError({
        statusCode: 404,
        message: `Project ${slug || id} not found.`,
      })
    }

    const image = await prisma.artImage.findUnique({
      where: { id: artImageId },
    })
    if (!image) {
      throw createError({
        statusCode: 404,
        message: `ArtImage ${artImageId} not found.`,
      })
    }

    const field = projectField(body)
    const path = assetPath(body)
    const artImageField = field === 'imagePath' ? 'iconPath' : field
    const shouldAttachPrimaryImage =
      field === 'imagePath' || !project.artImageId

    const updated = await prisma.$transaction(async (tx) => {
      await tx.artImage.update({
        where: { id: artImageId },
        data: { [artImageField]: path } as Prisma.ArtImageUncheckedUpdateInput,
      })

      return tx.project.update({
        where: { id: project.id },
        data: {
          [field]: path,
          ...(shouldAttachPrimaryImage ? { artImageId } : {}),
        } as Prisma.ProjectUncheckedUpdateInput,
      })
    })

    event.node.res.statusCode = 200
    return {
      success: true,
      message: `Project ${updated.slug || updated.id} ${field} synchronized.`,
      data: { project: updated, field, path, artImageId },
      statusCode: 200,
    }
  } catch (error: unknown) {
    const handled = errorHandler(error)
    const statusCode = handled.statusCode || 500
    event.node.res.statusCode = statusCode
    return { ...handled, statusCode }
  }
})
