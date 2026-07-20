// /server/api/projects/[id].delete.ts
import { defineEventHandler } from 'h3'
import prisma from '~/server/utils/prisma'
import { errorHandler } from '~/server/utils/error'
import { requireApiUser } from '~/server/utils/authGuard'
import { assertProjectAccess, getProjectId } from './index'
import { projectMutationSelect } from './selects'

export default defineEventHandler(async (event) => {
  try {
    const id = getProjectId(event)
    const auth = await requireApiUser(event)
    const existing = await prisma.project.findUnique({ where: { id } })

    if (!existing) {
      event.node.res.statusCode = 404
      return { success: false, message: 'Project not found.', statusCode: 404 }
    }

    assertProjectAccess(existing, auth.user)
    const project = await prisma.project.update({
      where: { id },
      data: { isActive: false, status: 'ARCHIVED' },
      select: projectMutationSelect,
    })

    event.node.res.statusCode = 200
    return {
      success: true,
      message: 'Project archived successfully.',
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
