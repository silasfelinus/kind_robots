import { defineEventHandler } from 'h3'
import { errorHandler } from '@/server/utils/error'
import { requireHumanOrRainbowApiUser } from '@/server/utils/authGuard'
import { getRainbowDirectoryPreference } from '@/server/utils/rainbowDirectory'

export default defineEventHandler(async (event) => {
  try {
    const auth = await requireHumanOrRainbowApiUser(event)
    const preference = await getRainbowDirectoryPreference(auth.user.id)
    return { success: true, preference }
  } catch (error) {
    const { message, statusCode } = errorHandler(error)
    event.node.res.statusCode = statusCode || 500
    return { success: false, message: message || 'Failed to load directory preference.' }
  }
})
