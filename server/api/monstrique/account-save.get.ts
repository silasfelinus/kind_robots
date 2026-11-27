import { createError, defineEventHandler, setHeader } from 'h3'
import prisma from '~/server/utils/prisma'
import { requireHumanApiUser } from '~/server/utils/authGuard'
import { errorHandler } from '~/server/utils/error'
import { monstriqueAudienceFor } from '~/server/utils/monstriqueAccess'
import {
  accountSaveSlot,
  parseAccountSave,
} from '~/utils/monstressConvention/accountSave'

export default defineEventHandler(async (event) => {
  setHeader(event, 'Cache-Control', 'private, no-store')
  setHeader(event, 'Vary', 'Authorization')
  try {
    const auth = await requireHumanApiUser(event)
    if (auth.user.isGuest || auth.user.id === 10)
      throw createError({
        statusCode: 401,
        message: 'Sign in to keep MONSTRIQUE on every device.',
      })
    const edition = monstriqueAudienceFor(auth)
    const row = await prisma.arcadeCabinetSave.findUnique({
      where: {
        userId_gameSlug: {
          userId: auth.user.id,
          gameSlug: accountSaveSlot(edition),
        },
      },
      select: { payload: true, revision: true },
    })
    if (!row)
      return { success: true, data: { edition, save: null, revision: null } }
    let parsed: unknown = null
    try {
      parsed = JSON.parse(row.payload)
    } catch {
      parsed = null
    }
    return {
      success: true,
      data: {
        edition,
        save: parseAccountSave(parsed, edition),
        revision: row.revision,
      },
    }
  } catch (error) {
    const failure = errorHandler(error)
    event.node.res.statusCode = failure.statusCode || 500
    return { ...failure, statusCode: event.node.res.statusCode }
  }
})
