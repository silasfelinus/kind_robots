import { defineEventHandler, getRouterParam, readBody, setHeader } from 'h3'
import {
  assertAgentMessageRateAllowed,
  parseAgentMessageInput,
  parseAgentMessagePositiveId,
  requireAgentMessageActor,
  requireAgentMessageThread,
  sendAgentMessageInThread,
} from '@/server/utils/agentMessaging'
import { assertAgentMessagePairMaturity } from '@/server/utils/agentMessagingPolicy'
import { errorHandler } from '@/server/utils/error'

type MessageBody = {
  body?: unknown
  clientKey?: unknown
}

export default defineEventHandler(async (event) => {
  setHeader(event, 'Cache-Control', 'no-store')

  try {
    const actor = await requireAgentMessageActor(event)
    assertAgentMessageRateAllowed(event, actor)
    const threadId = parseAgentMessagePositiveId(
      getRouterParam(event, 'threadId'),
      'threadId',
    )
    const thread = await requireAgentMessageThread(threadId, actor)
    await assertAgentMessagePairMaturity({
      humanUserId: thread.humanUserId,
      agentProfileId: thread.agentProfileId,
    })

    const body = (await readBody<MessageBody>(event)) ?? {}
    const message = parseAgentMessageInput(body)
    const result = await sendAgentMessageInThread({ actor, threadId, ...message })

    event.node.res.statusCode = result.created ? 201 : 200
    return {
      success: true,
      ...result,
      message: result.created
        ? 'Message stored.'
        : 'Existing message returned for this clientKey.',
    }
  } catch (error: unknown) {
    const handled = errorHandler(error)
    event.node.res.statusCode = handled.statusCode ?? 500
    return { success: false, message: handled.message }
  }
})
