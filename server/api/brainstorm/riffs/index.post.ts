import {
  createError,
  defineEventHandler,
  readBody,
  setResponseStatus,
} from 'h3'
import prisma from '~/server/utils/prisma'
import { errorHandler } from '~/server/utils/error'
import { getOptionalAuthUser } from '~/server/utils/serverApi'
import { requirePlayer } from '~/server/utils/brainstorm/riffBoard'
import {
  BRAINSTORM_RIFF_LIMITS,
  cleanRiffText,
  normalizeRiffFlavor,
} from '~/utils/brainstormRiffs'

type RiffBody = {
  flavor?: unknown
  title?: unknown
  stem?: unknown
  vibe?: unknown
  crossoverIds?: unknown
  isPublic?: unknown
}

export default defineEventHandler(async (event) => {
  try {
    const user = requirePlayer(await getOptionalAuthUser(event))
    const body = ((await readBody<RiffBody>(event)) ?? {}) as RiffBody
    const flavor = normalizeRiffFlavor(body.flavor)
    const title = cleanRiffText(body.title, BRAINSTORM_RIFF_LIMITS.title)
    if (!title) {
      throw createError({ statusCode: 400, message: 'Give the riff a prompt.' })
    }
    const stem = cleanRiffText(body.stem, BRAINSTORM_RIFF_LIMITS.stem) || null
    if ((flavor === 'persona' || flavor === 'crossover') && !stem) {
      throw createError({
        statusCode: 400,
        message: 'Say how each answer starts, like "Vanderbuilt Lacrosse".',
      })
    }
    const vibe = cleanRiffText(body.vibe, BRAINSTORM_RIFF_LIMITS.vibe) || null

    let crossoverIds: number[] = []
    if (flavor === 'crossover' && Array.isArray(body.crossoverIds)) {
      const requested = body.crossoverIds
        .map((value) => Number(value))
        .filter((value) => Number.isInteger(value) && value > 0)
        .slice(0, 4)
      const found = await prisma.brainstormRiff.findMany({
        where: {
          id: { in: requested },
          flavor: 'persona',
          OR: [{ isPublic: true }, { userId: user.id }],
        },
        select: { id: true },
      })
      crossoverIds = found.map((row) => row.id)
    }

    const riff = await prisma.brainstormRiff.create({
      data: {
        userId: user.id,
        flavor,
        title,
        stem,
        vibe,
        crossoverIds: crossoverIds.length ? JSON.stringify(crossoverIds) : null,
        isPublic: body.isPublic !== false,
      },
      select: { id: true, title: true },
    })

    setResponseStatus(event, 201)
    return {
      success: true,
      statusCode: 201,
      message: `“${riff.title}” is on the table.`,
      data: { riffId: riff.id },
    }
  } catch (error) {
    const handled = errorHandler(error)
    setResponseStatus(event, handled.statusCode || 500)
    return {
      success: false,
      statusCode: handled.statusCode || 500,
      message: handled.message || 'Could not start that riff.',
    }
  }
})
