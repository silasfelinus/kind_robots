import { defineEventHandler, getQuery, getRouterParam, setHeader } from 'h3'
import {
  listAgentMessages,
  parseAgentMessageListLimit,
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
    const query = getQuery(event)
    const limit = parseAgentMessageListLimit(query.limit)
    const beforeId =
      query.beforeId === undefined || query.beforeId === null || query.beforeId === ''
        ? null
        : parseAgentMessagePositiveId(query.beforeId, 'beforeId')

    const result = await listAgentMessages({ actor, threadId, limit, beforeId })
    return { success: true, ...result }
  } catch (error: unknown) {
    const handled = errorHandler(error)
    event.node.res.statusCode = handled.statusCode ?? 500
    return { success: false, message: handled.message }
  }
})
