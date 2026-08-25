import { defineEventHandler, setHeader } from 'h3'
import { errorHandler } from '../../utils/error'
import { getMandarinIllustrationManifest } from '../../utils/mandarinIllustrationManifest'

export default defineEventHandler(async (event) => {
  try {
    const manifest = await getMandarinIllustrationManifest()
    setHeader(event, 'Cache-Control', 'public, max-age=300, stale-while-revalidate=3600')
    return {
      success: true,
      statusCode: 200,
      message: `${manifest.selection.illustrationCards} Mandarin illustration prompts ready across ${manifest.selection.totalCards} core cards.`,
      data: manifest,
    }
  } catch (error: unknown) {
    const handled = errorHandler(error)
    event.node.res.statusCode = handled.statusCode || 500
    return {
      success: false,
      statusCode: handled.statusCode || 500,
      message: handled.message || 'Failed to build the Mandarin illustration manifest.',
      data: null,
    }
  }
})
