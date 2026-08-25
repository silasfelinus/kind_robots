import {
  createError,
  defineEventHandler,
  getRouterParam,
  setHeader,
} from 'h3'
import { errorHandler } from '../../../utils/error'
import { prisma } from '../../../utils/prisma'

const AUDIO_ID_PATTERN = /^[a-f0-9]{64}$/

export default defineEventHandler(async (event) => {
  try {
    const id = String(getRouterParam(event, 'id') || '').trim().toLowerCase()
    if (!AUDIO_ID_PATTERN.test(id)) {
      throw createError({
        statusCode: 400,
        message: 'Invalid Mandarin audio asset ID.',
      })
    }

    const asset = await prisma.mandarinAudioAsset.findUnique({
      where: { id },
      select: {
        audioData: true,
        contentType: true,
        byteLength: true,
      },
    })

    if (!asset) {
      throw createError({
        statusCode: 404,
        message: 'Mandarin reference audio not found.',
      })
    }

    setHeader(event, 'Content-Type', asset.contentType || 'audio/mpeg')
    setHeader(event, 'Content-Length', asset.byteLength)
    setHeader(event, 'Cache-Control', 'public, max-age=31536000, immutable')
    setHeader(event, 'X-Content-Type-Options', 'nosniff')
    return Buffer.from(asset.audioData)
  } catch (error) {
    const handled = errorHandler(error)
    event.node.res.statusCode = handled.statusCode || 500
    return {
      success: false,
      statusCode: handled.statusCode || 500,
      message: handled.message || 'Failed to load Mandarin reference audio.',
    }
  }
})
