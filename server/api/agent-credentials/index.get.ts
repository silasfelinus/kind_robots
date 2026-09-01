// /server/api/agent-credentials/index.get.ts
// List the current user's agent credentials. Never returns a secret or hash.
import { defineEventHandler } from 'h3'
import { errorHandler } from '../../utils/error'
import { requireHumanOrRainbowApiUser } from '@/server/utils/authGuard'
import { listAgentCredentials } from '@/server/utils/agentCredentials'

export default defineEventHandler(async (event) => {
  try {
    const auth = await requireHumanOrRainbowApiUser(event)
    const credentials = await listAgentCredentials(auth.user.id)

    return { success: true, credentials }
  } catch (error) {
    const { message, statusCode } = errorHandler(error)
    event.node.res.statusCode = statusCode || 500

    return { success: false, message: message || 'Failed to list credentials.' }
  }
})
