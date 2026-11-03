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
  enqueueLineArt,
  parsePositiveId,
  readRiffOr404,
  requirePlayer,
} from '~/server/utils/brainstorm/riffBoard'
import { BRAINSTORM_RIFF_LIMITS, cleanRiffText } from '~/utils/brainstormRiffs'

type LineBody = { text?: unknown; authorName?: unknown; aiSpark?: unknown }

export default defineEventHandler(async (event) => {
  try {
    const riffId = parsePositiveId(getRouterParam(event, 'id'), 'riff id')
    const user = requirePlayer(await getOptionalAuthUser(event))
    const riff = await readRiffOr404(riffId)
    if (!canSeeRiff(riff, user)) {
      throw createError({ statusCode: 404, message: 'That riff is gone.' })
    }
    if (!riff.isOpen) {
      throw createError({ statusCode: 409, message: 'This riff is closed.' })
    }

    const body = ((await readBody<LineBody>(event)) ?? {}) as LineBody
    const text = cleanRiffText(body.text, BRAINSTORM_RIFF_LIMITS.line)
    if (!text) {
      throw createError({ statusCode: 400, message: 'Write your line first.' })
    }
    const duplicate = await prisma.brainstormLine.findFirst({
      where: { riffId, text },
      select: { id: true },
    })
    if (duplicate) {
      throw createError({
        statusCode: 409,
        message: 'Somebody already said that one.',
      })
    }
    const authorName =
      cleanRiffText(body.authorName, BRAINSTORM_RIFF_LIMITS.authorName) ||
      user.username.slice(0, BRAINSTORM_RIFF_LIMITS.authorName)
    const aiSpark =
      cleanRiffText(body.aiSpark, BRAINSTORM_RIFF_LIMITS.spark) || null

    const now = new Date()
    const line = await prisma.brainstormLine.create({
      data: {
        riffId,
        userId: user.id,
        authorName,
        text,
        aiSpark,
        createdAt: now,
      },
      select: { id: true, text: true },
    })
    await prisma.brainstormRiff.update({
      where: { id: riffId },
      data: { lastLineAt: now },
    })

    const art = await enqueueLineArt(event, riff, line)

    setResponseStatus(event, 201)
    return {
      success: true,
      statusCode: 201,
      message: art.jobId
        ? 'Line in. The art modeler is painting it.'
        : `Line in. Art did not queue: ${art.message}`,
      data: { lineId: line.id, artJobId: art.jobId },
    }
  } catch (error) {
    const handled = errorHandler(error)
    setResponseStatus(event, handled.statusCode || 500)
    return {
      success: false,
      statusCode: handled.statusCode || 500,
      message: handled.message || 'Could not add that line.',
    }
  }
})
