import { defineEventHandler } from 'h3'
import { requireAdminApiUser } from '@/server/utils/authGuard'
import { getMandarinCurationData } from '@/server/utils/mandarinCatalogCuration'
import { errorHandler } from '@/server/utils/error'

export default defineEventHandler(async (event) => {
  try {
    await requireAdminApiUser(event)
    const data = await getMandarinCurationData()
    return {
      success: true,
      message: 'Mandarin catalog curation loaded.',
      data,
      statusCode: 200,
    }
  } catch (error: unknown) {
    const handled = errorHandler(error)
    const statusCode = handled.statusCode || 500
    event.node.res.statusCode = statusCode
    return {
      success: false,
      message: handled.message || 'Failed to load Mandarin catalog curation.',
      statusCode,
    }
  }
})
