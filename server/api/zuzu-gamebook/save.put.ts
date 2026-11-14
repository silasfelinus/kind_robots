import { createError, defineEventHandler, readBody } from 'h3'
import prisma from '~/server/utils/prisma'
import { requireHumanApiUser } from '~/server/utils/authGuard'
import { errorHandler } from '~/server/utils/error'
import { validZuzuAccountSave } from '~/utils/zuzuGamebook/accountSave'

export default defineEventHandler(async (event) => {
  try {
    const { user } = await requireHumanApiUser(event)
    if (user.isGuest || user.id === 10)
      throw createError({ statusCode: 401, message: 'Sign in to sync Zuzu.' })

    const body: unknown = await readBody(event)
    if (!body || typeof body !== 'object' || Array.isArray(body))
      throw createError({ statusCode: 400, message: 'Invalid save request.' })
    const input = body as { save?: unknown; expectedRevision?: unknown }
    if (
      !validZuzuAccountSave(input.save) ||
      (input.expectedRevision !== null &&
        (!Number.isSafeInteger(input.expectedRevision) ||
          (input.expectedRevision as number) < 0))
    )
      throw createError({ statusCode: 400, message: 'Invalid account save.' })

    const payload = JSON.stringify(input.save)
    if (input.expectedRevision === null) {
      try {
        await prisma.zuzuGamebookSave.create({
          data: { userId: user.id, payload },
        })
      } catch (error) {
        if ((error as { code?: string })?.code === 'P2002')
          throw createError({
            statusCode: 409,
            message: 'Another device saved this journey. Review both copies.',
          })
        throw error
      }
    } else {
      const updated = await prisma.zuzuGamebookSave.updateMany({
        where: {
          userId: user.id,
          revision: input.expectedRevision as number,
        },
        data: { payload, revision: { increment: 1 } },
      })
      if (updated.count !== 1)
        throw createError({
          statusCode: 409,
          message: 'Another device saved this journey. Review both copies.',
        })
    }
    // Return the version this request actually committed. A later read could
    // race another device's newer save and falsely acknowledge its revision.
    return {
      success: true,
      data: {
        revision:
          input.expectedRevision === null
            ? 0
            : (input.expectedRevision as number) + 1,
      },
    }
  } catch (error) {
    const failure = errorHandler(error)
    event.node.res.statusCode = failure.statusCode || 500
    return { ...failure, statusCode: event.node.res.statusCode }
  }
})
