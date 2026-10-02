// /server/api/projects/[id]/art/index.get.ts
import { createError, defineEventHandler, getHeader } from 'h3'
import prisma from '~/server/utils/prisma'
import { errorHandler } from '~/server/utils/error'
import { validateApiKey } from '~/server/utils/validateKey'
import { getProjectId } from '../../index'
import { userIsAdmin } from '../../../../utils/authUser'
import { viewerShowsMature } from '../../../../utils/contentAccess'

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
                isMature: true,
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
    let viewerUser: Awaited<ReturnType<typeof validateApiKey>>['user']
    if (getHeader(event, 'authorization')?.startsWith('Bearer ')) {
      try {
        const auth = await validateApiKey(event)
        if (auth.isValid && auth.user) {
          viewerUser = auth.user
          mayView =
            mayView || userIsAdmin(auth.user) || auth.user.id === project.userId
        }
      } catch {
        viewerUser = undefined
      }
    }

    if (!mayView) {
      throw createError({
        statusCode: 403,
        message: 'You cannot view this project art.',
      })
    }

    return {
      success: true,
      data: project.ArtImageLinks.filter(
        (link) =>
          link.ArtImage.isActive !== false &&
          !(!viewerShowsMature(viewerUser) && link.ArtImage.isMature === true),
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
