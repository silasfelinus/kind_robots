import { createError, defineEventHandler, readBody } from 'h3'
import prisma from '~/server/utils/prisma'
import { requireHumanApiUser } from '~/server/utils/authGuard'
import { errorHandler } from '~/server/utils/error'
import { parseVoyageBackup } from '~/utils/gameOfCaptains/voyageBackup'

/** Revision-guarded account copy. A stale device can never silently overwrite it. */
export default defineEventHandler(async (event) => {
  try {
    const { user } = await requireHumanApiUser(event)
    if (user.isGuest || user.id === 10) {
      throw createError({
        statusCode: 401,
        message: 'Sign in to save your Space Couch voyage.',
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
        message: 'Read your account save before updating it.',
      })
    }

    // The canonical backup validator checks the format, completed-run IDs,
    // current VoyageRun shape and the 8 MB maximum. It also strips unknown
    // fields. Never trust a client to submit serialized Prisma state.
    let payload: string
    try {
      const raw = JSON.stringify(input.save)
      if (typeof raw !== 'string') throw new Error('Missing save envelope.')
      payload = JSON.stringify(parseVoyageBackup(raw))
    } catch {
      throw createError({
        statusCode: 400,
        message: 'Invalid or oversized Space Couch backup.',
      })
    }

    if (input.expectedRevision === null) {
      try {
        await prisma.spaceCouchVoyageSave.create({
          data: { userId: user.id, payload },
        })
      } catch (error) {
        if ((error as { code?: string })?.code === 'P2002') {
          throw createError({
            statusCode: 409,
            message:
              'Another device saved to this account. Reload its copy first.',
          })
        }
        throw error
      }
    } else {
      const updated = await prisma.spaceCouchVoyageSave.updateMany({
        where: {
          userId: user.id,
          revision: input.expectedRevision as number,
        },
        data: { payload, revision: { increment: 1 } },
      })
      if (updated.count !== 1) {
        throw createError({
          statusCode: 409,
          message:
            'Another device saved to this account. Reload its copy first.',
        })
      }
    }
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
