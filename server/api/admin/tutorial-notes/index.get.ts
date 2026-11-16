import { defineEventHandler, getQuery } from 'h3'
import { requireAdminApiUser } from '~/server/utils/authGuard'
import { errorHandler } from '~/server/utils/error'
import { readTutorialCopy } from '~/server/utils/tutorialNotePersistence'
import { normalizeTutorialPath } from '~/server/utils/tutorialNotes'

export default defineEventHandler(async (event) => {
  try {
    await requireAdminApiUser(event)
    const path = normalizeTutorialPath(getQuery(event).path)
    const { copy } = await readTutorialCopy(path)
    return {
      success: true,
      data: {
        path,
        draftText: copy?.draftText ?? null,
        publishedText: copy?.publishedText ?? null,
        publishedAt: copy?.publishedAt ?? null,
        updatedAt: null,
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
