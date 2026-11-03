import {
  createError,
  defineEventHandler,
  getRouterParam,
  readBody,
  setResponseStatus,
} from 'h3'
import prisma from '~/server/utils/prisma'
import { errorHandler } from '~/server/utils/error'
import { getOptionalAuthUser } from '~/server/utils/serverApi'
import {
  canSeeRiff,
  parsePositiveId,
  requirePlayer,
} from '~/server/utils/brainstorm/riffBoard'
import { isBrainstormLineReaction } from '~/utils/brainstormRiffs'

export default defineEventHandler(async (event) => {
  try {
    const lineId = parsePositiveId(getRouterParam(event, 'id'), 'line id')
    const user = requirePlayer(await getOptionalAuthUser(event))
    const body = ((await readBody<{ type?: unknown }>(event)) ?? {}) as {
      type?: unknown
    }
    const type = body.type
    if (!isBrainstormLineReaction(type)) {
      throw createError({
        statusCode: 400,
        message: 'Reaction must be LOVED, CLAPPED, BOOED or FLAGGED.',
      })
    }
    const line = await prisma.brainstormLine.findUnique({
      where: { id: lineId },
      select: {
        id: true,
        Riff: { select: { isPublic: true, userId: true } },
      },
    })
    if (!line || !canSeeRiff(line.Riff, user)) {
      throw createError({ statusCode: 404, message: 'That line is gone.' })
    }

    const existing = await prisma.reaction.findUnique({
      where: {
        userId_brainstormLineId: { userId: user.id, brainstormLineId: lineId },
      },
      select: { id: true, reactionType: true },
    })

    let myReaction: string | null = type
    if (existing && existing.reactionType === type) {
      await prisma.reaction.delete({ where: { id: existing.id } })
      myReaction = null
    } else if (existing) {
      await prisma.reaction.update({
        where: { id: existing.id },
        data: { reactionType: type },
      })
    } else {
      await prisma.reaction.create({
        data: {
          userId: user.id,
          reactionType: type,
          reactionCategory: 'BRAINSTORM_LINE',
          brainstormLineId: lineId,
        },
      })
    }

    return {
      success: true,
      message: myReaction ? 'Reaction saved.' : 'Reaction cleared.',
      data: { lineId, myReaction },
    }
  } catch (error) {
    const handled = errorHandler(error)
    setResponseStatus(event, handled.statusCode || 500)
    return {
      success: false,
      statusCode: handled.statusCode || 500,
      message: handled.message || 'Could not save that reaction.',
    }
  }
})
