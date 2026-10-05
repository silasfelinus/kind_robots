import { createError, defineEventHandler, readBody } from 'h3'
import { requireAdminApiUser } from '@/server/utils/authGuard'
import { errorHandler } from '@/server/utils/error'
import { readComicId, requireComicSeries } from '@/server/utils/comicStudio'
import { runComicEditor } from '@/server/utils/comicEditor'
import {
  COMIC_EDITOR_TARGETS,
  type ComicEditorTarget,
} from '~/utils/comicEditor'

type EditorBody = {
  targetType?: unknown
  targetId?: unknown
  text?: unknown
  parentId?: unknown
  trigger?: unknown
}

const MAX_TEXT = 20_000

export default defineEventHandler(async (event) => {
  try {
    await requireAdminApiUser(event)
    const seriesId = readComicId(event, 'series id')
    await requireComicSeries(seriesId)
    const body = (await readBody<EditorBody>(event)) ?? {}
    const parentId = Number(body.parentId)
    const hasParent = Number.isInteger(parentId) && parentId > 0
    const targetType = COMIC_EDITOR_TARGETS.find(
      (value) => value === body.targetType,
    )
    if (!targetType && !hasParent) {
      throw createError({
        statusCode: 400,
        message: 'Tell the editor what to judge.',
      })
    }
    const text = typeof body.text === 'string' ? body.text : null
    if (text && text.length > MAX_TEXT) {
      throw createError({
        statusCode: 413,
        message: `Keep it under ${MAX_TEXT} characters.`,
      })
    }
    if (hasParent && !text?.trim()) {
      throw createError({
        statusCode: 400,
        message: 'A reply needs something to say.',
      })
    }
    const targetId = Number(body.targetId)
    const critique = await runComicEditor({
      seriesId,
      targetType: (targetType ?? 'pitch') as ComicEditorTarget,
      targetId: Number.isInteger(targetId) && targetId > 0 ? targetId : null,
      text,
      parentId: hasParent ? parentId : null,
      trigger: hasParent ? 'reply' : body.trigger === 'auto' ? 'auto' : 'ask',
    })
    event.node.res.statusCode = 201
    return {
      success: true,
      statusCode: 201,
      message: critique.headline,
      data: critique,
    }
  } catch (error) {
    const handled = errorHandler(error)
    event.node.res.statusCode = handled.statusCode || 500
    return handled
  }
})
