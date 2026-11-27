import { createError, defineEventHandler, getRouterParam, setHeader } from 'h3'
import prisma from '~/server/utils/prisma'
import { requireHumanApiUser } from '~/server/utils/authGuard'
import { errorHandler } from '~/server/utils/error'
import { validSpectrumCloudSave } from '~/utils/arcade/superkateSpectrum/progress'
import {
  PLUMBER_SLUG,
  validPlumberCloudSave,
} from '~/utils/arcade/games/savePlumberSave'

export default defineEventHandler(async (event) => {
  setHeader(event, 'Cache-Control', 'private, no-store')
  try {
    const game = getRouterParam(event, 'game')
    if (game !== 'superkate-spectrum' && game !== PLUMBER_SLUG)
      throw createError({ statusCode: 404, message: 'Unknown cloud cabinet.' })
    const validSave =
      game === PLUMBER_SLUG ? validPlumberCloudSave : validSpectrumCloudSave
    const { user } = await requireHumanApiUser(event)
    if (user.isGuest || user.id === 10)
      throw createError({ statusCode: 401, message: 'Sign in to sync Arcade.' })

    const row = await prisma.arcadeCabinetSave.findUnique({
      where: { userId_gameSlug: { userId: user.id, gameSlug: game } },
      select: { payload: true, revision: true, updatedAt: true },
    })
    if (!row) return { success: true, data: null }
    const value: unknown = JSON.parse(row.payload)
    if (!validSave(value))
      throw createError({
        statusCode: 500,
        message: 'Account save needs repair. Your device copy is safe.',
      })
    return {
      success: true,
      data: { save: value, revision: row.revision, updatedAt: row.updatedAt },
    }
  } catch (error) {
    const failure = errorHandler(error)
    event.node.res.statusCode = failure.statusCode || 500
    return { ...failure, statusCode: event.node.res.statusCode }
  }
})
