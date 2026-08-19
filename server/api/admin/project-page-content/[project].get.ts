import {
  createError,
  defineEventHandler,
  getQuery,
  getRouterParam,
} from 'h3'
import prisma from '~/server/utils/prisma'
import { errorHandler } from '~/server/utils/error'
import { requireAdminApiUser } from '~/server/utils/authGuard'
import {
  normalizeProjectPageKey,
  resolveProjectPageProject,
} from '~/server/utils/projectPageContent'

export default defineEventHandler(async (event) => {
  try {
    await requireAdminApiUser(event)

    const projectKey = getRouterParam(event, 'project')?.trim()
    if (!projectKey) {
      throw createError({ statusCode: 400, message: 'Project key is required.' })
    }

    const pageKey = normalizeProjectPageKey(getQuery(event).page)
    const project = await resolveProjectPageProject(projectKey)
    const page = await prisma.projectPageContent.findUnique({
      where: {
        projectId_pageKey: {
          projectId: project.id,
          pageKey,
        },
      },
    })

    event.node.res.statusCode = 200
    return {
      success: true,
      message: page ? 'Project page content fetched.' : 'Project page has no saved content yet.',
      data: {
        projectId: project.id,
        projectKey: project.conductorSlug || project.slug || String(project.id),
        pageKey,
        content: page?.content ?? null,
        updatedAt: page?.updatedAt?.toISOString() ?? null,
        updatedById: page?.updatedById ?? null,
      },
      statusCode: 200,
    }
  } catch (error: unknown) {
    const handled = errorHandler(error)
    const statusCode = handled.statusCode ?? 500
    event.node.res.statusCode = statusCode
    return { ...handled, statusCode }
  }
})
