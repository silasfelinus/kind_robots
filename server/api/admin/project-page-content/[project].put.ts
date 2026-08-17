import {
  createError,
  defineEventHandler,
  getQuery,
  getRouterParam,
  readBody,
} from 'h3'
import prisma from '~/server/utils/prisma'
import { errorHandler } from '~/server/utils/error'
import { requireAdminApiUser } from '~/server/utils/authGuard'
import {
  normalizeProjectPageContent,
  normalizeProjectPageKey,
  resolveProjectPageProject,
} from '~/server/utils/projectPageContent'

type ProjectPageContentBody = {
  content?: unknown
}

export default defineEventHandler(async (event) => {
  try {
    const auth = await requireAdminApiUser(event)

    const projectKey = getRouterParam(event, 'project')?.trim()
    if (!projectKey) {
      throw createError({ statusCode: 400, message: 'Project key is required.' })
    }

    const pageKey = normalizeProjectPageKey(getQuery(event).page)
    const body = await readBody<ProjectPageContentBody>(event)
    const content = normalizeProjectPageContent(body?.content)
    const project = await resolveProjectPageProject(projectKey)

    const page = await prisma.projectPageContent.upsert({
      where: {
        projectId_pageKey: {
          projectId: project.id,
          pageKey,
        },
      },
      create: {
        projectId: project.id,
        pageKey,
        content,
        updatedById: auth.user.id,
      },
      update: {
        content,
        updatedById: auth.user.id,
      },
    })

    event.node.res.statusCode = 200
    return {
      success: true,
      message: 'Project page content saved.',
      data: {
        projectId: project.id,
        projectKey: project.conductorSlug || project.slug || String(project.id),
        pageKey,
        content: page.content,
        updatedAt: page.updatedAt?.toISOString() ?? null,
        updatedById: page.updatedById ?? null,
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
