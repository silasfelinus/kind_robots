import { createError, defineEventHandler, getRouterParam } from 'h3'
import prisma from '../../../../utils/prisma'
import { errorHandler } from '../../../../utils/error'
import { requireScopedApiUser } from '../../../../utils/authGuard'
import { authAndGate } from '../../../../utils/comfyGate'
import { prepareArtJobRetryPayload } from '../../../../utils/artJobRetry'
import { serializeArtJobPayload } from '../../../../utils/artJobPayload'
import { videoGeneratorMetadata } from '../../../../utils/videoGeneratorJobs'

export default defineEventHandler(async (event) => {
  try {
    const auth = await requireScopedApiUser(event, 'generation:art')
    const id = Number(getRouterParam(event, 'id'))
    if (!Number.isSafeInteger(id) || id < 1) {
      throw createError({ statusCode: 400, message: 'Invalid video job ID.' })
    }
    const source = await prisma.artJob.findFirst({
      where: { id, userId: auth.user.id },
    })
    const metadata = source && videoGeneratorMetadata(source)
    if (!source || !metadata) {
      throw createError({ statusCode: 404, message: 'Video job not found.' })
    }
    if (source.status === 'PENDING' || source.status === 'RUNNING') {
      throw createError({
        statusCode: 409,
        message: 'This render is still active. Resubmit after it finishes.',
      })
    }
    const { video, model } = metadata
    const frames = Number(video.frames)
    const width = Number(video.width)
    const height = Number(video.height)
    if (
      !Number.isFinite(frames) || frames < 1 ||
      !Number.isFinite(width) || width < 64 ||
      !Number.isFinite(height) || height < 64
    ) {
      throw createError({
        statusCode: 422,
        message: 'This older job is missing render settings and cannot be resubmitted.',
      })
    }
    const payload = prepareArtJobRetryPayload(
      source.payload,
      source.id,
      source.artImageId,
      'NEW_OUTPUT',
      true,
    )
    if (!Array.isArray(payload.images) || !payload.images.length) {
      throw createError({
        statusCode: 422,
        message: 'The saved source frame is missing. Upload the image again.',
      })
    }
    delete payload.attemptFingerprint

    const gate = await authAndGate(event, {
      engine: model,
      frames,
      width,
      height,
    })
    const created = await prisma.artJob.create({
      data: {
        engine: source.engine,
        payload: serializeArtJobPayload(payload),
        priority: source.priority,
        projectSlug: 'video-generator',
        userId: auth.user.id,
      },
    })
    const { balance } = await gate.commit(`art-enqueue:${created.id}`)
    event.node.res.statusCode = 201
    return {
      success: true,
      statusCode: 201,
      message: 'A new render was queued using the saved source and settings.',
      data: {
        jobId: created.id,
        mana: { charged: gate.cost, balance },
      },
    }
  } catch (error: unknown) {
    const handled = errorHandler(error)
    event.node.res.statusCode = handled.statusCode || 500
    return {
      success: false,
      statusCode: event.node.res.statusCode,
      message: handled.message || 'Unable to resubmit video job.',
    }
  }
})
