import { createError, defineEventHandler, setHeader } from 'h3'
import prisma from '~/server/utils/prisma'
import { requireHumanApiUser } from '~/server/utils/authGuard'
import { errorHandler } from '~/server/utils/error'
import { parseCrystalStreetSave } from '~/utils/crystalStreet/accountSave'

export default defineEventHandler(async (event) => {
  setHeader(event, 'Cache-Control', 'private, no-store')
  setHeader(event, 'Vary', 'Authorization')
  try {
    const { user } = await requireHumanApiUser(event)
    if (user.isGuest || user.id === 10)
      throw createError({
        statusCode: 401,
        message: 'Sign in to use the Crystal Street save.',
      })
    const row = await prisma.arcadeCabinetSave.findUnique({
      where: {
        userId_gameSlug: { userId: user.id, gameSlug: 'crystal-street' },
      },
      select: { payload: true, revision: true, updatedAt: true },
    })
    if (!row) return { success: true, data: { ownerId: user.id, save: null, revision: null } }
    const save = parseCrystalStreetSave(row.payload)
    return {
      success: true,
      data: { ownerId: user.id, save, revision: row.revision, updatedAt: row.updatedAt },
    }
  } catch (error) {
    const failure = errorHandler(error)
    event.node.res.statusCode = failure.statusCode || 500
    return { ...failure, statusCode: event.node.res.statusCode }
  }
})
