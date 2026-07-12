// /server/api/model-builder/runs/[id].patch.ts
import { defineEventHandler, readBody } from 'h3'
import type {
  ModelBuildStatus,
  Prisma,
} from '~/prisma/generated/prisma/client'
import prisma from '~/server/utils/prisma'
import { errorHandler } from '~/server/utils/error'
import { requireApiUser } from '~/server/utils/authGuard'
import {
  assertRunAccess,
  getRunId,
  modelBuildStatuses,
  normalizeJson,
  normalizeText,
  runInclude,
} from './index'

type RunPatchBody = {
  status?: unknown
  sourceLabel?: unknown
  selections?: unknown
  usageInfo?: unknown
}

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

    const body = await readBody<RunPatchBody>(event)
    const data: Prisma.ModelBuildRunUncheckedUpdateInput = {}

    if (modelBuildStatuses.has(body.status as ModelBuildStatus)) {
      const status = body.status as ModelBuildStatus
      data.status = status
      if (status === 'CANCELLED') data.cancelledAt = new Date()
    }
    if (body.sourceLabel !== undefined)
      data.sourceLabel = normalizeText(body.sourceLabel)
    const selections = normalizeJson(body.selections)
    if (selections !== undefined) data.selections = selections
    const usageInfo = normalizeJson(body.usageInfo)
    if (usageInfo !== undefined) data.usageInfo = usageInfo

    const run = await prisma.modelBuildRun.update({
      where: { id },
      data,
      include: runInclude,
    })

    event.node.res.statusCode = 200
    return {
      success: true,
      message: 'Build run updated successfully.',
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
