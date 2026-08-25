import { defineEventHandler } from 'h3'
import { requireAdminApiUser } from '@/server/utils/authGuard'
import { errorHandler } from '@/server/utils/error'
import { getCthulhuquariumCuration } from '@/server/utils/cthulhuquariumCuration'

export default defineEventHandler(async (event) => {
  try {
    await requireAdminApiUser(event)
    const data = await getCthulhuquariumCuration()
    return { success: true, data, statusCode: 200 }
  } catch (error: unknown) {
    const handled = errorHandler(error)
    const statusCode = handled.statusCode || 500
    event.node.res.statusCode = statusCode
    return {
      success: false,
      message: handled.message || 'Failed to load Cthulhuquarium curation data.',
      statusCode,
    }
  }
})
