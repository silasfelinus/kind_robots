// /server/api/model-builder/runs/[id].get.ts
import { defineEventHandler } from 'h3'
import prisma from '~/server/utils/prisma'
import { errorHandler } from '~/server/utils/error'
import { requireApiUser } from '~/server/utils/authGuard'
import { assertRunAccess, getRunId, runInclude } from './index'

export default defineEventHandler(async (event) => {
  try {
    const id = getRunId(event)
    const auth = await requireApiUser(event)

    const run = await prisma.modelBuildRun.findUnique({
      where: { id },
      include: runInclude,
    })

    if (!run) {
      event.node.res.statusCode = 404
      return { success: false, message: 'Build run not found.', statusCode: 404 }
    }

    assertRunAccess(run, auth.user)

    event.node.res.statusCode = 200
    return {
      success: true,
      message: 'Build run fetched successfully.',
      data: run,
      statusCode: 200,
    }
  } catch (error: unknown) {
    const handled = errorHandler(error)
    const statusCode = handled.statusCode ?? 500
    event.node.res.statusCode = statusCode
    return { ...handled, statusCode }
  }
})
