// PUT /api/tarot/account-save { save, expectedRevision }
//
// Compare-and-swap like the other account saves: null creates, an integer
// must match the stored revision, and any mismatch is a 409 so a second
// device re-reads before it overwrites.
import { createError, defineEventHandler, readBody, setHeader } from 'h3'
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
    const body: unknown = await readBody(event)
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      throw createError({ statusCode: 400, message: 'Invalid save request.' })
    }
    const input = body as { save?: unknown; expectedRevision?: unknown }
    if (
      input.expectedRevision !== null &&
      (!Number.isSafeInteger(input.expectedRevision) ||
        (input.expectedRevision as number) < 0)
    ) {
      throw createError({
        statusCode: 400,
        message: 'Read the account save first.',
      })
    }
    let payload: string
    try {
      payload = JSON.stringify(parseTarotAccountSave(input.save))
    } catch {
      throw createError({
        statusCode: 400,
        message: 'Invalid or oversized tarot save.',
      })
    }
    const conflict = () =>
      createError({
        statusCode: 409,
        message: 'Another device saved first. Read the save and try again.',
      })
    if (input.expectedRevision === null) {
      try {
        await prisma.arcadeCabinetSave.create({
          data: { userId: user.id, gameSlug: TAROT_ACCOUNT_SLUG, payload },
        })
      } catch (error) {
        if ((error as { code?: string })?.code === 'P2002') throw conflict()
        throw error
      }
      return { success: true, data: { revision: 0 } }
    }
    const prior = input.expectedRevision as number
    const result = await prisma.arcadeCabinetSave.updateMany({
      where: { userId: user.id, gameSlug: TAROT_ACCOUNT_SLUG, revision: prior },
      data: { payload, revision: { increment: 1 } },
    })
    if (result.count !== 1) throw conflict()
    return { success: true, data: { revision: prior + 1 } }
  } catch (error) {
    const failure = errorHandler(error)
    event.node.res.statusCode = failure.statusCode || 500
    return { ...failure, statusCode: event.node.res.statusCode }
  }
})
