import {
  createError,
  defineEventHandler,
  getRouterParam,
} from 'h3'
import { requireApiUser } from '../../../../utils/authGuard'
import { errorHandler } from '../../../../utils/error'
import { prisma } from '../../../../utils/prisma'
import {
  reconcileRequestedCardArt,
  requestedCardPublicDataEnriched,
} from '../../../../utils/mandarinRequestedCards'

type ArtEnqueueResponse = {
  success?: boolean
  message?: string
  data?: {
    jobId?: number
    status?: string
    deduplicated?: boolean
  }
}

async function tagJob(input: {
  jobId: number
  userId: number
  cardId: number
  artPromptVersion: string
}): Promise<void> {
  const job = await prisma.artJob.findUnique({
    where: { id: input.jobId },
    select: { userId: true, payload: true },
  })
  if (!job || job.userId !== input.userId) return

  let payload: Record<string, unknown>
  try {
    payload = JSON.parse(job.payload) as Record<string, unknown>
  } catch {
    return
  }

  await prisma.artJob.update({
    where: { id: input.jobId },
    data: {
      payload: JSON.stringify({
        ...payload,
        mandarinContext: {
          product: 'mandarin',
          cardId: input.cardId,
          artPromptVersion: input.artPromptVersion,
          dedupeKey: `mandarin:${input.cardId}:${input.artPromptVersion}`,
        },
      }),
    },
  })
}

export default defineEventHandler(async (event) => {
  try {
    const auth = await requireApiUser(event)
    const id = Number(getRouterParam(event, 'id'))
    if (!Number.isInteger(id) || id <= 0) {
      throw createError({ statusCode: 400, message: 'Invalid requested-card ID.' })
    }

    const row = await prisma.mandarinRequestedCard.findFirst({
      where: {
        id,
        userId: auth.user.id,
        isActive: true,
      },
    })
    if (!row) {
      throw createError({ statusCode: 404, message: 'Requested Mandarin card not found.' })
    }

    const reconciled = await reconcileRequestedCardArt(row)
    if (reconciled.artImageId) {
      return {
        success: true,
        statusCode: 200,
        message: 'Requested-card illustration is already complete.',
        data: await requestedCardPublicDataEnriched(reconciled),
      }
    }

    if (reconciled.artJobId) {
      const existingJob = await prisma.artJob.findUnique({
        where: { id: reconciled.artJobId },
        select: { userId: true, status: true },
      })
      if (
        existingJob?.userId === auth.user.id &&
        (existingJob.status === 'PENDING' || existingJob.status === 'RUNNING')
      ) {
        return {
          success: true,
          statusCode: 200,
          message: 'Requested-card illustration is already queued.',
          data: await requestedCardPublicDataEnriched(reconciled),
        }
      }
    }

    const art = await event.$fetch<ArtEnqueueResponse, string>('/api/art/enqueue', {
      method: 'POST',
      body: {
        engine: 'krea2',
        promptString: reconciled.artPrompt,
        projectSlug: 'mandarin-tutor',
        width: 768,
        height: 768,
        isPublic: false,
        isMature: false,
        designer: `mandarin-request:${reconciled.id}`,
      },
    })

    const jobId = Number(art.data?.jobId)
    if (!art.success || !Number.isInteger(jobId) || jobId <= 0) {
      throw createError({
        statusCode: 502,
        message: art.message || 'Krea2 did not return a valid ArtJob.',
      })
    }

    await tagJob({
      jobId,
      userId: auth.user.id,
      cardId: reconciled.id,
      artPromptVersion: reconciled.artPromptVersion,
    })
    const updated = await prisma.mandarinRequestedCard.update({
      where: { id: reconciled.id },
      data: {
        artJobId: jobId,
        artImageId: null,
      },
    })

    event.node.res.statusCode = 201
    return {
      success: true,
      statusCode: 201,
      message: 'Requested-card illustration queued.',
      data: await requestedCardPublicDataEnriched(updated),
    }
  } catch (error) {
    const handled = errorHandler(error)
    event.node.res.statusCode = handled.statusCode || 500
    return {
      success: false,
      statusCode: handled.statusCode || 500,
      message: handled.message || 'Failed to queue requested-card illustration.',
    }
  }
})
