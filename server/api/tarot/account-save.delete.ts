// DELETE /api/tarot/account-save -- forget the synced copy (sync turned off).
import { createError, defineEventHandler, setHeader } from 'h3'
import prisma from '~/server/utils/prisma'
import { requireHumanApiUser } from '~/server/utils/authGuard'
import { errorHandler } from '~/server/utils/error'
import { TAROT_ACCOUNT_SLUG } from '~/utils/tarot/accountSave'

export default defineEventHandler(async (event) => {
  setHeader(event, 'Cache-Control', 'private, no-store')
  try {
    const { user } = await requireHumanApiUser(event)
    if (user.isGuest || user.id === 10) {
      throw createError({ statusCode: 401, message: 'Sign in first.' })
    }
    const result = await prisma.arcadeCabinetSave.deleteMany({
      where: { userId: user.id, gameSlug: TAROT_ACCOUNT_SLUG },
    })
    return {
      success: true,
      data: { removed: result.count },
      message: result.count
        ? 'Your synced charts were removed from your account.'
        : 'Nothing was stored in your account.',
    }
  } catch (error) {
    const failure = errorHandler(error)
    event.node.res.statusCode = failure.statusCode || 500
    return { ...failure, statusCode: event.node.res.statusCode }
  }
})
