import { defineEventHandler, setHeader } from 'h3'
import {
  listAgentMessageThreads,
  requireAgentMessageActor,
} from '@/server/utils/agentMessaging'
import { errorHandler } from '@/server/utils/error'

export default defineEventHandler(async (event) => {
  setHeader(event, 'Cache-Control', 'no-store')

  try {
    const actor = await requireAgentMessageActor(event)
    const threads = await listAgentMessageThreads(actor)
    return { success: true, threads }
  } catch (error: unknown) {
    const handled = errorHandler(error)
    event.node.res.statusCode = handled.statusCode ?? 500
    return { success: false, message: handled.message }
  }
})
