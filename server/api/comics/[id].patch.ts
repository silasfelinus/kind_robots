import { createError, defineEventHandler, readBody } from 'h3'
import prisma from '@/server/utils/prisma'
import { requireAdminApiUser } from '@/server/utils/authGuard'
import { errorHandler } from '@/server/utils/error'
import {
  readComicId,
  requireComicSeries,
  toComicSeriesDto,
} from '@/server/utils/comicStudio'
import { normalizeComicLanes } from '~/utils/comicLanes'
import { COMIC_SERIES_FIELDS, normalizeComicUpdate } from '~/utils/comicStudio'

export default defineEventHandler(async (event) => {
  try {
    await requireAdminApiUser(event)
    const id = readComicId(event, 'series id')
    await requireComicSeries(id)
    const body = (await readBody<Record<string, unknown>>(event)) ?? {}
    const { lanes: rawLanes, ...rest } = body
    const { data, errors } = normalizeComicUpdate(rest, COMIC_SERIES_FIELDS)
    if (rawLanes !== undefined) {
      const lanes = normalizeComicLanes(rawLanes)
      errors.push(...lanes.errors)
      if (!lanes.lanes.length)
        errors.push('A series needs at least one valid lane.')
      data.lanes = JSON.stringify(lanes.lanes)
    }
    if (errors.length)
      throw createError({ statusCode: 400, message: errors.join(' ') })
    const updated = await prisma.comicSeries.update({ where: { id }, data })
    return {
      success: true,
      statusCode: 200,
      message: 'Series saved.',
      data: toComicSeriesDto(updated),
    }
  } catch (error) {
    const handled = errorHandler(error)
    event.node.res.statusCode = handled.statusCode || 500
    return handled
  }
})
