import { createError, defineEventHandler, readBody } from 'h3'
import { requireApiUser } from '../utils/authGuard'
import { errorHandler } from '../utils/error'
import {
  ensureMandarinAudioAsset,
  mandarinAudioUrl,
  resolveMandarinCatalogCard,
} from '../utils/mandarinAudio'

type MandarinAudioRequest = {
  cardKey?: unknown
}

export default defineEventHandler(async (event) => {
  try {
    await requireApiUser(event)
    const body = await readBody<MandarinAudioRequest>(event)
    const cardKey = typeof body?.cardKey === 'string' ? body.cardKey.trim() : ''

    if (!cardKey || cardKey.length > 255) {
      throw createError({
        statusCode: 400,
        message: 'A valid Mandarin catalog card key is required.',
      })
    }

    // Never turn this endpoint into arbitrary user-supplied TTS. Generation is
    // limited to the sourced/curated Mandarin catalog, and the server chooses
    // the exact Hanzi + pinyin that reach the provider.
    const card = await resolveMandarinCatalogCard(cardKey)
    if (!card) {
      throw createError({
        statusCode: 404,
        message: 'That Mandarin card is not in the current catalog.',
      })
    }

    const asset = await ensureMandarinAudioAsset(event, card)

    return {
      success: true,
      statusCode: 200,
      message: asset.cached
        ? 'Mandarin reference audio loaded from the shared cache.'
        : 'Mandarin reference audio generated and cached.',
      data: {
        id: asset.id,
        url: mandarinAudioUrl(asset.id),
        cached: asset.cached,
      },
    }
  } catch (error) {
    return errorHandler(error)
  }
})
