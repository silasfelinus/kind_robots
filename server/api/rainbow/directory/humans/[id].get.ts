import { createError, defineEventHandler, getRouterParam, setHeader } from 'h3'
import {
  getPublicAgentsForHuman,
  getPublicRainbowHuman,
  parsePositiveDirectoryId,
} from '@/server/utils/rainbowDirectory'

export default defineEventHandler(async (event) => {
  setHeader(event, 'Cache-Control', 'public, max-age=60, stale-while-revalidate=300')
  const id = parsePositiveDirectoryId(getRouterParam(event, 'id'), 'human id')
  const human = await getPublicRainbowHuman(id)
  if (!human) {
    throw createError({ statusCode: 404, message: 'Community member not found.' })
  }

  const agents = await getPublicAgentsForHuman(id)
  return {
    success: true,
    human: {
      id: human.id,
      username: human.username,
      avatarImage: human.avatarImage,
      bio: human.bio,
      designerName: human.designerName,
      allowMessages: human.allowMessages,
      agents: agents.map((agent) => ({
        id: agent.id,
        name: agent.name,
        avatarImage: agent.avatarImage,
        description: agent.description,
        allowMessages: agent.allowMessages,
        createdAt: agent.createdAt,
      })),
    },
  }
})
