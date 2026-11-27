import { createError, defineEventHandler, readBody, setHeader } from 'h3'
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
    const body: unknown = await readBody(event)
    if (!body || typeof body !== 'object' || Array.isArray(body))
      throw createError({ statusCode: 400, message: 'Invalid save request.' })
    const input = body as {
      edition?: unknown
      save?: unknown
      expectedRevision?: unknown
    }
    if (input.edition !== edition)
      throw createError({
        statusCode: 409,
        message: 'This session is playing a different edition.',
      })
    if (
      input.expectedRevision !== null &&
      (!Number.isSafeInteger(input.expectedRevision) ||
        (input.expectedRevision as number) < 0)
    )
      throw createError({
        statusCode: 400,
        message: 'Read the account save first.',
      })
    const save = parseAccountSave(input.save, edition)
    if (!save)
      throw createError({
        statusCode: 400,
        message: 'Invalid or oversized MONSTRIQUE save.',
      })
    const payload = JSON.stringify(save)
    const gameSlug = accountSaveSlot(edition)
    const conflict = () =>
      createError({
        statusCode: 409,
        message: 'Another device saved first. Read the account save again.',
      })
    if (input.expectedRevision === null) {
      try {
        await prisma.arcadeCabinetSave.create({
          data: { userId: auth.user.id, gameSlug, payload },
        })
      } catch (error) {
        if ((error as { code?: string })?.code === 'P2002') throw conflict()
        throw error
      }
      return { success: true, data: { edition, revision: 0 } }
    }
    const prior = input.expectedRevision as number
    const result = await prisma.arcadeCabinetSave.updateMany({
      where: { userId: auth.user.id, gameSlug, revision: prior },
      data: { payload, revision: { increment: 1 } },
    })
    if (result.count !== 1) throw conflict()
    return { success: true, data: { edition, revision: prior + 1 } }
  } catch (error) {
    const failure = errorHandler(error)
    event.node.res.statusCode = failure.statusCode || 500
    return { ...failure, statusCode: event.node.res.statusCode }
  }
})
