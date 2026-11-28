// GET /api/tarot/account-save -- the signed-in reader's synced progress.
import { createError, defineEventHandler, setHeader } from 'h3'
import prisma from '~/server/utils/prisma'
import { requireHumanApiUser } from '~/server/utils/authGuard'
import { errorHandler } from '~/server/utils/error'
import {
  TAROT_ACCOUNT_SLUG,
  parseTarotAccountSave,
} from '~/utils/tarot/accountSave'

export default defineEventHandler(async (event) => {
  setHeader(event, 'Cache-Control', 'private, no-store')
  try {
    const { user } = await requireHumanApiUser(event)
    if (user.isGuest || user.id === 10) {
      throw createError({
        statusCode: 401,
        message: 'Sign in to keep your charts in your account.',
      })
    }
    const row = await prisma.arcadeCabinetSave.findUnique({
      where: {
        userId_gameSlug: { userId: user.id, gameSlug: TAROT_ACCOUNT_SLUG },
      },
      select: { payload: true, revision: true, updatedAt: true },
    })
    if (!row) return { success: true, data: { save: null, revision: null } }
    return {
      success: true,
      data: {
        save: parseTarotAccountSave(row.payload),
        revision: row.revision,
        updatedAt: row.updatedAt,
      },
    }
  } catch (error) {
    const failure = errorHandler(error)
    event.node.res.statusCode = failure.statusCode || 500
    return { ...failure, statusCode: event.node.res.statusCode }
  }
})
