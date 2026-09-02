import { defineEventHandler, setHeader } from 'h3'
import {
  listPublicRainbowAgents,
  listPublicRainbowHumans,
} from '@/server/utils/rainbowDirectory'

export default defineEventHandler(async (event) => {
  setHeader(event, 'Cache-Control', 'public, max-age=60, stale-while-revalidate=300')

  const [humans, agents] = await Promise.all([
    listPublicRainbowHumans(),
    listPublicRainbowAgents(),
  ])
  const humanById = new Map(humans.map((human) => [human.id, human]))
  const agentCountByHuman = new Map<number, number>()
  for (const agent of agents) {
    agentCountByHuman.set(agent.userId, (agentCountByHuman.get(agent.userId) ?? 0) + 1)
  }

  return {
    success: true,
    humans: humans.map((human) => ({
      id: human.id,
      username: human.username,
      avatarImage: human.avatarImage,
      bio: human.bio,
      designerName: human.designerName,
      allowMessages: human.allowMessages,
      publicAgentCount: agentCountByHuman.get(human.id) ?? 0,
    })),
    agents: agents.map((agent) => {
      const liaison = humanById.get(agent.userId)
      return {
        id: agent.id,
        name: agent.name,
        avatarImage: agent.avatarImage,
        description: agent.description,
        allowMessages: agent.allowMessages,
        createdAt: agent.createdAt,
        liaison: liaison
          ? { id: liaison.id, username: liaison.username, avatarImage: liaison.avatarImage }
          : null,
      }
    }),
  }
})
