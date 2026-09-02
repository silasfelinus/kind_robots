import { createError, defineEventHandler, readBody, setHeader } from 'h3'
import { errorHandler } from '@/server/utils/error'
import { requireHumanOrRainbowApiUser } from '@/server/utils/authGuard'
import { setRainbowNotificationPreference } from '@/server/utils/rainbowNotifications'

type PreferenceBody = {
  agentAttention?: unknown
  forumReplyMention?: unknown
  scheduledAgentFailure?: unknown
}

function requiredBoolean(value: unknown, label: string): boolean {
  if (typeof value !== 'boolean') {
    throw createError({ statusCode: 400, message: `${label} must be a boolean.` })
  }
  return value
}

export default defineEventHandler(async (event) => {
  setHeader(event, 'Cache-Control', 'no-store')

  try {
    const auth = await requireHumanOrRainbowApiUser(event)
    const body = (await readBody<PreferenceBody>(event)) ?? {}
    const preference = await setRainbowNotificationPreference({
      userId: auth.user.id,
      agentAttention: requiredBoolean(body.agentAttention, 'agentAttention'),
      forumReplyMention: requiredBoolean(body.forumReplyMention, 'forumReplyMention'),
      scheduledAgentFailure: requiredBoolean(
        body.scheduledAgentFailure,
        'scheduledAgentFailure',
      ),
    })
    return { success: true, preference }
  } catch (error) {
    const { message, statusCode } = errorHandler(error)
    event.node.res.statusCode = statusCode || 500
    return {
      success: false,
      message: message || 'Failed to update Rainbow notification preferences.',
    }
  }
})
