import { createError, defineEventHandler, getQuery, readBody } from 'h3'
import { requireAdminApiUser } from '~/server/utils/authGuard'
import { errorHandler } from '~/server/utils/error'
import {
  readTutorialCopy,
  writeTutorialCopy,
} from '~/server/utils/tutorialNotePersistence'
import {
  normalizeTutorialPath,
  normalizeTutorialText,
} from '~/server/utils/tutorialNotes'

export default defineEventHandler(async (event) => {
  try {
    const auth = await requireAdminApiUser(event)
    const path = normalizeTutorialPath(getQuery(event).path)
    const body = await readBody<{ action?: unknown; text?: unknown }>(event)
    const action = body?.action
    if (action !== 'draft' && action !== 'publish' && action !== 'unpublish') {
      throw createError({ statusCode: 400, message: 'Unknown note action.' })
    }
    const text =
      action === 'unpublish' ? null : normalizeTutorialText(body?.text)
    if (action === 'publish' && !text) {
      throw createError({
        statusCode: 400,
        message: 'Write a note before publishing.',
      })
    }
    const { projectId, copy: existing } = await readTutorialCopy(path)
    if (!projectId) {
      throw createError({
        statusCode: 503,
        message: 'Kind Robots project record is unavailable.',
      })
    }
    const now = new Date().toISOString()
    const copy = {
      path,
      draftText: text ?? existing?.draftText ?? '',
      publishedText:
        action === 'publish'
          ? text
          : action === 'unpublish'
            ? null
            : (existing?.publishedText ?? null),
      publishedAt:
        action === 'publish'
          ? now
          : action === 'unpublish'
            ? null
            : (existing?.publishedAt ?? null),
    }
    await writeTutorialCopy(projectId, path, copy, auth.user.id)
    return {
      success: true,
      message:
        action === 'draft'
          ? 'Draft saved privately.'
          : action === 'publish'
            ? 'Developer note published.'
            : 'Developer note unpublished.',
      data: {
        ...copy,
        updatedAt: now,
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
