// /server/api/projects/[key].get.ts
import { createError, defineEventHandler, getHeader, getRouterParam } from 'h3'
import prisma from '~/server/utils/prisma'
import { errorHandler } from '~/server/utils/error'
import { validateApiKey } from '~/server/utils/validateKey'
import { projectInclude } from './index'

export default defineEventHandler(async (event) => {
  try {
    const key = getRouterParam(event, 'key')?.trim()
    if (!key) throw createError({ statusCode: 400, message: 'Project ID or slug is required.' })

    const id = Number(key)
    const project = await prisma.project.findFirst({
      where: Number.isInteger(id) && id > 0
        ? { id }
        : { OR: [{ slug: key }, { conductorSlug: key }] },
      include: projectInclude,
    })

    if (!project) throw createError({ statusCode: 404, message: 'Project not found.' })

    let userId: number | null = null
    let isAdmin = false
    if (getHeader(event, 'authorization')?.startsWith('Bearer ')) {
      try {
        const auth = await validateApiKey(event)
        if (auth.isValid && auth.user) {
          userId = auth.user.id
          isAdmin = auth.user.Role === 'ADMIN'
        }
      } catch {}
    }

    if ((!project.isActive || !project.isPublic || project.isMature) && !isAdmin && project.userId !== userId) {
      throw createError({ statusCode: 403, message: 'You do not have permission to view this Project.' })
    }

    event.node.res.statusCode = 200
    return { success: true, message: 'Project fetched successfully.', data: project, statusCode: 200 }
  } catch (error: unknown) {
    const handled = errorHandler(error)
    const statusCode = handled.statusCode ?? 500
    event.node.res.statusCode = statusCode
    return { ...handled, statusCode }
  }
})
