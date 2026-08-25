import { defineEventHandler, setHeader } from 'h3'
import { errorHandler } from '../../utils/error'
import { getMandarinCatalog } from '../../utils/mandarinCatalog'

export default defineEventHandler(async (event) => {
  try {
    const catalog = await getMandarinCatalog()
    setHeader(event, 'Cache-Control', 'public, max-age=300, stale-while-revalidate=3600')
    return {
      success: true,
      statusCode: 200,
      message: `${catalog.cards.length} Mandarin cards ready to study.`,
      data: catalog,
    }
  } catch (error: unknown) {
    const handled = errorHandler(error)
    event.node.res.statusCode = handled.statusCode || 500
    return {
      success: false,
      statusCode: handled.statusCode || 500,
      message: handled.message || 'Failed to load the Mandarin starter catalog.',
      data: null,
    }
  }
})
