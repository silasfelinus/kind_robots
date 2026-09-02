import { createError, defineEventHandler, readBody } from 'h3'
import { errorHandler } from '@/server/utils/error'
import { requireHumanOrRainbowApiUser } from '@/server/utils/authGuard'
import { setRainbowDirectoryPreference } from '@/server/utils/rainbowDirectory'

type PreferenceBody = {
  isPublic?: unknown
  allowMessages?: unknown
}

function requiredBoolean(value: unknown, label: string): boolean {
  if (typeof value !== 'boolean') {
    throw createError({ statusCode: 400, message: `${label} must be a boolean.` })
  }
  return value
}

export default defineEventHandler(async (event) => {
  try {
    const auth = await requireHumanOrRainbowApiUser(event)
    const body = (await readBody<PreferenceBody>(event)) ?? {}
    const preference = await setRainbowDirectoryPreference({
      userId: auth.user.id,
      isPublic: requiredBoolean(body.isPublic, 'isPublic'),
      allowMessages: requiredBoolean(body.allowMessages, 'allowMessages'),
    })
    return { success: true, preference }
  } catch (error) {
    const { message, statusCode } = errorHandler(error)
    event.node.res.statusCode = statusCode || 500
    return { success: false, message: message || 'Failed to update directory preference.' }
  }
})
