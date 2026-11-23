import {
  createError,
  defineEventHandler,
  getRouterParam,
  readBody,
  setHeader,
} from 'h3'
import prisma from '~/server/utils/prisma'
import { requireHumanApiUser } from '~/server/utils/authGuard'
import { errorHandler } from '~/server/utils/error'
import { validSpectrumCloudSave } from '~/utils/arcade/superkateSpectrum/progress'

const MAX_BYTES = 8_192

export default defineEventHandler(async (event) => {
  setHeader(event, 'Cache-Control', 'private, no-store')
  try {
    const game = getRouterParam(event, 'game')
    if (game !== 'superkate-spectrum')
      throw createError({ statusCode: 404, message: 'Unknown cloud cabinet.' })
    const { user } = await requireHumanApiUser(event)
    if (user.isGuest || user.id === 10)
      throw createError({ statusCode: 401, message: 'Sign in to sync Arcade.' })

    const raw: unknown = await readBody(event)
    if (!raw || typeof raw !== 'object' || Array.isArray(raw))
      throw createError({ statusCode: 400, message: 'Invalid save request.' })
    const input = raw as { save?: unknown; expectedRevision?: unknown }
    if (
      !validSpectrumCloudSave(input.save) ||
      (input.expectedRevision !== null &&
        (!Number.isSafeInteger(input.expectedRevision) ||
          (input.expectedRevision as number) < 0))
    )
      throw createError({ statusCode: 400, message: 'Invalid career save.' })
    const payload = JSON.stringify(input.save)
    if (new TextEncoder().encode(payload).byteLength > MAX_BYTES)
      throw createError({ statusCode: 413, message: 'Career save too large.' })

    let revision = 0
    if (input.expectedRevision === null) {
      try {
        await prisma.arcadeCabinetSave.create({
          data: { userId: user.id, gameSlug: game, payload },
        })
      } catch (error) {
        if ((error as { code?: string })?.code === 'P2002')
          throw createError({
            statusCode: 409,
            message: 'A newer account save exists. Sync before retrying.',
          })
        throw error
      }
    } else {
      const prior = input.expectedRevision as number
      const updated = await prisma.arcadeCabinetSave.updateMany({
        where: { userId: user.id, gameSlug: game, revision: prior },
        data: { payload, revision: { increment: 1 } },
      })
      if (updated.count !== 1)
        throw createError({
          statusCode: 409,
          message: 'A newer account save exists. Sync before retrying.',
        })
      revision = prior + 1
    }
    return { success: true, data: { revision } }
  } catch (error) {
    const failure = errorHandler(error)
    event.node.res.statusCode = failure.statusCode || 500
    return { ...failure, statusCode: event.node.res.statusCode }
  }
})
