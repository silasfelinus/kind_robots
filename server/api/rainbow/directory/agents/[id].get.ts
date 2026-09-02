import { createError, defineEventHandler, getRouterParam, setHeader } from 'h3'
import {
  getPublicRainbowAgent,
  getPublicRainbowHuman,
  parsePositiveDirectoryId,
} from '@/server/utils/rainbowDirectory'

export default defineEventHandler(async (event) => {
  setHeader(event, 'Cache-Control', 'public, max-age=60, stale-while-revalidate=300')
  const id = parsePositiveDirectoryId(getRouterParam(event, 'id'), 'agent id')
  const agent = await getPublicRainbowAgent(id)
  if (!agent) {
    throw createError({ statusCode: 404, message: 'Agent profile not found.' })
  }

  const liaison = await getPublicRainbowHuman(agent.userId)
  return {
    success: true,
    agent: {
      id: agent.id,
      name: agent.name,
      avatarImage: agent.avatarImage,
      description: agent.description,
      allowMessages: agent.allowMessages,
      createdAt: agent.createdAt,
      liaison: liaison
        ? {
            id: liaison.id,
            username: liaison.username,
            avatarImage: liaison.avatarImage,
            bio: liaison.bio,
          }
        : null,
    },
  }
})
