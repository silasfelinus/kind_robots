// /server/api/model-builder/runs/[id].patch.ts
import { defineEventHandler, readBody } from 'h3'
import type { ModelBuildStatus, Prisma } from '~/prisma/generated/prisma/client'
import prisma from '~/server/utils/prisma'
import { errorHandler } from '~/server/utils/error'
import { requireApiUser } from '~/server/utils/authGuard'
import {
  assertRunAccess,
  assertRunWritable,
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
      select: { id: true, userId: true, status: true },
    })
    if (!existing) {
      event.node.res.statusCode = 404
      return {
        success: false,
        message: 'Build run not found.',
        statusCode: 404,
      }
    }
    // Defense-in-depth (model-builder/t-029 kaizen, deferred twice before this
    // cycle): the client only ever sends {status: 'CANCELLED'} through this
    // route today, which is why a missing check here was never a *live*
    // exploit -- but this is the run's own status route, the natural place a
    // future "resume" feature would land a status write, and every other
    // write-capable model-builder route already refuses once the run is
    // CANCELLED. Checking existing.status (read before this update, not the
    // value the client is trying to set) means the CANCEL action itself still
    // succeeds -- it only blocks writes to a run that is *already* CANCELLED.
    assertRunAccess(existing, auth.user)
    assertRunWritable(existing)

    const body = await readBody<RunPatchBody>(event)
    const data: Prisma.ModelBuildRunUncheckedUpdateInput = {}

    if (modelBuildStatuses.has(body.status as ModelBuildStatus)) {
      const status = body.status as ModelBuildStatus
      data.status = status
      if (status === 'CANCELLED') data.cancelledAt = new Date()
    }
    if (body.sourceLabel !== undefined)
      // sourceLabel is `@db.VarChar(255)` (prisma/model-builder.prisma). The
      // run CREATE route (runs/index.post.ts) already truncates it to 255
      // chars, but this route -- the only other place a client can set it --
      // called normalizeText with no cap at all (model-builder/t-029, cycle
      // 45): a value over 255 chars reached Prisma unchecked and MySQL
      // would reject the write with a raw "Data too long for column" error
      // (strict mode; a silent truncation otherwise), an opaque 500 instead
      // of a clean 400.
      data.sourceLabel = normalizeText(body.sourceLabel, {
        maxLength: 255,
        field: 'Source label',
      })
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
