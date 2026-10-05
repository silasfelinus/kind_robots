import { createError, defineEventHandler, readBody } from 'h3'
import prisma from '@/server/utils/prisma'
import { requireAdminApiUser } from '@/server/utils/authGuard'
import { errorHandler } from '@/server/utils/error'
import {
  requireComicSeries,
  toComicEntityDto,
} from '@/server/utils/comicStudio'
import { COMIC_ENTITY_KINDS, oneOf } from '~/utils/comicStudio'
import { slugify } from '~/utils/slugify'

type CreateBody = {
  seriesId?: unknown
  name?: unknown
  kind?: unknown
  notes?: unknown
}

export default defineEventHandler(async (event) => {
  try {
    await requireAdminApiUser(event)
    const body = (await readBody<CreateBody>(event)) ?? {}
    const seriesId = Number(body.seriesId)
    if (!Number.isInteger(seriesId) || seriesId <= 0) {
      throw createError({ statusCode: 400, message: 'seriesId is required.' })
    }
    await requireComicSeries(seriesId)
    const name =
      typeof body.name === 'string' ? body.name.trim().slice(0, 255) : ''
    if (!name)
      throw createError({ statusCode: 400, message: 'An entity needs a name.' })
    const base = slugify(name).slice(0, 100) || 'entity'
    const taken = new Set(
      (
        await prisma.comicEntity.findMany({
          where: { seriesId, key: { startsWith: base } },
          select: { key: true },
        })
      ).map((row) => row.key),
    )
    let key = base
    for (let n = 2; taken.has(key); n += 1) key = `${base}-${n}`
    const count = await prisma.comicEntity.count({ where: { seriesId } })
    const entity = await prisma.comicEntity.create({
      data: {
        seriesId,
        key,
        name,
        kind: oneOf(COMIC_ENTITY_KINDS, body.kind, 'character'),
        notes:
          typeof body.notes === 'string' && body.notes.trim()
            ? body.notes
            : null,
        sortOrder: count,
      },
    })
    event.node.res.statusCode = 201
    return {
      success: true,
      statusCode: 201,
      message: `Added ${name}.`,
      data: toComicEntityDto(entity),
    }
  } catch (error) {
    const handled = errorHandler(error)
    event.node.res.statusCode = handled.statusCode || 500
    return handled
  }
})
