import { createError, defineEventHandler, readBody } from 'h3'
import prisma from '@/server/utils/prisma'
import { requireAdminApiUser } from '@/server/utils/authGuard'
import { errorHandler } from '@/server/utils/error'
import { loadComicSnapshot } from '@/server/utils/comicStudio'
import { DEFAULT_COMIC_LANES } from '~/utils/comicLanes'
import { emptyComicIssueLayout } from '~/utils/comicLayouts'
import { slugify } from '~/utils/slugify'

type CreateBody = { title?: unknown; slug?: unknown }

export default defineEventHandler(async (event) => {
  try {
    const auth = await requireAdminApiUser(event)
    const body = (await readBody<CreateBody>(event)) ?? {}
    const title =
      typeof body.title === 'string' ? body.title.trim().slice(0, 255) : ''
    if (!title)
      throw createError({ statusCode: 400, message: 'A series needs a title.' })
    const slug = slugify(
      typeof body.slug === 'string' && body.slug ? body.slug : title,
    ).slice(0, 120)
    if (!slug)
      throw createError({
        statusCode: 400,
        message: 'A series needs a usable slug.',
      })
    const existing = await prisma.comicSeries.findUnique({ where: { slug } })
    if (existing) {
      throw createError({
        statusCode: 409,
        message: `Series "${slug}" already exists.`,
      })
    }
    const series = await prisma.comicSeries.create({
      data: {
        userId: auth.user.id,
        slug,
        title,
        lanes: JSON.stringify(DEFAULT_COMIC_LANES),
        Issues: {
          create: {
            number: 1,
            title: 'Issue 1',
            layout: JSON.stringify(emptyComicIssueLayout()),
          },
        },
      },
    })
    event.node.res.statusCode = 201
    return {
      success: true,
      statusCode: 201,
      message: `Created ${title}.`,
      data: await loadComicSnapshot(series.id),
    }
  } catch (error) {
    const handled = errorHandler(error)
    event.node.res.statusCode = handled.statusCode || 500
    return handled
  }
})
