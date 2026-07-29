// /server/api/projects/[id]/art/index.get.ts
import {
  createError,
  defineEventHandler,
  getHeader,
} from 'h3'
import prisma from '~/server/utils/prisma'
import { errorHandler } from '~/server/utils/error'
import { validateApiKey } from '~/server/utils/validateKey'
import { getProjectId } from '../../index'

export default defineEventHandler(async (event) => {
  try {
    const id = getProjectId(event)
    const project = await prisma.project.findUnique({
      where: { id },
      select: {
        id: true,
        userId: true,
        isActive: true,
        isPublic: true,
        isMature: true,
        ArtImageLinks: {
          orderBy: { createdAt: 'desc' },
          take: 40,
          select: {
            createdAt: true,
            ArtImage: {
              select: {
                id: true,
                imagePath: true,
                path: true,
                fileName: true,
                fileType: true,
                isActive: true,
              },
            },
          },
        },
      },
    })

    if (!project) {
      throw createError({ statusCode: 404, message: 'Project not found.' })
    }

    let mayView =
      project.isActive && project.isPublic && project.isMature !== true
    if (!mayView && getHeader(event, 'authorization')?.startsWith('Bearer ')) {
      try {
        const auth = await validateApiKey(event)
        mayView = Boolean(
          auth.isValid &&
            auth.user &&
            (auth.user.Role === 'ADMIN' || auth.user.id === project.userId),
        )
      } catch {
        mayView = false
      }
    }

    if (!mayView) {
      throw createError({ statusCode: 403, message: 'You cannot view this project art.' })
    }

    return {
      success: true,
      data: project.ArtImageLinks.filter(
        (link) => link.ArtImage.isActive !== false,
      ),
      statusCode: 200,
    }
  } catch (error: unknown) {
    const handled = errorHandler(error)
    event.node.res.statusCode = handled.statusCode || 500
    return {
      success: false,
      data: [],
      statusCode: handled.statusCode || 500,
      message: handled.message || 'Failed to load project art.',
    }
  }
})
