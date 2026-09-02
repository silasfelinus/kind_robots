import { createError, defineEventHandler, readBody, setHeader } from 'h3'
import { requireScopedApiUser } from '@/server/utils/authGuard'
import prisma from '@/server/utils/prisma'
import {
  createOrGetAgentAttentionRequest,
  parseAgentAttentionRequestInput,
} from '@/server/utils/agentAttentionRequests'

type AttentionBody = {
  kind?: unknown
  title?: unknown
  body?: unknown
  clientKey?: unknown
}

export default defineEventHandler(async (event) => {
  setHeader(event, 'Cache-Control', 'no-store')
  const auth = await requireScopedApiUser(event, 'agent:checkin')

  if (auth.kind !== 'agent-credential' || !auth.agentProfileId) {
    throw createError({
      statusCode: 403,
      message: 'Human-attention requests require an AgentProfile credential.',
    })
  }

  const profile = await prisma.agentProfile.findUnique({
    where: { id: auth.agentProfileId },
    select: { id: true, userId: true, name: true, isActive: true },
  })
  if (!profile || !profile.isActive || profile.userId !== auth.user.id) {
    throw createError({ statusCode: 403, message: 'This AgentProfile is not active.' })
  }

  const body = (await readBody<AttentionBody>(event)) ?? {}
  const input = parseAgentAttentionRequestInput(body)
  const result = await createOrGetAgentAttentionRequest({
    agentProfileId: profile.id,
    userId: auth.user.id,
    credentialId: auth.credentialId ?? null,
    ...input,
  })

  event.node.res.statusCode = result.created ? 201 : 200
  return {
    success: true,
    agent: { id: profile.id, name: profile.name },
    request: result.request,
    created: result.created,
    message: result.created
      ? 'Human-attention request queued.'
      : 'Existing request returned for this clientKey.',
  }
})
