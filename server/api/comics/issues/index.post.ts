import { createError, defineEventHandler, readBody } from 'h3'
import prisma from '@/server/utils/prisma'
import { requireAdminApiUser } from '@/server/utils/authGuard'
import { errorHandler } from '@/server/utils/error'
import { requireComicSeries, toComicIssueDto } from '@/server/utils/comicStudio'
import { addComicPage, emptyComicIssueLayout } from '~/utils/comicLayouts'

type CreateBody = { seriesId?: unknown; title?: unknown }

export default defineEventHandler(async (event) => {
  try {
    await requireAdminApiUser(event)
    const body = (await readBody<CreateBody>(event)) ?? {}
    const seriesId = Number(body.seriesId)
    if (!Number.isInteger(seriesId) || seriesId <= 0) {
      throw createError({ statusCode: 400, message: 'seriesId is required.' })
    }
    await requireComicSeries(seriesId)
    const last = await prisma.comicIssue.findFirst({
      where: { seriesId },
      orderBy: { number: 'desc' },
      select: { number: true },
    })
    const number = (last?.number ?? 0) + 1
    const title =
      (typeof body.title === 'string' && body.title.trim().slice(0, 255)) ||
      `Issue ${number}`
    const issue = await prisma.comicIssue.create({
      data: {
        seriesId,
        number,
        title,
        layout: JSON.stringify(addComicPage(emptyComicIssueLayout(), 'splash')),
      },
    })
    event.node.res.statusCode = 201
    return {
      success: true,
      statusCode: 201,
      message: `Added ${title}.`,
      data: toComicIssueDto(issue),
    }
  } catch (error) {
    const handled = errorHandler(error)
    event.node.res.statusCode = handled.statusCode || 500
    return handled
  }
})
