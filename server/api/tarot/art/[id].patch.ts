// PATCH /api/tarot/art/:id
//
// Records the ArtJob a TarotArt row was enqueued as, marks an enqueue
// failure, or rejects a rendered variant. Rendered state only ever comes from
// /api/tarot/art/sync reading the ArtJob itself.
import { createError, defineEventHandler, getRouterParam, readBody } from 'h3'
import prisma from '~/server/utils/prisma'
import { requireAdminApiUser } from '~/server/utils/authGuard'
import { errorHandler } from '~/server/utils/error'
import { artRequestKeyFingerprint } from '~/server/utils/artRequestKey'
import { tarotArtRequestKey } from '~/utils/tarotStudio'

export default defineEventHandler(async (event) => {
  try {
    await requireAdminApiUser(event)
    const id = Number(getRouterParam(event, 'id'))
    if (!Number.isSafeInteger(id) || id < 1) {
      throw createError({ statusCode: 400, message: 'Invalid art id.' })
    }
    const art = await prisma.tarotArt.findUnique({ where: { id } })
    if (!art) throw createError({ statusCode: 404, message: 'Art not found.' })
    const body = (await readBody<Record<string, unknown>>(event)) ?? {}

    if ('artJobId' in body) {
      const jobId = Number(body.artJobId)
      if (!Number.isSafeInteger(jobId) || jobId < 1) {
        throw createError({ statusCode: 400, message: 'Invalid ArtJob id.' })
      }
      const job = await prisma.artJob.findUnique({
        where: { id: jobId },
        select: { id: true, attemptFingerprint: true },
      })
      const expected = artRequestKeyFingerprint(tarotArtRequestKey(id))
      if (!job || job.attemptFingerprint !== expected) {
        throw createError({
          statusCode: 409,
          message: 'That ArtJob was not enqueued for this tarot art.',
        })
      }
      const updated = await prisma.tarotArt.update({
        where: { id },
        data: {
          artJobId: jobId,
          status: art.status === 'PENDING' ? 'QUEUED' : art.status,
        },
      })
      return {
        success: true,
        statusCode: 200,
        message: 'Queued.',
        data: updated,
      }
    }

    if (body.status === 'FAILED') {
      if (art.status !== 'PENDING') {
        throw createError({
          statusCode: 409,
          message: 'Only art that never reached the queue can be failed here.',
        })
      }
      const error =
        typeof body.error === 'string'
          ? body.error.slice(0, 2000)
          : 'Enqueue failed.'
      const updated = await prisma.tarotArt.update({
        where: { id },
        data: { status: 'FAILED', error },
      })
      return { success: true, statusCode: 200, message: error, data: updated }
    }

    if (body.status === 'REJECTED' || body.status === 'RENDERED') {
      const allowed =
        body.status === 'REJECTED'
          ? art.status === 'RENDERED'
          : art.status === 'REJECTED' && art.artImageId !== null
      if (!allowed) {
        throw createError({
          statusCode: 409,
          message: 'Invalid art transition.',
        })
      }
      const updated = await prisma.tarotArt.update({
        where: { id },
        data: { status: body.status },
      })
      return {
        success: true,
        statusCode: 200,
        message: 'Saved.',
        data: updated,
      }
    }

    throw createError({ statusCode: 400, message: 'Nothing to update.' })
  } catch (error) {
    const handled = errorHandler(error)
    event.node.res.statusCode = handled.statusCode || 500
    return handled
  }
})
