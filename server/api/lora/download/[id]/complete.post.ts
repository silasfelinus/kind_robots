// /server/api/lora/download/[id]/complete.post.ts
//
// The import agent reports a claimed download's outcome. On success it has
// dropped the file into Lora/import (where the watcher catalogs + Resources
// it); it passes back the resulting resourceId when known. On failure the row
// is marked FAILED with the error, and — if attempts remain — the claim reaper
// in claim.post.ts will let it be retried.
import {
  createError,
  defineEventHandler,
  getRouterParam,
  readBody,
} from 'h3'
import prisma from '../../../../utils/prisma'
import { errorHandler } from '../../../../utils/error'
import { requireMachineUser } from '../../../../utils/authGuard'

type CompleteBody = {
  success?: boolean
  resourceId?: number | null
  error?: string | null
}

export default defineEventHandler(async (event) => {
  try {
    const auth = await requireMachineUser(event)

    if (!auth.isAdmin && !auth.isServerKey) {
      throw createError({
        statusCode: 403,
        message: 'Admin access required to complete downloads.',
      })
    }

    const id = Number(getRouterParam(event, 'id'))
    if (!Number.isInteger(id) || id <= 0) {
      throw createError({ statusCode: 400, message: 'Invalid download id.' })
    }

    const existing = await prisma.downloadRequest.findUnique({ where: { id } })
    if (!existing) {
      throw createError({ statusCode: 404, message: 'Download not found.' })
    }

    const body = (await readBody<CompleteBody>(event).catch(
      () => null,
    )) as CompleteBody | null

    const ok = body?.success !== false
    const resourceId =
      Number.isInteger(Number(body?.resourceId)) && Number(body?.resourceId) > 0
        ? Number(body?.resourceId)
        : null
    const errorText =
      typeof body?.error === 'string' ? body.error.slice(0, 4000) : null

    const request = await prisma.downloadRequest.update({
      where: { id },
      data: ok
        ? {
            status: 'DONE',
            resourceId,
            error: null,
            claimedAt: null,
          }
        : {
            status: 'FAILED',
            error: errorText || 'Download failed.',
            claimedAt: null,
            claimedBy: null,
          },
    })

    return {
      success: true,
      message: ok ? 'Download completed.' : 'Download marked failed.',
      data: { request },
      statusCode: 200,
    }
  } catch (error) {
    const handled = errorHandler(error)
    const statusCode = handled.statusCode || 500
    event.node.res.statusCode = statusCode

    return {
      success: false,
      message: handled.message || 'Failed to complete download.',
      statusCode,
    }
  }
})
