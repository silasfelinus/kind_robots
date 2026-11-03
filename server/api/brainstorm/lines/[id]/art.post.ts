import {
  createError,
  defineEventHandler,
  getRouterParam,
  setResponseStatus,
} from 'h3'
import prisma from '~/server/utils/prisma'
import { errorHandler } from '~/server/utils/error'
import { getOptionalAuthUser } from '~/server/utils/serverApi'
import {
  canSeeRiff,
  enqueueLineArt,
  parsePositiveId,
  requirePlayer,
} from '~/server/utils/brainstorm/riffBoard'

const ACTIVE_OR_DONE = new Set(['PENDING', 'RUNNING', 'DONE'])

export default defineEventHandler(async (event) => {
  try {
    const lineId = parsePositiveId(getRouterParam(event, 'id'), 'line id')
    const user = requirePlayer(await getOptionalAuthUser(event))
    const line = await prisma.brainstormLine.findUnique({
      where: { id: lineId },
      select: {
        id: true,
        text: true,
        artJobId: true,
        artImageId: true,
        Riff: {
          select: {
            id: true,
            title: true,
            flavor: true,
            stem: true,
            isPublic: true,
            userId: true,
          },
        },
      },
    })
    if (!line || !canSeeRiff(line.Riff, user)) {
      throw createError({ statusCode: 404, message: 'That line is gone.' })
    }
    if (line.artImageId) {
      return {
        success: true,
        message: 'Already painted.',
        data: { artJobId: line.artJobId },
      }
    }
    if (line.artJobId) {
      const job = await prisma.artJob.findUnique({
        where: { id: line.artJobId },
        select: { status: true },
      })
      if (job && ACTIVE_OR_DONE.has(job.status)) {
        return {
          success: true,
          message: 'Already painting.',
          data: { artJobId: line.artJobId },
        }
      }
    }

    const art = await enqueueLineArt(event, line.Riff, line)
    if (!art.jobId) {
      throw createError({
        statusCode: 502,
        message: art.message || 'Art did not queue.',
      })
    }
    return {
      success: true,
      message: 'Painting it now.',
      data: { artJobId: art.jobId },
    }
  } catch (error) {
    const handled = errorHandler(error)
    setResponseStatus(event, handled.statusCode || 500)
    return {
      success: false,
      statusCode: handled.statusCode || 500,
      message: handled.message || 'Could not queue art for that line.',
    }
  }
})
