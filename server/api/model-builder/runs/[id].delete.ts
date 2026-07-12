// /server/api/model-builder/runs/[id].delete.ts
import { defineEventHandler } from 'h3'
import prisma from '~/server/utils/prisma'
import { errorHandler } from '~/server/utils/error'
import { requireApiUser } from '~/server/utils/authGuard'
import { assertRunAccess, getRunId } from './index'

export default defineEventHandler(async (event) => {
  try {
    const id = getRunId(event)
    const auth = await requireApiUser(event)

    const existing = await prisma.modelBuildRun.findUnique({
      where: { id },
      select: { id: true, userId: true },
    })
    if (!existing) {
      event.node.res.statusCode = 404
      return { success: false, message: 'Build run not found.', statusCode: 404 }
    }
    assertRunAccess(existing, auth.user)

    // Hard delete — items, artifacts, and revisions cascade. Build runs are
    // disposable scratch state, not canonical records.
    await prisma.modelBuildRun.delete({ where: { id } })

    event.node.res.statusCode = 200
    return {
      success: true,
      message: 'Build run deleted successfully.',
      data: { id },
      statusCode: 200,
    }
  } catch (error: unknown) {
    const handled = errorHandler(error)
    const statusCode = handled.statusCode ?? 500
    event.node.res.statusCode = statusCode
    return { ...handled, statusCode }
  }
})
