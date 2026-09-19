// /server/api/mandarin/lessons/[key].get.ts
//
// mandarin-tutor/t-022: the lesson behind /play/mandarin/learn/<key>.
//
// Deliberately unauthenticated and cacheable, exactly like GET /api/mandarin: a lesson is
// derived entirely from the pinned public catalog plus pure functions in
// utils/mandarinLesson.ts. It contains no learner state -- lesson completion, points, and
// the soft study gate are mandarin-tutor/t-023 and live on their own authenticated routes.
// Keeping the teaching content public means a lesson page renders (and server-renders) for
// a signed-out visitor, which is the right default for an academic reference surface.
import { createError, defineEventHandler, getRouterParam, setHeader } from 'h3'
import { errorHandler } from '../../../utils/error'
import { getMandarinCatalog } from '../../../utils/mandarinCatalog'
import {
  buildMandarinLesson,
  buildMandarinLessonIndex,
} from '../../../../utils/mandarinLesson'

const MAX_KEY_LENGTH = 255

export default defineEventHandler(async (event) => {
  try {
    const rawKey = getRouterParam(event, 'key') ?? ''
    // Nuxt/h3 leaves route params percent-encoded, and catalog keys carry both a colon
    // ("curated:猫") and Han characters, so both survive a round trip through a URL only
    // if this decodes. A malformed escape sequence throws inside decodeURIComponent, so
    // it is caught here rather than surfacing as an unhandled 500.
    let key = ''
    try {
      key = decodeURIComponent(rawKey).trim()
    } catch {
      key = rawKey.trim()
    }

    if (!key || key.length > MAX_KEY_LENGTH) {
      throw createError({
        statusCode: 400,
        statusMessage: 'A valid Mandarin card key is required.',
      })
    }

    const catalog = await getMandarinCatalog()
    const card = catalog.cards.find((entry) => entry.key === key)
    if (!card) {
      throw createError({
        statusCode: 404,
        statusMessage: `No Mandarin card is catalogued under the key "${key}".`,
      })
    }

    const index = buildMandarinLessonIndex(catalog.cards)
    const lesson = buildMandarinLesson(card, index)

    setHeader(
      event,
      'Cache-Control',
      'public, max-age=300, stale-while-revalidate=3600',
    )

    return {
      success: true,
      statusCode: 200,
      message: `Lesson ready for ${card.simplified}.`,
      data: { lesson },
    }
  } catch (error: unknown) {
    const handled = errorHandler(error)
    event.node.res.statusCode = handled.statusCode || 500
    return {
      success: false,
      statusCode: handled.statusCode || 500,
      message: handled.message || 'Failed to build the Mandarin lesson.',
      data: null,
    }
  }
})
