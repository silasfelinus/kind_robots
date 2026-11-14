import { createError, defineEventHandler } from 'h3'
import prisma from '~/server/utils/prisma'
import { requireHumanApiUser } from '~/server/utils/authGuard'
import { errorHandler } from '~/server/utils/error'
import { validZuzuAccountSave } from '~/utils/zuzuGamebook/accountSave'

export default defineEventHandler(async (event) => {
  try {
    const { user } = await requireHumanApiUser(event)
    if (user.isGuest || user.id === 10)
      throw createError({ statusCode: 401, message: 'Sign in to sync Zuzu.' })

    const row = await prisma.zuzuGamebookSave.findUnique({
      where: { userId: user.id },
      select: { payload: true, revision: true, updatedAt: true },
    })
    if (!row) return { success: true, data: null }

    const payload: unknown = JSON.parse(row.payload)
    if (!validZuzuAccountSave(payload))
      throw createError({ statusCode: 500, message: 'Account save is invalid.' })

    return {
      success: true,
      data: { save: payload, revision: row.revision, updatedAt: row.updatedAt },
    }
  } catch (error) {
    const failure = errorHandler(error)
    event.node.res.statusCode = failure.statusCode || 500
    return { ...failure, statusCode: event.node.res.statusCode }
  }
})
