import { createError, defineEventHandler, setHeader } from 'h3'
import prisma from '~/server/utils/prisma'
import { requireHumanApiUser } from '~/server/utils/authGuard'
import { errorHandler } from '~/server/utils/error'
import {
  PRIVATE_DRAFT_SLUG,
  newPrivateDraftArchive,
  parsePrivateDraftLibrary,
} from '~/utils/everyVillainTactics/privateDrafts'

export default defineEventHandler(async (event) => {
  setHeader(event, 'Cache-Control', 'private, no-store')
  try {
    const { user } = await requireHumanApiUser(event)
    if (user.isGuest || user.id === 10)
      throw createError({ statusCode: 401, message: 'Sign in to save drafts.' })
    const row = await prisma.arcadeCabinetSave.findUnique({
      where: {
        userId_gameSlug: { userId: user.id, gameSlug: PRIVATE_DRAFT_SLUG },
      },
      select: { payload: true, revision: true },
    })
    return {
      success: true,
      data: row
        ? {
            library: parsePrivateDraftLibrary(row.payload),
            revision: row.revision,
          }
        : newPrivateDraftArchive(),
    }
  } catch (error) {
    const failure = errorHandler(error)
    event.node.res.statusCode = failure.statusCode || 500
    return { ...failure, statusCode: event.node.res.statusCode }
  }
})
