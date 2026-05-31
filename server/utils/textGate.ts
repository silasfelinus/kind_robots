// /server/utils/textGate.ts
import type { H3Event } from 'h3'
import { createError } from 'h3'
import prisma from './prisma'
import { manaGate } from './manaGate'

type TextGateInput = {
  model?: string | null
  maxTokens?: number | null
  serverId?: number | null
  provider?: string | null
}

type TextGateResult = {
  user: {
    id: number
  }
  cost: number
  free: boolean
  commit: (
    refId: string,
    providerCostUsd?: number,
  ) => Promise<{ balance: number }>
}

export async function authAndTextGate(
  event: H3Event,
  input: TextGateInput = {},
): Promise<TextGateResult> {
  const authorizationHeader = event.node.req.headers.authorization

  if (!authorizationHeader?.startsWith('Bearer ')) {
    throw createError({
      statusCode: 401,
      message:
        'Authorization token is required in the format "Bearer <token>".',
    })
  }

  const token = authorizationHeader.split(' ')[1] ?? ''

  const user = await prisma.user.findFirst({
    where: {
      apiKey: token,
    },
    select: {
      id: true,
    },
  })

  if (!user) {
    throw createError({
      statusCode: 401,
      message: 'Invalid or expired authorization token.',
    })
  }

  const gate = await manaGate(event, {
    kind: 'text',
    estCostUsd: estimateTextCostUsd({
      model: input.model,
      maxTokens: input.maxTokens,
      provider: input.provider,
    }),
    serverId: input.serverId ?? null,
  })

  return {
    user,
    cost: gate.cost,
    free: gate.free,
    commit: gate.commit,
  }
}

function estimateTextCostUsd(input: {
  model?: string | null
  maxTokens?: number | null
  provider?: string | null
}): number {
  const model = input.model?.toLowerCase() || ''
  const provider = input.provider?.toLowerCase() || ''
  const maxTokens = Math.max(1, input.maxTokens ?? 1024)

  if (provider === 'anthropic' || model.includes('claude')) {
    return (maxTokens / 1_000_000) * 15
  }

  if (model.includes('gpt-4') || model.includes('o4') || model.includes('o3')) {
    return (maxTokens / 1_000_000) * 10
  }

  return (maxTokens / 1_000_000) * 2
}
