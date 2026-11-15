import { createError, defineEventHandler, getQuery, readBody } from 'h3'
import prisma from '~/server/utils/prisma'
import { requireAdminApiUser } from '~/server/utils/authGuard'
import { errorHandler } from '~/server/utils/error'
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
    const updated = await prisma.tutorialNote.upsert({
      where: { path },
      create: {
        path,
        draftText: text ?? '',
        publishedText: action === 'publish' ? text : null,
        publishedAt: action === 'publish' ? new Date() : null,
        updatedById: auth.user.id,
      },
      update: {
        ...(text !== null ? { draftText: text } : {}),
        ...(action === 'publish'
          ? { publishedText: text, publishedAt: new Date() }
          : action === 'unpublish'
            ? { publishedText: null, publishedAt: null }
            : {}),
        updatedById: auth.user.id,
      },
    })
    return {
      success: true,
      message:
        action === 'draft'
          ? 'Draft saved privately.'
          : action === 'publish'
            ? 'Developer note published.'
            : 'Developer note unpublished.',
      data: {
        path,
        draftText: updated.draftText,
        publishedText: updated.publishedText,
        publishedAt: updated.publishedAt?.toISOString() ?? null,
        updatedAt: updated.updatedAt.toISOString(),
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
