import { defineEventHandler, getQuery } from 'h3'
import prisma from '~/server/utils/prisma'
import { errorHandler } from '~/server/utils/error'
import {
  normalizeTutorialPath,
  publicTutorialText,
} from '~/server/utils/tutorialNotes'

export default defineEventHandler(async (event) => {
  try {
    const path = normalizeTutorialPath(getQuery(event).path)
    const note = path.startsWith('/admin/')
      ? null
      : await prisma.tutorialNote.findUnique({
          where: { path },
          select: { publishedText: true, publishedAt: true },
        })
    return {
      success: true,
      data: {
        path,
        text: publicTutorialText(path, note?.publishedText),
        hasRecord: Boolean(note),
        publishedAt: note?.publishedAt?.toISOString() ?? null,
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
