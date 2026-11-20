import { createError, defineEventHandler } from 'h3'
import prisma from '~/server/utils/prisma'
import { requireHumanApiUser } from '~/server/utils/authGuard'
import { errorHandler } from '~/server/utils/error'
import { parseVoyageBackup } from '~/utils/gameOfCaptains/voyageBackup'

/** Read only the signed-in account's private, explicit voyage backup. */
export default defineEventHandler(async (event) => {
  try {
    const { user } = await requireHumanApiUser(event)
    if (user.isGuest || user.id === 10) {
      throw createError({
        statusCode: 401,
        message: 'Sign in to load your Space Couch account backup.',
      })
    }
    const row = await prisma.spaceCouchVoyageSave.findUnique({
      where: { userId: user.id },
      select: { payload: true, revision: true, updatedAt: true },
    })
    if (!row) return { success: true, data: null }
    let save
    try {
      save = parseVoyageBackup(row.payload)
    } catch {
      throw createError({
        statusCode: 500,
        message:
          'Your account backup is invalid. Your device save is unaffected.',
      })
    }
    return {
      success: true,
      data: { save, revision: row.revision, updatedAt: row.updatedAt },
    }
  } catch (error) {
    const failure = errorHandler(error)
    event.node.res.statusCode = failure.statusCode || 500
    return { ...failure, statusCode: event.node.res.statusCode }
  }
})
