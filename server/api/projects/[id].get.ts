// /server/api/projects/[id].get.ts
import { createError, defineEventHandler, getHeader, getRouterParam } from 'h3'
import prisma from '~/server/utils/prisma'
import { errorHandler } from '~/server/utils/error'
import { validateApiKey } from '~/server/utils/validateKey'
import { projectInclude } from './index'
import { userIsAdmin } from '../../utils/authUser'
import { canView } from '~/server/utils/contentAccess'

export default defineEventHandler(async (event) => {
  try {
    const key = getRouterParam(event, 'id')?.trim()
    if (!key)
      throw createError({
        statusCode: 400,
        message: 'Project ID or slug is required.',
      })

    const id = Number(key)
    const project = await prisma.project.findFirst({
      where:
        Number.isInteger(id) && id > 0
          ? { id }
          : { OR: [{ slug: key }, { conductorSlug: key }] },
      include: projectInclude,
    })

    if (!project)
      throw createError({ statusCode: 404, message: 'Project not found.' })

    let userId: number | null = null
    let isAdmin = false
    if (getHeader(event, 'authorization')?.startsWith('Bearer ')) {
      try {
        const auth = await validateApiKey(event)
        if (auth.isValid && auth.user) {
          userId = auth.user.id
          isAdmin = userIsAdmin(auth.user)
        }
      } catch {
        // Invalid/expired token on an otherwise-optional auth header: fall
        // back to anonymous access rather than failing the request.
      }
    }

    // canView() itself covers owner/admin/grant; `isPublic` here carries the
    // project's own extra visibility conditions (active + public + not
    // mature) so a Grant recipient of an otherwise-private/mature/inactive
    // project can still view it — same formula the Grant-sharing pitch
    // (kind-robots/t-062, SHARING-SPEC.md) uses everywhere else.
    const allowed = await canView(
      {
        id: project.id,
        userId: project.userId,
        isPublic: project.isActive && project.isPublic && !project.isMature,
      },
      'PROJECT',
      userId ? { id: userId, isAdmin } : null,
    )

    if (!allowed) {
      throw createError({
        statusCode: 403,
        message: 'You do not have permission to view this Project.',
      })
    }

    event.node.res.statusCode = 200
    return {
      success: true,
      message: 'Project fetched successfully.',
      data: project,
      statusCode: 200,
    }
  } catch (error: unknown) {
    const handled = errorHandler(error)
    const statusCode = handled.statusCode ?? 500
    event.node.res.statusCode = statusCode
    return { ...handled, statusCode }
  }
})
