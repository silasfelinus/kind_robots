import { defineEventHandler, getQuery } from 'h3'
import prisma from '~/server/utils/prisma'
import { requireAdminApiUser } from '~/server/utils/authGuard'
import { errorHandler } from '~/server/utils/error'
import { normalizeTutorialPath } from '~/server/utils/tutorialNotes'

export default defineEventHandler(async (event) => {
  try {
    await requireAdminApiUser(event)
    const path = normalizeTutorialPath(getQuery(event).path)
    const note = await prisma.tutorialNote.findUnique({ where: { path } })
    return {
      success: true,
      data: {
        path,
        draftText: note?.draftText ?? null,
        publishedText: note?.publishedText ?? null,
        publishedAt: note?.publishedAt?.toISOString() ?? null,
        updatedAt: note?.updatedAt.toISOString() ?? null,
      },
      statusCode: 200,
    }
  } catch (error) {
    const handled = errorHandler(error)
    event.node.res.statusCode = handled.statusCode || 500
    return {
      ...handled,
      statusCode: event.node.res.statusCode,
    }
  }
})
