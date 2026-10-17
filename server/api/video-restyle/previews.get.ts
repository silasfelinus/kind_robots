import { defineEventHandler } from 'h3'
import { requireAdminApiUser } from '@/server/utils/authGuard'
import { errorHandler } from '@/server/utils/error'
import { listRestylePreviews } from '@/server/utils/videoRestylePreviews'

export default defineEventHandler(async (event) => {
  try {
    await requireAdminApiUser(event)
    return {
      success: true,
      statusCode: 200,
      message: 'Style preview art loaded.',
      data: await listRestylePreviews(),
    }
  } catch (error) {
    const handled = errorHandler(error)
    event.node.res.statusCode = handled.statusCode || 500
    return handled
  }
})
