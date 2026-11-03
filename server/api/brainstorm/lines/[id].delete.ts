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
  canModerateRiff,
  parsePositiveId,
  requirePlayer,
} from '~/server/utils/brainstorm/riffBoard'

export default defineEventHandler(async (event) => {
  try {
    const lineId = parsePositiveId(getRouterParam(event, 'id'), 'line id')
    const user = requirePlayer(await getOptionalAuthUser(event))
    const line = await prisma.brainstormLine.findUnique({
      where: { id: lineId },
      select: { id: true, userId: true, Riff: { select: { userId: true } } },
    })
    if (!line) {
      throw createError({ statusCode: 404, message: 'That line is gone.' })
    }
    const ownsLine = line.userId !== null && line.userId === user.id
    if (!ownsLine && !canModerateRiff(line.Riff, user)) {
      throw createError({
        statusCode: 403,
        message: 'Only its author or the riff host can remove it.',
      })
    }
    await prisma.brainstormLine.delete({ where: { id: lineId } })
    return { success: true, message: 'Line removed.', data: { lineId } }
  } catch (error) {
    const handled = errorHandler(error)
    setResponseStatus(event, handled.statusCode || 500)
    return {
      success: false,
      statusCode: handled.statusCode || 500,
      message: handled.message || 'Could not remove that line.',
    }
  }
})
