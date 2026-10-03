import { createError, defineEventHandler, readBody } from 'h3'
import prisma from '@/server/utils/prisma'
import { requireAdminApiUser } from '@/server/utils/authGuard'
import { errorHandler } from '@/server/utils/error'
import { readComicId, toComicEntityDto } from '@/server/utils/comicStudio'
import { COMIC_ENTITY_FIELDS, normalizeComicUpdate } from '~/utils/comicStudio'

export default defineEventHandler(async (event) => {
  try {
    await requireAdminApiUser(event)
    const id = readComicId(event, 'entity id')
    const entity = await prisma.comicEntity.findUnique({ where: { id } })
    if (!entity)
      throw createError({ statusCode: 404, message: 'Entity not found.' })
    const { data, errors } = normalizeComicUpdate(
      await readBody(event),
      COMIC_ENTITY_FIELDS,
    )
    if (typeof data.portraitAttemptId === 'number') {
      const attempt = await prisma.comicAttempt.findFirst({
        where: {
          id: data.portraitAttemptId,
          Slot: { seriesId: entity.seriesId },
        },
        select: { id: true },
      })
      if (!attempt)
        errors.push('The portrait must be an attempt from this series.')
    }
    if (errors.length)
      throw createError({ statusCode: 400, message: errors.join(' ') })
    const updated = await prisma.comicEntity.update({ where: { id }, data })
    return {
      success: true,
      statusCode: 200,
      message: 'Entity saved.',
      data: toComicEntityDto(updated),
    }
  } catch (error) {
    const handled = errorHandler(error)
    event.node.res.statusCode = handled.statusCode || 500
    return handled
  }
})
