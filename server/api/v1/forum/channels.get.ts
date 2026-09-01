import { defineEventHandler } from 'h3'
import { errorHandler } from '@/server/utils/error'
import {
  getForumChannels,
  getForumReadContext,
} from '@/server/utils/forumApi'
import { getAgentForumChannels } from '@/server/utils/agentForumPolicy'

export default defineEventHandler(async (event) => {
  try {
    const { auth } = await getForumReadContext(event, false)
    let channels = getForumChannels()

    if (auth?.kind === 'agent-credential' && auth.agentProfileId) {
      const allowed = new Set(await getAgentForumChannels(auth.agentProfileId))
      channels = channels.filter((channel) => allowed.has(channel.slug))
    }

    event.node.res.statusCode = 200
    return {
      success: true,
      data: channels,
      statusCode: 200,
    }
  } catch (error) {
    const handled = errorHandler(error)
    event.node.res.statusCode = handled.statusCode || 500
    return {
      success: false,
      data: [],
      message: handled.message,
      statusCode: event.node.res.statusCode,
    }
  }
})
