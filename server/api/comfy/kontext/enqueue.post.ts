// /server/api/comfy/kontext/enqueue.post.ts
//
// Queue-based Flux Kontext generation. The direct route (generate.post.ts)
// dials the Comfy server from this backend, which fails in production: the
// deployed backend is not on the home tailnet (ENOTFOUND on ts.net names).
// This route instead enqueues a durable ArtJob that the home relay agent
// (conductor ops/home-server/relay_agent.py) claims outward, runs against
// its local Comfy, uploads via save-generated, and completes. Poll the job
// at /api/art/queue/:id until DONE, then load the ArtImage by artImageId.
//
// The job payload carries a `save` block (isPublic/isMature/designer). The
// complete endpoint applies it — plus ownership by the enqueuing user — to
// the uploaded ArtImage, since the relay uploads as its own machine user.
import { createError, defineEventHandler, readBody } from 'h3'
import prisma from '../../../utils/prisma'
import { errorHandler } from '../../../utils/error'
import { authAndGate } from '../../../utils/comfyGate'
import {
  buildKontextWorkflow,
  getKontextImageExtension,
} from './utils/workflow'
import type { Prisma } from '~/prisma/generated/prisma/client'

type KontextEnqueueRequest = {
  prompt?: string | null
  imageData?: string | null
  width?: number | null
  height?: number | null
  steps?: number | null
  guidance?: number | null
  seed?: number | null
  sampler?: string | null
  scheduler?: string | null
  denoise?: number | null
  isPublic?: boolean | null
  isMature?: boolean | null
  designer?: string | null
  filenamePrefix?: string | null
  priority?: number | null
}

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody<KontextEnqueueRequest>(event)

    const gate = await authAndGate(event, {
      engine: 'kontext',
      steps: body.steps,
      width: body.width,
      height: body.height,
      serverId: null,
    })

    const prompt = body.prompt?.trim()

    if (!prompt) {
      throw createError({
        statusCode: 400,
        message: 'Missing required field: prompt.',
      })
    }

    const imageData = body.imageData?.trim()

    if (!imageData) {
      throw createError({
        statusCode: 400,
        message: 'Missing required field: imageData.',
      })
    }

    const extension = getKontextImageExtension(imageData)
    const imageName = `kr_kontext_queue_${Date.now()}_${crypto.randomUUID()}.${extension}`

    const workflow = buildKontextWorkflow({
      prompt,
      imageName,
      width: body.width,
      height: body.height,
      steps: body.steps,
      guidance: body.guidance,
      seed: body.seed,
      sampler: body.sampler,
      scheduler: body.scheduler,
      denoise: body.denoise,
      filenamePrefix: body.filenamePrefix || 'kindrobots_kontext_queue',
    })
    // ComfyWorkflow's index signature doesn't structurally satisfy
    // Prisma.InputJsonValue, so cast at the boundary (same pattern as
    // /api/art/queue/index.post.ts). The shape is plain JSON.
    const payload = {
      workflow,
      promptString: prompt,
      images: [
        {
          name: imageName,
          imageData,
        },
      ],
      save: {
        isPublic: body.isPublic ?? false,
        isMature: body.isMature ?? false,
        designer: body.designer?.trim() || null,
      },
    }

    const job = await prisma.artJob.create({
      data: {
        engine: 'COMFY',
        priority: Number.isInteger(body.priority) ? Number(body.priority) : 5,
        userId: gate.user.id,
        payload: payload as unknown as Prisma.InputJsonValue,
      },
    })

    const { balance } = await gate.commit(`kontext-queue:${job.id}`)

    return {
      success: true,
      message: 'Kontext job queued. Poll /api/art/queue/:id until DONE.',
      statusCode: 201,
      data: {
        jobId: job.id,
        status: job.status,
        mana: {
          balance,
          charged: gate.cost,
        },
      },
    }
  } catch (error: unknown) {
    const handledError = errorHandler(error)
    event.node.res.statusCode = handledError.statusCode || 500

    return {
      success: false,
      statusCode: handledError.statusCode || 500,
      message: handledError.message || 'Failed to queue Kontext job.',
    }
  }
})
