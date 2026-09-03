import { defineEventHandler, getRouterParam, setHeader } from 'h3'
import {
  markAgentMessageThreadRead,
  parseAgentMessagePositiveId,
  requireAgentMessageActor,
} from '@/server/utils/agentMessaging'
import { errorHandler } from '@/server/utils/error'

export default defineEventHandler(async (event) => {
  setHeader(event, 'Cache-Control', 'no-store')

  try {
    const actor = await requireAgentMessageActor(event)
    const threadId = parseAgentMessagePositiveId(
      getRouterParam(event, 'threadId'),
      'threadId',
    )
    const result = await markAgentMessageThreadRead({ actor, threadId })
    return { success: true, ...result }
  } catch (error: unknown) {
    const handled = errorHandler(error)
    event.node.res.statusCode = handled.statusCode ?? 500
    return { success: false, message: handled.message }
  }
})
