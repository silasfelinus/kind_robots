import { createError, defineEventHandler, getRouterParam, readBody } from 'h3'
import { errorHandler } from '~/server/utils/error'
import {
  bibleCharacterKey,
  bibleEnqueueBodies,
  parseRequests,
  requireMonstriqueStudio,
  type BibleRequestRecord,
} from '~/server/utils/monstriqueBible'
import prisma from '~/server/utils/prisma'
import {
  BIBLE_ART_KINDS,
  type BibleArtKind,
} from '~/utils/monstrique/bibleLanes'

type EnqueueResponse = {
  success?: boolean
  message?: string
  data?: { jobId?: number }
}

export default defineEventHandler(async (event) => {
  try {
    const auth = await requireMonstriqueStudio(event)
    const characterKey = bibleCharacterKey(getRouterParam(event, 'key'))
    const body = ((await readBody(event)) ?? {}) as {
      kind?: unknown
      lanes?: unknown
    }
    const kind = BIBLE_ART_KINDS.find((entry) => entry.id === body.kind)?.id
    if (!kind)
      throw createError({ statusCode: 400, statusMessage: 'Unknown art kind.' })
    const lanes = Array.isArray(body.lanes)
      ? body.lanes.filter((lane): lane is string => typeof lane === 'string')
      : []
    const existing = await prisma.monstriqueBibleEntry.findUnique({
      where: { characterKey },
    })
    const requests = bibleEnqueueBodies(
      characterKey,
      kind as BibleArtKind,
      lanes,
      existing?.displayName,
    )
    const queued: BibleRequestRecord[] = []
    for (const request of requests) {
      const response = await event.$fetch<EnqueueResponse, string>(
        '/api/art/enqueue',
        { method: 'POST', body: request.body },
      )
      const jobId = Number(response?.data?.jobId)
      if (response?.success && Number.isInteger(jobId) && jobId > 0)
        queued.push({ jobId, kind, lane: request.lane })
    }
    if (!queued.length)
      throw createError({
        statusCode: 502,
        statusMessage: 'The art queue did not accept the request.',
      })
    const merged = JSON.stringify([
      ...parseRequests(existing?.requests),
      ...queued,
    ])
    await prisma.monstriqueBibleEntry.upsert({
      where: { characterKey },
      create: {
        characterKey,
        requests: merged,
        updatedBy: auth.user.id,
        ...(kind === 'lora-dataset' ? { loraStatus: 'dataset-requested' } : {}),
      },
      update: {
        requests: merged,
        updatedBy: auth.user.id,
        ...(kind === 'lora-dataset' ? { loraStatus: 'dataset-requested' } : {}),
      },
    })
    return {
      success: true,
      message: `Queued ${queued.length} of ${requests.length} renders.`,
      data: { queued },
    }
  } catch (error) {
    const handled = errorHandler(error)
    event.node.res.statusCode = handled.statusCode || 500
    return { success: false, message: handled.message }
  }
})
