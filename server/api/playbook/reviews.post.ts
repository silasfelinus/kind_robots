import { createError, defineEventHandler, getHeader, getRequestIP, readBody } from 'h3'
import prisma from '~/server/utils/prisma'
import { errorHandler } from '~/server/utils/error'
import { getOptionalApiUser } from '~/server/utils/authGuard'
import { validateRunReview } from '~/utils/playbook/runReview'

const attempts = new Map<string, { count: number; until: number }>()

export default defineEventHandler(async (event) => {
  try {
    const origin = getHeader(event, 'origin')
    const host = getHeader(event, 'host')
    if (origin && host && new URL(origin).host !== host)
      throw createError({ statusCode: 403, message: 'Reviews must originate on this site.' })
    const length = Number(getHeader(event, 'content-length') ?? 0)
    if (length > 240000)
      throw createError({ statusCode: 413, message: 'Review exceeds the size limit.' })
    const ip = getRequestIP(event) ?? 'unknown'
    const now = Date.now()
    const previous = attempts.get(ip)
    const attempt = previous && previous.until > now
      ? { count: previous.count + 1, until: previous.until }
      : { count: 1, until: now + 3600000 }
    attempts.set(ip, attempt)
    if (attempts.size > 2000) attempts.clear()
    if (attempt.count > 30)
      throw createError({ statusCode: 429, message: 'Review rate limit reached.' })

    let payload: ReturnType<typeof validateRunReview>
    try {
      payload = validateRunReview(await readBody(event))
    } catch (error) {
      throw createError({
        statusCode: 400,
        message: error instanceof Error ? error.message : 'Invalid review.',
      })
    }
    const auth = await getOptionalApiUser(event)
    const review = await prisma.playbookRunReview.upsert({
      where: { gameSlug_runId: { gameSlug: payload.game, runId: payload.runId } },
      create: {
        gameSlug: payload.game,
        runId: payload.runId,
        userId: auth?.user.id ?? null,
        endingKey: payload.ending,
        stars: payload.stars,
        comment: payload.comment || null,
        history: JSON.stringify(payload.history),
      },
      update: {},
      select: { id: true, createdAt: true },
    })
    return { success: true, data: review, message: 'Review recorded.', statusCode: 200 }
  } catch (error) {
    const handled = errorHandler(error)
    event.node.res.statusCode = handled.statusCode ?? 500
    return { ...handled, statusCode: event.node.res.statusCode }
  }
})
