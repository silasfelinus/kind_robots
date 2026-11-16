import { defineEventHandler, getQuery } from 'h3'
import { errorHandler } from '~/server/utils/error'
import { readTutorialCopy } from '~/server/utils/tutorialNotePersistence'
import {
  normalizeTutorialPath,
  publicTutorialText,
} from '~/server/utils/tutorialNotes'

export default defineEventHandler(async (event) => {
  try {
    const path = normalizeTutorialPath(getQuery(event).path)
    const { copy } = path.startsWith('/admin/')
      ? { copy: null }
      : await readTutorialCopy(path)
    return {
      success: true,
      data: {
        path,
        text: publicTutorialText(path, copy?.publishedText),
        hasRecord: Boolean(copy),
        publishedAt: copy?.publishedAt ?? null,
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
