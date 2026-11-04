import { defineEventHandler } from 'h3'
import { requireAdminApiUser } from '@/server/utils/authGuard'
import { errorHandler } from '@/server/utils/error'
import { loadColoringRenderOptions } from '@/server/utils/coloringBookRenderOptions'

// Engines, catalog checkpoints and LoRAs the coloring studio can render with.
export default defineEventHandler(async (event) => {
  try {
    await requireAdminApiUser(event)
    const data = await loadColoringRenderOptions()
    return {
      success: true,
      message: `${data.checkpoints.length} checkpoints and ${data.loras.length} LoRAs available.`,
      data,
      statusCode: 200,
    }
  } catch (error: unknown) {
    const handled = errorHandler(error)
    const statusCode = handled.statusCode || 500
    event.node.res.statusCode = statusCode
    return {
      success: false,
      message: handled.message || 'Failed to load render options.',
      statusCode,
    }
  }
})
