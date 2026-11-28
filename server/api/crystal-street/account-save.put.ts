import { createError, defineEventHandler, readBody, setHeader } from 'h3'
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
    const body: unknown = await readBody(event)
    if (!body || typeof body !== 'object' || Array.isArray(body))
      throw createError({
        statusCode: 400,
        message: 'Invalid archive request.',
      })
    const input = body as {
      ownerId?: unknown
      save?: unknown
      expectedRevision?: unknown
    }
    if (input.ownerId !== user.id)
      throw createError({
        statusCode: 403,
        message: 'Account changed. Read your own save first.',
      })
    if (
      input.expectedRevision !== null &&
      (!Number.isSafeInteger(input.expectedRevision) ||
        (input.expectedRevision as number) < 0)
    )
      throw createError({
        statusCode: 400,
        message: 'Read the account archive first.',
      })
    let payload: string
    try {
      payload = JSON.stringify(parseCrystalStreetSave(JSON.stringify(input.save)))
    } catch {
      throw createError({
        statusCode: 400,
        message: 'Invalid or oversized Crystal Street save.',
      })
    }
    const gameSlug = 'crystal-street'
    const conflict = () =>
      createError({
        statusCode: 409,
        message: 'Another device saved first. Read the archive and try again.',
      })
    if (input.expectedRevision === null) {
      try {
        await prisma.arcadeCabinetSave.create({
          data: { userId: user.id, gameSlug, payload },
        })
      } catch (error) {
        if ((error as { code?: string })?.code === 'P2002') throw conflict()
        throw error
      }
      return { success: true, data: { revision: 0 } }
    }
    const prior = input.expectedRevision as number
    const result = await prisma.arcadeCabinetSave.updateMany({
      where: { userId: user.id, gameSlug, revision: prior },
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
