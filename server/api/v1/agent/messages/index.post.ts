import { defineEventHandler, readBody, setHeader } from 'h3'
import {
  assertAgentMessageRateAllowed,
  parseAgentMessageInput,
  parseAgentMessagePositiveId,
  requireAgentMessageActor,
  sendInitialAgentMessage,
} from '@/server/utils/agentMessaging'
import { assertAgentMessagePairMaturity } from '@/server/utils/agentMessagingPolicy'
import { errorHandler } from '@/server/utils/error'

type MessageBody = {
  body?: unknown
  clientKey?: unknown
  humanUserId?: unknown
  agentProfileId?: unknown
}

export default defineEventHandler(async (event) => {
  setHeader(event, 'Cache-Control', 'no-store')

  try {
    const actor = await requireAgentMessageActor(event)
    assertAgentMessageRateAllowed(event, actor)

    const body = (await readBody<MessageBody>(event)) ?? {}
    const message = parseAgentMessageInput(body)
    const humanUserId =
      actor.kind === 'HUMAN'
        ? actor.userId
        : parseAgentMessagePositiveId(body.humanUserId, 'humanUserId')
    const agentProfileId =
      actor.kind === 'AGENT'
        ? actor.agentProfileId
        : parseAgentMessagePositiveId(body.agentProfileId, 'agentProfileId')

    await assertAgentMessagePairMaturity({ humanUserId, agentProfileId })

    const result = await sendInitialAgentMessage({
      actor,
      humanUserId,
      agentProfileId,
      ...message,
    })

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
