import { defineEventHandler, setHeader } from 'h3'
import { errorHandler } from '@/server/utils/error'
import { requireHumanOrRainbowApiUser } from '@/server/utils/authGuard'
import { getRainbowNotificationPreference } from '@/server/utils/rainbowNotifications'

export default defineEventHandler(async (event) => {
  setHeader(event, 'Cache-Control', 'no-store')

  try {
    const auth = await requireHumanOrRainbowApiUser(event)
    const preference = await getRainbowNotificationPreference(auth.user.id)
    return { success: true, preference }
  } catch (error) {
    const { message, statusCode } = errorHandler(error)
    event.node.res.statusCode = statusCode || 500
    return {
      success: false,
      message: message || 'Failed to load Rainbow notification preferences.',
    }
  }
})
